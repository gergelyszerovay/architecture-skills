#!/usr/bin/env node
// new-package: makes a package from one of the skills' package templates.
//
//   new-package <node|three> <dir> --name <package> --tier <prototype|product> --kind <app|lib>
//               [--private] [--dep <name>=<specifier>]...
//
// A template is a folder `skills/<skill>/assets/<architecture>-package-skeleton/` that holds a
// `template.json` and overlay folders. The overlays are applied in this order, a later file
// replacing an earlier one at the same path: `base/`, `tier-<tier>/`, `kind-<kind>/`,
// `<tier>-<kind>/` (each optional). The package's `package.json` is composed from the overlays'
// `package.patch.json` files by JSON merge patch (RFC 7386, `null` deletes), so no file of a
// template is named `package.json`. `_gitignore` becomes `.gitignore`.
//
// The template's token (`example`) is replaced by the package name without its scope, in file
// contents and paths: `Example` becomes PascalCase, `example` followed by an uppercase letter
// camelCase, any other `example` kebab-case; a word that merely contains it (`examples`) is left
// alone. The value `$SELF_VERSION` of a dependency becomes `^<this package's version>`.
//
// Plain Node, no dependencies.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The overlay folders of a variant, in the order they are applied. */
export const overlayOrder = (tier, kind) => [
  'base',
  `tier-${tier}`,
  `kind-${kind}`,
  `${tier}-${kind}`,
];

const USAGE =
  'Usage: new-package <node|three> <dir> --name <package> --tier <prototype|product> --kind <app|lib> [--private] [--dep <name>=<specifier>]...\n';

/** The value in a `package.patch.json` that stands for `^<the skills package's version>`. */
export const SELF_VERSION = '$SELF_VERSION';

/** A refusal: a message for the person, no stack. */
export class Refusal extends Error {}

/**
 * Finds the templates of the skills package.
 * @param {string} packageRoot - The skills package's folder.
 * @returns {{ architecture: string, directory: string, config: object }[]} Each template found
 * as `skills/*\/assets/*-package-skeleton/template.json`.
 */
export function listTemplates(packageRoot) {
  const found = [];
  const skills = join(packageRoot, 'skills');
  for (const skill of readdirSync(skills, { withFileTypes: true })) {
    if (!skill.isDirectory()) continue;
    const assets = join(skills, skill.name, 'assets');
    if (!existsSync(assets)) continue;
    for (const asset of readdirSync(assets, { withFileTypes: true })) {
      const config = join(assets, asset.name, 'template.json');
      if (asset.isDirectory() && asset.name.endsWith('-package-skeleton') && existsSync(config)) {
        found.push({
          architecture: JSON.parse(readFileSync(config, 'utf8')).architecture,
          directory: join(assets, asset.name),
          config: JSON.parse(readFileSync(config, 'utf8')),
        });
      }
    }
  }
  return found;
}

/**
 * Converts a kebab-case name to PascalCase or camelCase.
 * @param {string} kebab - The name, such as `my-tool`.
 * @param {boolean} pascal - Whether the first letter is uppercase.
 * @returns {string} `MyTool` or `myTool`.
 */
export function caseOf(kebab, pascal) {
  const words = kebab.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  const joined = words.join('');
  return pascal ? joined : joined.charAt(0).toLowerCase() + joined.slice(1);
}

/**
 * Replaces the template's token in a text.
 * @param {string} text - The file content or path.
 * @param {string} token - The token the template uses (`example`).
 * @param {string} name - The package name without its scope, in kebab-case.
 * @returns {string} The text with `Example` as PascalCase, `example` before an uppercase letter
 * as camelCase and any other `example` as kebab-case; `examples` and the like are left alone.
 */
