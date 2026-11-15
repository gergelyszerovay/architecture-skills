#!/usr/bin/env node
// Checks the units of a three-block-architecture package (constitution D64). A unit is a lib with
// a `unit.json` beside its barrel: the lib that `lab add` copies between labs as source. The
// check runs in the package's `lint`, like `check-names`, and mirrors what `lab check` and
// `lab add` judge, plus what only the package knows:
//   - `unit.json` reads as a unit manifest (keys, `unit: 1`, `name` equal to the lib's folder,
//     the architecture binding, a plain role, ranges of the runtime, the peers and the vendors);
//   - it names the profile of the package's own binding, at a version the installed profile can
//     take (the `Version` of the profile the package's binding finds, not a `version` the
//     binding still names: a binding names no version; architecture-skills plan 0002);
//   - `runtime` lists only dependencies of the package, and `role` is the role of the lib doc;
//   - the lib has its lib doc (`layered-docs/1.<lib>.three-lib.md`), which travels with it;
//   - the lib imports only itself, the libs of the package that are units, the packages
//     `unit.json` declares (`runtime`, `peers`, `dependencies`) and units of other kits of the same
//     product, as `<package>/<lib>`; nothing that leaves the lib; `peers` and `dependencies` name
//     no package of the lab (`runtime` may);
//   - a kit whose unit is imported holds only units and none of the role `engine`, is listed in the
//     package's `dependencies`, does not depend back on the package (no cycles between kits) and
//     has an `exports['./<lib>']` entry for the unit;
//   - each vendor of `dependencies` is approved in the package doc's Approved Packages table
//     for at least the layers `layers` names.
//
// The rules are the `unit-manifest` and `unit-imports` rows of the skill's own profile
// (`three-block-architecture.architecture-profile.md`, beside this folder; constitution D64): the
// first names the file, the format version and the keys, the second the scope of the imports of
// other kits and whether cycles are refused. This script reads them from the rows, read without a
// Markdown parser so the script needs no dependency.
//
// The import scan is a fitness check, not a boundary: it reads import statements and literal
// `import()` and `require()` calls, and a template-literal `import()` or a `/*` inside a string can
// hide one. The receiver's gate (the dependency rules) is what bounds a lib.
// It reads the files Git tracks in a lib (what `lab add` copies), or walks the lib outside a
// repository, and it never follows a link: a link in a unit is a finding.
//
// A frozen package (`"frozen": { "reason": … }` in its binding) is not judged: the script prints
// `<package name>: frozen (<reason>); not checked against <profile> <installed version>` for it.
//
// Usage: node <skill>/scripts/check-units.mjs <package-dir>...
//   Prints one finding per line and exits 1 when there is any. A package without units passes.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The binding is found as the lint scripts find it; only its file system part is used, so this script
// still needs no markdown-schema.
const { findBoundProfile } = createRequire(import.meta.url)(
  '../../architecture-profile/scripts/load-profile.cjs',
);

/**
 * The installed profile a package's binding finds: its version (the profile's `- Version:` line),
 * and the binding's `frozen`.
 * @param {string} pkg - The package directory.
 * @returns {{ version: string | undefined, frozen: { reason: string } | undefined, packageName: string | undefined, name: string } | { error: string }}
 */