export function replaceToken(text, token, name) {
  const capital = token.charAt(0).toUpperCase() + token.slice(1);
  return text
    .replaceAll(new RegExp(`${capital}(?![a-z0-9])`, 'g'), caseOf(name, true))
    .replaceAll(new RegExp(`(?<![A-Za-z0-9])${token}(?=[A-Z])`, 'g'), caseOf(name, false))
    .replaceAll(new RegExp(`(?<![A-Za-z0-9])${token}(?![a-z0-9])`, 'g'), name);
}

/**
 * Applies a JSON merge patch (RFC 7386).
 * @param {unknown} target - The document.
 * @param {unknown} patch - The patch; `null` deletes a key.
 * @returns {unknown} The patched document.
 */
export function mergePatch(target, patch) {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) return patch;
  const result =
    typeof target === 'object' && target !== null && !Array.isArray(target) ? { ...target } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key];
    else result[key] = mergePatch(result[key], value);
  }
  return result;
}

const listFiles = (directory, prefix = '') =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => (left.name < right.name ? -1 : 1))
    .flatMap((entry) =>
      entry.isDirectory()
        ? listFiles(join(directory, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    );

/**
 * Computes the files of a package made from a template.
 * @param {{ templateDirectory: string, config: object, name: string, tier: string, kind: string, isPrivate?: boolean, deps?: Record<string, string>, selfVersion: string }} options -
 * The template, the package name (scoped or not), the variant, `--private`, the `--dep`
 * overrides and the skills package's version.
 * @returns {Map<string, string>} The package's files by relative path, `package.json` included.
 */
export function composePackage({
  templateDirectory,
  config,
  name,
  tier,
  kind,
  isPrivate = false,
  deps = {},
  selfVersion,
}) {
  const variant = (config.variants ?? []).find((v) => v.tier === tier && v.kind === kind);
  const refused = (config.refused ?? []).find((v) => v.tier === tier && v.kind === kind);
  if (refused !== undefined) {
    throw new Refusal(
      `the ${config.architecture} template does not offer --tier ${tier} --kind ${kind}: ${refused.reason}`,
    );
  }
  if (variant === undefined) {
    const offered = (config.variants ?? []).map((v) => `${v.tier}/${v.kind}`).join(', ');
    throw new Refusal(
      `the ${config.architecture} template does not offer --tier ${tier} --kind ${kind} (it offers ${offered})`,
    );
  }
  if (!/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    throw new Refusal(
      `the package name "${name}" must be an npm name with a lowercase scope (@scope/name) or none, ending in a kebab-case name (lowercase letters, digits and hyphens)`,
    );
  }
  const bare = name.replace(/^@[^/]+\//, '');
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(bare)) {
    throw new Refusal(
      `the package name "${name}" must end in a kebab-case name (lowercase letters, digits and hyphens)`,
    );
  }
  const files = new Map();
  let patched = {};
  for (const overlay of overlayOrder(tier, kind)) {
    const root = join(templateDirectory, overlay);
    if (!existsSync(root)) continue;
    for (const path of listFiles(root)) {
      const text = readFileSync(join(root, path), 'utf8');
      if (path === 'package.patch.json') {
        patched = mergePatch(patched, JSON.parse(replaceToken(text, config.token, bare)));
        continue;
      }
      const target = replaceToken(path, config.token, bare).replace(
        /(^|\/)_gitignore$/,
        '$1.gitignore',
      );
      files.set(target, replaceToken(text, config.token, bare));
    }
  }
  let pkg = { ...patched, name };
  if (isPrivate || patched.private === true) {
    // `private` sits after the version, where a person would write it
    const { version, ...rest } = { ...pkg, private: undefined };
    delete rest.name;
    delete rest.private;
    pkg = { name, ...(version === undefined ? {} : { version }), private: true, ...rest };
  }
  const declared = new Set();
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    for (const [dependency, specifier] of Object.entries(pkg[section] ?? {})) {
      declared.add(dependency);
      if (specifier === SELF_VERSION) pkg[section][dependency] = `^${selfVersion}`;
    }
  }
  for (const [dependency, specifier] of Object.entries(deps)) {
    if (!declared.has(dependency)) {
      throw new Refusal(
        `--dep ${dependency}=${specifier}: the template declares no dependency ${dependency} (it declares ${[...declared].join(', ') || 'none'})`,
      );
    }
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (pkg[section]?.[dependency] !== undefined) pkg[section][dependency] = specifier;
    }
  }
  files.set('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  return files;
}

/**
 * Writes composed files into a new or empty folder.
 * @param {string} directory - The package's folder.
 * @param {Map<string, string>} files - The files by relative path.
 */
export function writePackage(directory, files) {
  if (existsSync(directory) && !statSync(directory).isDirectory()) {
    throw new Refusal(`${directory} is a file`);
  }
  if (existsSync(directory) && readdirSync(directory).length > 0) {
    throw new Refusal(`${directory} is not empty`);
  }
  for (const [path, text] of files) {
    const target = join(directory, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
}

/**
 * Reads the `packages` globs of the nearest `pnpm-workspace.yaml` above a folder.
 * @param {string} directory - The package's folder.
 * @returns {{ root: string, globs: string[] } | undefined} The workspace root and its globs, or
 * undefined when no folder above holds the file.
 */
export function findWorkspace(directory) {
  for (let dir = dirname(resolve(directory)); ; dir = dirname(dir)) {
    const file = join(dir, 'pnpm-workspace.yaml');
    if (existsSync(file)) {
      const globs = [];
      let inPackages = false;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (/^packages\s*:/.test(line)) inPackages = true;
        else if (/^\S/.test(line)) inPackages = false;
        else if (inPackages) {
          const item = line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*(#.*)?$/);
          if (item !== null) globs.push(item[1]);
        }
      }
      return { root: dir, globs };
    }
    if (dirname(dir) === dir) return undefined;
  }
}

/**
 * Tests a workspace glob (`packages/*`, `apps/**`, `!excluded`) against a relative path.
 * @param {string} glob - The glob.
 * @param {string} path - The path, with `/` separators.
 * @returns {boolean} Whether the glob matches the path.
 */
export function globMatches(glob, path) {
  const expression = glob
    .replace(/^\.\//, '')
    .replace(/\/$/, '')
    .split('/')
    .map((part) => (part === '**' ? '.*' : part.replaceAll('*', '[^/]*')))
    .join('/');
  return new RegExp(`^${expression}$`).test(path);
}

/**
 * Lists what is left for the person after the package is written.
 * @param {{ directory: string, config: object, tier: string }} options - The package's folder, the template and the tier.
 * @returns {string[]} The lines to print.
 */
export function followUps({ directory, config, tier }) {
  const lines = [];
  const workspace = findWorkspace(directory);
  if (workspace === undefined) {
    lines.push('no pnpm-workspace.yaml above the folder: add one that lists it');
  } else {
    const path = relative(workspace.root, resolve(directory)).split(sep).join('/');
    const included = workspace.globs
      .filter((g) => !g.startsWith('!'))
      .some((g) => globMatches(g, path));
    if (!included) {
      lines.push(`add '${path}' to the packages of ${join(workspace.root, 'pnpm-workspace.yaml')}`);
    }
  }
  lines.push(`run pnpm install, then pnpm --filter <name> run lint`);
  if (config.profile !== undefined) {
    let installed = false;
    for (let dir = dirname(resolve(directory)); ; dir = dirname(dir)) {
      if (existsSync(join(dir, '.claude', 'skills', config.profile))) installed = true;
      if (installed || dirname(dir) === dir) break;
    }
    if (!installed) {
      lines.push(
        `run pnpm exec install-skills in the repository: the checks load the profile from .claude/skills/${config.profile}/`,
      );
    }
  }
  let catalogDir;
  for (let dir = dirname(resolve(directory)); ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'markdown-schema-templates'))) {
      catalogDir = join(dir, 'markdown-schema-templates');
      break;
    }
    if (dirname(dir) === dir) break;
  }
  const missing = (config.catalog?.[tier] ?? []).filter(
    (template) => catalogDir === undefined || !existsSync(join(catalogDir, template)),
  );
  if (missing.length > 0) {
    lines.push(
      `link the catalog templates ${missing.join(', ')} in a markdown-schema-templates/ folder above the package (markdown-schema skill, "Binding")`,
    );
  }
  return lines;
}

/**
 * Parses the command line.
 * @param {string[]} args - The arguments after the command name.
 * @returns {{ architecture: string, dir: string, name: string, tier: string, kind: string, isPrivate: boolean, deps: Record<string, string> } | { help: true }}
 * The options.
 */
export function parseArguments(args) {
  const positional = [];
  const options = { isPrivate: false, deps: {} };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = () => {
      const next = args[index + 1];
      if (next === undefined || next.startsWith('--')) throw new Refusal(`${arg} needs a value`);
      index += 1;
      return next;
    };
    if (arg === '--help' || arg === '-h') return { help: true };
    else if (arg === '--name') {
      if (options.name !== undefined) throw new Refusal('--name is given twice');
      options.name = value();
    } else if (arg === '--tier') options.tier = value();
    else if (arg === '--kind') options.kind = value();
    else if (arg === '--private') options.isPrivate = true;
    else if (arg === '--dep') {
      const pair = value();
      const at = pair.indexOf('=');
      if (at <= 0 || at === pair.length - 1)
        throw new Refusal(`--dep ${pair}: expected <name>=<specifier>`);
      options.deps[pair.slice(0, at)] = pair.slice(at + 1);
    } else if (arg.startsWith('--')) throw new Refusal(`unknown option ${arg}`);
    else positional.push(arg);
  }
  const [architecture, dir, ...rest] = positional;
  if (architecture === undefined || dir === undefined || rest.length > 0) {
    throw new Refusal('expected <node|three> <dir>');
  }
  for (const key of ['name', 'tier', 'kind']) {
    if (options[key] === undefined) throw new Refusal(`--${key} is required`);
  }
  if (!['prototype', 'product'].includes(options.tier))
    throw new Refusal('--tier is prototype or product');
  if (!['app', 'lib'].includes(options.kind)) throw new Refusal('--kind is app or lib');
  return { architecture, dir, ...options };
}

/**
 * Runs the command.
 * @param {string[]} args - The arguments after the command name.
 * @param {string} [packageRoot] - The skills package's folder; this script's by default.
 * @returns {number} The exit code: 0, 1 for a refusal, 2 for a usage error.
 */
export function main(args, packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')) {
  let options;
  try {
    options = parseArguments(args);
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    process.stderr.write(`new-package: ${error.message}\n${USAGE}`);
    return 2;
  }
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  try {
    const templates = listTemplates(packageRoot);
    const template = templates.find((t) => t.architecture === options.architecture);
    if (template === undefined) {
      throw new Refusal(
        `no template for "${options.architecture}" (templates: ${templates.map((t) => t.architecture).join(', ')})`,
      );
    }
    const selfVersion = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;
    const files = composePackage({
      templateDirectory: template.directory,
      config: template.config,
      name: options.name,
      tier: options.tier,
      kind: options.kind,
      isPrivate: options.isPrivate,
      deps: options.deps,
      selfVersion,
    });
    const directory = resolve(options.dir);
    writePackage(directory, files);
    process.stdout.write(
      `new-package: ${options.name} (${options.architecture}, ${options.tier} ${options.kind}): ${files.size} files into ${directory}\n`,
    );
    for (const line of followUps({ directory, config: template.config, tier: options.tier })) {
      process.stdout.write(`  - ${line}\n`);
    }
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    process.stderr.write(`new-package: ${error.message}\n`);
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main(process.argv.slice(2));
}