const installedProfileOf = (pkg) => {
  try {
    const bound = findBoundProfile(pkg);
    const version = /^- Version:\s*(\S+)\s*$/m.exec(readFileSync(bound.profilePath, 'utf8'))?.[1];
    return { ...bound, version };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

const profilePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'three-block-architecture.architecture-profile.md',
);

/** The parameters of a structural rule of the profile, by rule name. */
const ruleParameters = (markdown, rule) => {
  const rules = markdown
    .split(/^## /m)
    .find((section) => section.startsWith('5. Structural rules'));
  const row = (rules ?? '')
    .split('\n')
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .find((cells) => cells[1] === rule);
  if (row === undefined) {
    throw new Error(`${profilePath} has no ${rule} row in its Structural rules`);
  }
  return new Map(
    row[2].split(';').map((pair) => {
      const at = pair.indexOf('=');
      return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
    }),
  );
};

/** The parameters of the profile's `unit-manifest` row: the file, the format and the keys. */
const unitManifestRule = (markdown) => {
  const parameters = ruleParameters(markdown, 'unit-manifest');
  return {
    file: parameters.get('file'),
    format: Number(parameters.get('format')),
    keys: (parameters.get('keys') ?? '').split(',').map((key) => key.trim()),
  };
};

/** The parameters of the profile's `unit-imports` row: where other kits' units may be imported from, and cycles. */
const unitImportsRule = (markdown) => {
  const parameters = ruleParameters(markdown, 'unit-imports');
  return { scope: parameters.get('scope'), cycles: parameters.get('cycles') };
};

// The row of the skill's own (current) profile is enough: the row names the file, its format and its
// keys, which the unit format fixes, and every profile version a package can bind (0.3.x) carries
// the same row or none (the format is checked against the unit's own `unit` number).
const PROFILE = readFileSync(profilePath, 'utf8');
const RULE = unitManifestRule(PROFILE);
const IMPORTS_RULE = unitImportsRule(PROFILE);
const MANIFEST = RULE.file;

const WORD = /^[a-z][a-z0-9-]*$/;
const FOLDER = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const RANGE = /^[~^]?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const PACKAGE = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const TOOLING = /^(?:vitest|@vitest\/[a-z-]+)$/;

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a package checked against the installed `receiver` can take a lib written for `unit` (both `x.y.z`). */
const isCompatibleProfileVersion = (unit, receiver) => {
  if (!VERSION.test(unit) || !VERSION.test(receiver)) return false;
  const [uMajor, uMinor, uPatch] = unit.split('.').map(Number);
  const [rMajor, rMinor, rPatch] = receiver.split('.').map(Number);
  if (uMajor !== rMajor) return false;
  if (uMajor === 0) return uMinor === rMinor && rPatch >= uPatch;
  return rMinor > uMinor || (rMinor === uMinor && rPatch >= uPatch);
};

const readRanges = (value, field, problems) => {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    problems.push(`\`${field}\` must map package names to versions`);
    return {};
  }
  const ranges = {};
  for (const [name, range] of Object.entries(value)) {
    if (!PACKAGE.test(name))
      problems.push(`\`${field}\` key ${JSON.stringify(name)} is not a package name`);
    else if (typeof range !== 'string' || !RANGE.test(range)) {
      problems.push(`\`${field}.${name}\` must be an exact, ^ or ~ version such as ^1.2.0`);
    } else ranges[name] = range;
  }
  return ranges;
};

/** The unit manifest in `text`, or its problems. */
const readUnitManifest = (text, lib) => {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return { problems: [`${MANIFEST} is not JSON`] };
  }
  if (!isRecord(value)) return { problems: [`${MANIFEST} must be an object`] };
  const problems = [];
  for (const key of Object.keys(value)) {
    if (!RULE.keys.includes(key)) problems.push(`\`${key}\` is not a key of ${MANIFEST}`);
  }
  if (value.unit !== RULE.format) problems.push(`\`unit\` must be ${String(RULE.format)}`);
  if (typeof value.name !== 'string' || !FOLDER.test(value.name)) {
    problems.push('`name` must be the lib folder name: lower-case words joined by hyphens');
  } else if (value.name !== lib)
    problems.push(`\`name\` is "${value.name}" but the lib folder is "${lib}"`);
  const a = value.architecture;
  if (
    !isRecord(a) ||
    typeof a.profile !== 'string' ||
    !WORD.test(a.profile) ||
    typeof a.version !== 'string' ||
    !VERSION.test(a.version) ||
    Object.keys(a).some((key) => key !== 'profile' && key !== 'version')
  ) {
    problems.push('`architecture` must be { "profile": "<name>", "version": "<x.y.z>" }');
  }
  if (typeof value.role !== 'string' || !WORD.test(value.role)) {
    problems.push('`role` must be the lib role of its lib doc, such as render-kit');
  }
  const runtime = readRanges(value.runtime, 'runtime', problems);
  const peers = readRanges(value.peers, 'peers', problems);
  const dependencies = readRanges(value.dependencies, 'dependencies', problems);
  const layers = {};
  if (value.layers !== undefined) {
    if (!isRecord(value.layers))
      problems.push('`layers` must map each vendor to the layers it is approved for');
    else {
      for (const [name, entry] of Object.entries(value.layers)) {
        if (!(name in dependencies)) {
          problems.push(`\`layers.${name}\` names a package that is not in \`dependencies\``);
        } else if (
          !Array.isArray(entry) ||
          entry.length === 0 ||
          entry.some((layer) => typeof layer !== 'string' || !WORD.test(layer))
        ) {
          problems.push(`\`layers.${name}\` must be a list of layer names`);
        } else layers[name] = entry;
      }
    }
  }
  for (const name of Object.keys(dependencies)) {
    if (layers[name] === undefined && !problems.some((own) => own.includes(`layers.${name}`))) {
      problems.push(`\`dependencies.${name}\` has no entry in \`layers\``);
    }
  }
  return problems.length > 0
    ? { problems }
    : { problems, manifest: { ...value, runtime, peers, dependencies, layers } };
};

/** The module specifiers a source file imports. */
const importSpecifiersOf = (text) => {
  const code = text.replace(/\/\*[\s\S]*?\*\/|^[ \t]*\/\/.*$/gm, '');
  const found = new Set();
  for (const pattern of [
    /\b(?:import|export)\s[^'"`;]*?\sfrom\s*(['"])([^'"\n]+)\1/g,
    /\bimport\s*(['"])([^'"\n]+)\1/g,
    /\b(?:import|require)\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
  ]) {
    for (const match of code.matchAll(pattern)) found.add(match[2]);
  }
  return [...found];
};

/** Sorts the imports of a lib's files into its package's libs, packages and escapes. */
const sortImports = (files) => {
  const libs = new Set();
  const packages = new Set();
  const packageImports = new Set();
  const escapes = new Set();
  for (const { file, specifiers } of files) {
    for (const specifier of specifiers) {
      if (specifier.startsWith('~libs/')) {
        const lib = specifier.slice('~libs/'.length).split('/')[0];
        if (lib === '') escapes.add(`${file}: ${specifier}`);
        else libs.add(lib);
      } else if (specifier.startsWith('.')) {
        const parts = file.split('/').slice(0, -1);
        let out = false;
        for (const part of specifier.split('/')) {
          if (part === '' || part === '.') continue;
          if (part === '..') {
            if (parts.length === 0) out = true;
            else parts.pop();
          } else parts.push(part);
        }
        if (out) escapes.add(`${file}: ${specifier}`);
      } else if (specifier.startsWith('/') || specifier.startsWith('#')) {
        escapes.add(`${file}: ${specifier}`);
      } else {
        const parts = specifier.split('/');
        const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
        if (!PACKAGE.test(name)) escapes.add(`${file}: ${specifier}`);
        else if (!TOOLING.test(name)) {
          packages.add(name);
          packageImports.add(specifier);
        }
      }
    }
  }
  return {
    libs: [...libs].sort(),
    packages: [...packages].sort(),
    packageImports: [...packageImports].sort(),
    escapes: [...escapes].sort(),
  };
};

/**
 * The files of a lib that a copy would carry: the files Git tracks there (what `lab add` copies),
 * or, outside a Git repository, the files found by walking it. A link is never followed: it is
 * returned in `links` and judged as a finding.
 */
const filesOf = (dir) => {
  let relatives;
  try {
    relatives = execFileSync('git', ['ls-files', '-z'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\0')
      .filter(Boolean);
  } catch {
    relatives = undefined;
  }
  const files = [];
  const links = [];
  const take = (path) => {
    if (lstatSync(path).isSymbolicLink()) links.push(path);
    else files.push(path);
  };
  if (relatives !== undefined && relatives.length > 0) {
    for (const relative of relatives) {
      const path = join(dir, relative);
      if (lstatSync(path, { throwIfNoEntry: false }) !== undefined) take(path);
    }
    return { files, links };
  }
  const walk = (folder) => {
    for (const entry of readdirSync(folder)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const path = join(folder, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) links.push(path);
      else if (stat.isDirectory()) walk(path);
      else files.push(path);
    }
  };
  walk(dir);
  return { files, links };
};

/** The rows of the package doc's Approved Packages table: package to the layers it is approved for. */
const approvedPackages = (doc) => {
  const section = doc.split(/^## /m).find((part) => part.startsWith('2. Approved Packages')) ?? '';
  const approved = new Map();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length < 4 || cells[1] === 'Package' || /^-+$/.test(cells[1])) continue;
    approved.set(
      cells[1],
      cells[2]
        .split(',')
        .map((layer) => layer.trim())
        .filter(Boolean),
    );
  }
  return approved;
};

/** The role of a unit, read from its `unit.json`; undefined when it cannot be read. */
const roleOf = (file) => {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return isRecord(parsed) && typeof parsed.role === 'string' ? parsed.role : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The packages of the lab a package lies in, by name: the product (`products/<product>/packages/<name>`,
 * undefined for a prototype, which may lie in a group folder), the libs (`true` for one with a unit.json), the libs whose unit has the
 * role `engine`, the `exports` keys and the names in `dependencies`. A package that lies elsewhere
 * has no lab around it, so the map is empty and nothing counts as a kit.
 */
const labPackages = (pkg) => {
  const here = resolve(pkg);
  const packages = new Map();
  const parent = dirname(here);
  let root;
  if (basename(parent) === 'packages' && basename(dirname(dirname(parent))) === 'products') {
    root = dirname(dirname(dirname(parent)));
  } else if (basename(parent) === 'prototypes') {
    root = dirname(parent);
  } else if (basename(dirname(parent)) === 'prototypes') {
    // a prototype in a group: prototypes/<group>/<name> (lab D8)
    root = dirname(dirname(parent));
  }
  if (root === undefined || IMPORTS_RULE.scope !== 'product') return packages;
  const folders = [];
  const list = (folder) => (existsSync(folder) ? readdirSync(folder) : []);
  for (const product of list(join(root, 'products'))) {
    for (const entry of list(join(root, 'products', product, 'packages'))) {
      folders.push({ product, folder: join(root, 'products', product, 'packages', entry) });
    }
  }
  for (const entry of list(join(root, 'prototypes'))) {
    const folder = join(root, 'prototypes', entry);
    folders.push({ product: undefined, folder });
    // a folder without a package.json may be a group of prototypes (lab D8)
    if (
      !existsSync(join(folder, 'package.json')) &&
      existsSync(folder) &&
      lstatSync(folder).isDirectory()
    ) {
      for (const member of list(folder)) {
        folders.push({ product: undefined, folder: join(folder, member) });
      }
    }
  }
  for (const { product, folder } of folders) {
    const manifestFile = join(folder, 'package.json');
    if (!existsSync(manifestFile) || !lstatSync(folder).isDirectory()) continue;
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    } catch {
      continue;
    }
    if (!isRecord(manifest) || typeof manifest.name !== 'string') continue;
    const libs = new Map();
    const engines = [];
    const libsFolder = join(folder, 'libs');
    if (existsSync(libsFolder)) {
      for (const lib of readdirSync(libsFolder)) {
        if (!lstatSync(join(libsFolder, lib)).isDirectory()) continue;
        const file = join(libsFolder, lib, MANIFEST);
        libs.set(lib, existsSync(file));
        if (libs.get(lib) && roleOf(file) === 'engine') engines.push(lib);
      }
    }
    packages.set(manifest.name, {
      here: folder === here,
      product,
      libs,
      engines,
      exports: isRecord(manifest.exports) ? Object.keys(manifest.exports) : [],
      dependencies: isRecord(manifest.dependencies) ? Object.keys(manifest.dependencies) : [],
    });
  }
  return packages;
};

/** A path of `dependencies` from one package to another among the siblings, or undefined. */
const dependencyPath = (from, to, siblings) => {
  const seen = new Set([from]);
  const queue = [[from]];
  for (let at = queue.shift(); at !== undefined; at = queue.shift()) {
    for (const next of siblings.get(at.at(-1))?.dependencies ?? []) {
      if (next === to) return [...at, next];
      if (!seen.has(next) && siblings.has(next)) {
        seen.add(next);
        queue.push([...at, next]);
      }
    }
  }
  return undefined;
};

/** The findings about the imports of one package of the lab by a unit (constitution D64). */
const kitProblems = (name, specifiers, siblings) => {
  const kit = siblings.get(name);
  if (kit.here) {
    return [
      `imports its own package ${name} by name: a unit imports its package's libs as ~libs/<lib>`,
    ];
  }
  const own = [...siblings].find(([, facts]) => facts.here);
  if (own === undefined || own[1].product === undefined || own[1].product !== kit.product) {
    return [
      `imports ${name}, a package ${kit.product === undefined ? 'that belongs to no product' : `of the product ${kit.product}`}: a unit imports only units of kits of its own product`,
    ];
  }
  const noUnit = [...kit.libs].filter(([, isUnit]) => !isUnit).map(([lib]) => lib);
  if (kit.libs.size === 0 || noUnit.length > 0 || kit.engines.length > 0) {
    const parts = [
      ...(noUnit.length === 0
        ? []
        : [`${noUnit.join(', ')} ${noUnit.length === 1 ? 'is' : 'are'} no unit`]),
      ...(kit.engines.length === 0
        ? []
        : [
            `${kit.engines.join(', ')} ${kit.engines.length === 1 ? 'has' : 'have'} the role engine`,
          ]),
    ];
    return [
      `imports ${name}, which is no kit: ${parts.length === 0 ? 'it has no libs' : parts.join('; ')} (a unit imports only kits, whose libs are all units and none an engine)`,
    ];
  }
  const problems = [];
  if (!own[1].dependencies.includes(name)) {
    problems.push(`imports ${name}, which the package does not list in its dependencies`);
  }
  const back =
    IMPORTS_RULE.cycles === 'refused' ? dependencyPath(name, own[0], siblings) : undefined;
  if (back !== undefined) {
    problems.push(
      `imports ${name}, which depends back on the package (${[own[0], ...back].join(' -> ')}): kits do not form cycles`,
    );
  }
  for (const specifier of specifiers) {
    const parts = specifier.split('/');
    const count = name.startsWith('@') ? 2 : 1;
    if (parts.slice(0, count).join('/') !== name) continue;
    const rest = parts.slice(count);
    if (rest.length === 0) {
      problems.push(
        `imports ${name} by its barrel: a unit imports one unit of a kit, as ${name}/<lib>`,
      );
    } else if (rest.length > 1) {
      problems.push(
        `imports ${specifier}: a unit imports a unit of a kit only as ${name}/${rest[0]}, never a path inside it`,
      );
    } else if (!kit.libs.has(rest[0])) {
      problems.push(`imports ${specifier}, but ${name} has no lib ${rest[0]}`);
    } else if (!kit.exports.includes(`./${rest[0]}`)) {
      problems.push(
        `imports ${specifier}, but ${name} has no exports['./${rest[0]}'] (the kit exposes a unit that another kit imports as a subpath export, with a src/${rest[0]}.ts re-export)`,
      );
    }
  }
  return problems;
};

/** The findings about the units of one package. */
const checkPackage = (pkg) => {
  const findings = [];
  const manifestPath = join(pkg, 'package.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const binding = isRecord(manifest.architecture) ? manifest.architecture : {};
  const libsFolder = join(pkg, 'libs');
  let installed;
  if (binding.frozen !== undefined) {
    installed = installedProfileOf(pkg);
    if ('error' in installed) return [`${manifestPath}: ${installed.error}`];
    console.log(
      `${installed.packageName ?? pkg}: frozen (${installed.frozen.reason}); not checked against ${installed.name} ${installed.version ?? 'an unknown version'}`,
    );
    return findings;
  }
  if (!existsSync(libsFolder)) return findings;
  const dependencyNames = new Set(
    ['dependencies', 'peerDependencies', 'devDependencies'].flatMap((field) =>
      isRecord(manifest[field]) ? Object.keys(manifest[field]) : [],
    ),
  );
  const libs = new Map(
    readdirSync(libsFolder)
      .filter((lib) => lstatSync(join(libsFolder, lib)).isDirectory())
      .map((lib) => [lib, existsSync(join(libsFolder, lib, MANIFEST))]),
  );
  const siblings = labPackages(pkg);
  const docFolder = join(pkg, 'layered-docs');
  const packageDoc = existsSync(docFolder)
    ? readdirSync(docFolder).find((name) => name.endsWith('.three-package.md'))
    : undefined;
  const approved =
    packageDoc === undefined
      ? undefined
      : approvedPackages(readFileSync(join(docFolder, packageDoc), 'utf8'));

  for (const [lib, isUnit] of libs) {
    if (!isUnit) continue;
    const file = join(libsFolder, lib, MANIFEST);
    const report = (message) => findings.push(`${file}: ${message}`);
    const reading = readUnitManifest(readFileSync(join(libsFolder, lib, MANIFEST), 'utf8'), lib);
    if (reading.manifest === undefined) {
      for (const problem of reading.problems) report(problem);
      continue;
    }
    const unit = reading.manifest;
    if (binding.profile !== unit.architecture.profile) {
      report(
        `names the profile ${unit.architecture.profile}, but the package binds ${typeof binding.profile === 'string' ? binding.profile : 'none'}`,
      );
    } else {
      installed ??= installedProfileOf(pkg);
      if ('error' in installed) {
        report(`cannot be compared with the installed profile: ${installed.error}`);
      } else if (
        installed.version === undefined ||
        !isCompatibleProfileVersion(unit.architecture.version, installed.version)
      ) {
        report(
          `was written for ${unit.architecture.profile} ${unit.architecture.version}, which the installed profile (at ${installed.version ?? 'no version'}) cannot take`,
        );
      }
    }
    for (const name of Object.keys(unit.runtime)) {
      if (!dependencyNames.has(name))
        report(`lists ${name} as runtime, which is no dependency of the package`);
    }
    const docPath = join(libsFolder, lib, 'layered-docs', `1.${lib}.three-lib.md`);
    if (!existsSync(docPath)) {
      report(
        `the lib has no lib doc layered-docs/1.${lib}.three-lib.md, which travels with a unit`,
      );
    } else {
      const role = /^- Role:\s*(\S+)\s*$/m.exec(readFileSync(docPath, 'utf8'))?.[1];
      if (role !== unit.role) {
        report(`has role ${unit.role}, but its lib doc says ${role ?? 'no role'}`);
      }
    }
    const sources = [];
    const carried = filesOf(join(libsFolder, lib));
    for (const link of carried.links) {
      report(
        `${relative(join(libsFolder, lib), link)} is a symbolic link, which a unit may not carry`,
      );
    }
    for (const path of carried.files) {
      if (SOURCE.test(path)) {
        sources.push({
          file: relative(join(libsFolder, lib), path).split('\\').join('/'),
          specifiers: importSpecifiersOf(readFileSync(path, 'utf8')),
        });
      }
    }
    const imports = sortImports(sources);
    for (const needed of imports.libs) {
      if (needed === lib) continue;
      if (!libs.has(needed)) report(`imports ~libs/${needed}, which the package does not have`);
      else if (!libs.get(needed))
        report(`imports ~libs/${needed}, which is no unit (it has no ${MANIFEST})`);
    }
    for (const escape of imports.escapes) report(`${escape} reaches outside the lib ${lib}`);
    const declared = new Set([
      ...Object.keys(unit.runtime),
      ...Object.keys(unit.peers),
      ...Object.keys(unit.dependencies),
    ]);
    for (const field of ['peers', 'dependencies']) {
      for (const name of Object.keys(unit[field])) {
        if (siblings.has(name)) {
          report(
            `lists ${name} in ${field}, which is a package of the lab: a unit takes the code of another package only as ${name}/<lib> or ~libs/<lib>, and an engine only as the runtime`,
          );
        }
      }
    }
    for (const name of imports.packages) {
      if (declared.has(name)) continue;
      if (siblings.has(name)) {
        for (const problem of kitProblems(name, imports.packageImports, siblings)) {
          report(problem);
        }
      } else {
        report(
          `imports ${name}, which ${MANIFEST} lists in none of runtime, peers or dependencies`,
        );
      }
    }
    if (approved !== undefined) {
      for (const [name, wanted] of Object.entries(unit.layers)) {
        const has = approved.get(name);
        if (has === undefined) {
          report(`vendor ${name} is not in the Approved Packages of ${packageDoc}`);
        } else {
          const missing = wanted.filter((layer) => !has.includes(layer));
          if (missing.length > 0) {
            report(
              `vendor ${name} is approved in ${packageDoc} for ${has.join(', ')}, not for ${missing.join(', ')}`,
            );
          }
        }
      }
    }
  }
  return findings;
};

const findings = [];
for (const pkg of process.argv.slice(2)) {
  if (!existsSync(pkg)) findings.push(`${pkg}: the package directory does not exist`);
  else findings.push(...checkPackage(pkg));
}
for (const finding of findings) console.error(finding);
if (findings.length > 0) {
  console.error(`${findings.length} unit finding(s)`);
  process.exit(1);
}
