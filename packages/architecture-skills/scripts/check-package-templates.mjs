#!/usr/bin/env node
// The instantiation check of the package templates (reviewer2 constitution of the lab, D33):
// makes a temporary workspace, creates every variant of every template into it with
// `new-package`, installs, and runs every script each variant declares. No instance of a template
// is committed, so this is what shows a template still works.
//
//   node scripts/check-package-templates.mjs [--only <template/tier-kind>] [--keep]
//
// The workspace is outside every workspace of the repository, so a variant that needs more than
// the two local packages (`--dep` links them: this skills package and markdown-schema) fails here.
// The three.js template is self-contained: it links no runtime package.
// Dependencies resolve with one `pnpm install --prefer-offline`: the content-addressable store
// the repository's installs filled is used first, and the registry only for what it lacks
// (`pnpm install --offline` does not resolve the optional native binaries of oxlint and rolldown
// from the metadata cache). Exits 1 on any failure. Plain Node, no dependencies.

import { spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composePackage, listTemplates } from './new-package.mjs';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repository = join(packageRoot, '..', '..');

/** The installer, resolved from its package (a devDependency of this one), never by a path out of this package. */
const installSkills = join(
  dirname(createRequire(import.meta.url).resolve('@gergelyszerovay/install-skills/package.json')),
  'bin',
  'install-skills.mjs',
);

/** The documents of the catalog the templates' docs bind to, copied into the workspace. */
const CATALOG = [
  ['node-block-architecture', 'node-package'],
  ['node-block-architecture', 'node-lib'],
  ['three-block-architecture', 'three-package'],
  ['three-block-architecture', 'three-lib'],
];

/** Where the packages a variant links are, by dependency name. */
const LINKS = {
  '@gergelyszerovay/architecture-skills': packageRoot,
  // markdown-schema is a devDependency from the registry: the installed copy is what a variant links.
  '@gergelyszerovay/markdown-schema': realpathSync(
    join(packageRoot, 'node_modules', '@gergelyszerovay', 'markdown-schema'),
  ),
};

/**
 * Collects the `allowBuilds` entries of the repository's workspace (its root), so the variants' installs
 * may run the same build scripts.
 * @returns {string} The `allowBuilds:` block for the temporary workspace's `pnpm-workspace.yaml`.
 */
function allowBuilds() {
  const entries = new Map();
  for (const workspace of ['.']) {
    const file = join(repository, workspace, 'pnpm-workspace.yaml');
    if (!existsSync(file)) continue;
    let inBlock = false;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/^allowBuilds\s*:/.test(line)) inBlock = true;
      else if (/^\S/.test(line)) inBlock = false;
      else if (inBlock) {
        const entry = line.match(/^\s+('?[^':#\s]+'?)\s*:\s*(true|false)\s*(#.*)?$/);
        if (entry !== null && !entries.has(entry[1])) entries.set(entry[1], entry[2]);
      }
    }
  }
  return `allowBuilds:\n${[...entries].map(([name, value]) => `  ${name}: ${value}`).join('\n')}\n`;
}

/**
 * Finds a Chromium for the browser specs.
 * @returns {string | undefined} Its path, or undefined when none is found.
 */
function findChromium() {
  return [
    process.env.CHROMIUM_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find((candidate) => candidate !== undefined && existsSync(candidate));
}

/**
 * Shortens a failing script's output: its head, where the first error usually is, and its tail.
 * @param {string} output - The output.
 * @returns {string} The first 15 and the last 40 lines.
 */
function excerpt(output) {
  const lines = output.split('\n');
  return lines.length <= 55
    ? output
    : [...lines.slice(0, 15), `… ${lines.length - 55} lines left out …`, ...lines.slice(-40)].join(
        '\n',
      );
}

/**
 * Runs a command to its end.
 * @param {string} command - The program.
 * @param {string[]} args - Its arguments.
 * @param {{ cwd: string, env?: NodeJS.ProcessEnv }} options - Where and with which environment.
 * @returns {{ ok: boolean, output: string, seconds: number }} The outcome.
 */
function run(command, args, { cwd, env = process.env }) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout}${result.stderr}`,
    seconds: (Date.now() - started) / 1000,
  };
}

/**
 * Starts a long-running script and waits for its first sign of life, then stops it.
 * @param {string[]} args - The pnpm arguments.
 * @param {string} cwd - The workspace.
 * @param {RegExp} ready - What its output shows once it runs.
 * @returns {Promise<{ ok: boolean, output: string, seconds: number }>} The outcome.
 */
function runUntilReady(args, cwd, ready) {
  const started = Date.now();
  return new Promise((done) => {
    const child = spawn('pnpm', args, { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let finished = false;
    const finish = (ok) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        // already gone
      }
      done({ ok, output, seconds: (Date.now() - started) / 1000 });
    };
    const collect = (chunk) => {
      output += chunk.toString();
      if (ready.test(output)) finish(true);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('close', () => finish(ready.test(output)));
    const timer = setTimeout(() => finish(false), 60_000);
  });
}

/**
 * Runs the check.
 * @param {string[]} args - The command-line arguments.
 * @returns {Promise<number>} The exit code.
 */
async function main(args) {
  const keep = args.includes('--keep');
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
  for (const [name, path] of Object.entries(LINKS)) {
    if (!existsSync(path)) {
      process.stderr.write(
        `check-package-templates: ${name} is not at ${path}; run it in the repository\n`,
      );
      return 1;
    }
  }
  const templates = listTemplates(packageRoot);
  const variants = templates
    .flatMap((template) =>
      template.config.variants.map((v) => ({
        template,
        id: `${template.architecture}/${v.tier}-${v.kind}`,
        tier: v.tier,
        kind: v.kind,
        name: `${template.architecture === 'node' ? 'n' : 't'}-${v.tier === 'prototype' ? 'proto' : 'prod'}-${v.kind}`,
      })),
    )
    .filter((variant) => only === undefined || variant.id === only);
  if (variants.length === 0) {
    process.stderr.write('check-package-templates: no variant selected\n');
    return 1;
  }
  const failures = [];
  const log = (line) => process.stdout.write(`${line}\n`);
  const workspace = mkdtempSync(join(tmpdir(), 'package-templates-'));
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    writeFileSync(
      join(workspace, 'package.json'),
      `${JSON.stringify({ name: 'package-templates-check', private: true, type: 'module', packageManager: pkg.packageManager, devEngines: pkg.devEngines, devDependencies: { [pkg.name]: `link:${packageRoot}` }, installSkills: [pkg.name] }, null, 2)}\n`,
    );
    writeFileSync(
      join(workspace, 'pnpm-workspace.yaml'),
      `packages:\n  - 'n-*'\n  - 't-*'\n\n${allowBuilds()}`,
    );
    // the scope lives on GitHub Packages; the token comes from the session's or the user's npmrc
    writeFileSync(
      join(workspace, '.npmrc'),
      '@gergelyszerovay:registry=https://npm.pkg.github.com\n',
    );
    mkdirSync(join(workspace, 'markdown-schema-templates'));
    for (const [skill, template] of CATALOG) {
      cpSync(
        join(packageRoot, 'skills', skill, 'markdown-schema-templates', template),
        join(workspace, 'markdown-schema-templates', template),
        { recursive: true, dereference: true },
      );
    }

    const links = [];
    for (const variant of variants) {
      const composed = JSON.parse(
        composePackage({
          templateDirectory: variant.template.directory,
          config: variant.template.config,
          name: variant.name,
          tier: variant.tier,
          kind: variant.kind,
          selfVersion: pkg.version,
        }).get('package.json'),
      );
      const declared = new Set(
        ['dependencies', 'devDependencies', 'peerDependencies'].flatMap((s) =>
          Object.keys(composed[s] ?? {}),
        ),
      );
      const depArgs = Object.entries(LINKS)
        .filter(([name]) => declared.has(name))
        .flatMap(([name, path]) => ['--dep', `${name}=link:${path}`]);
      const made = run(
        process.execPath,
        [
          join(packageRoot, 'scripts', 'new-package.mjs'),
          variant.template.architecture,
          join(workspace, variant.name),
          '--name',
          variant.name,
          '--tier',
          variant.tier,
          '--kind',
          variant.kind,
          ...depArgs,
        ],
        { cwd: workspace },
      );
      log(`${made.ok ? 'ok  ' : 'FAIL'} ${variant.id} new-package`);
      if (!made.ok) {
        failures.push({ what: `${variant.id} new-package`, output: made.output });
        continue;
      }
      links.push(variant);
    }

    const installed = run('pnpm', ['install', '--prefer-offline'], { cwd: workspace });
    log(
      `${installed.ok ? 'ok  ' : 'FAIL'} pnpm install --prefer-offline (${installed.seconds.toFixed(1)}s)`,
    );
    if (!installed.ok) {
      failures.push({ what: 'pnpm install', output: installed.output });
    } else {
      const skills = run(process.execPath, [installSkills, '--root', workspace], {
        cwd: workspace,
      });
      log(`${skills.ok ? 'ok  ' : 'FAIL'} install-skills`);
      if (!skills.ok) failures.push({ what: 'install-skills', output: skills.output });
      const chromium = findChromium();
      for (const variant of links) {
        const scripts = Object.keys(
          JSON.parse(readFileSync(join(workspace, variant.name, 'package.json'), 'utf8')).scripts,
        );
        for (const script of scripts) {
          // `format` rewrites the files; `format:check` is the check
          if (script === 'format') continue;
          if (script === 'test:browser' && chromium === undefined) {
            log(`skip ${variant.id} ${script} (no Chromium found)`);
            continue;
          }
          const env = {
            ...process.env,
            ...(chromium === undefined ? {} : { CHROMIUM_PATH: chromium }),
          };
          // `dev` of a prototype app is `portless`, which needs the proxy of a lab; its `dev:app` is the server
          if (script === 'dev' && scripts.includes('dev:app')) {
            log(`skip ${variant.id} dev (portless needs a proxy; dev:app runs)`);
            continue;
          }
          const outcome =
            script === 'dev' || script === 'dev:app'
              ? await runUntilReady(
                  ['--filter', variant.name, 'run', script],
                  workspace,
                  variant.template.architecture === 'node'
                    ? variant.tier === 'prototype'
                      ? /Listening on http:/u
                      : /Good (morning|afternoon|evening), /u
                    : /Local:|ready in/u,
                )
              : run('pnpm', ['--filter', variant.name, 'run', script], { cwd: workspace, env });
          log(
            `${outcome.ok ? 'ok  ' : 'FAIL'} ${variant.id} ${script} (${outcome.seconds.toFixed(1)}s)`,
          );
          if (!outcome.ok)
            failures.push({ what: `${variant.id} ${script}`, output: outcome.output });
        }
        const binary = (JSON.parse(
          readFileSync(join(workspace, variant.name, 'package.json'), 'utf8'),
        ).bin ?? {})[variant.name];
        if (binary !== undefined) {
          const outcome = run(
            process.execPath,
            [join(workspace, variant.name, binary), '--name', 'Ada'],
            { cwd: workspace },
          );
          const ok = outcome.ok && /^Good (morning|afternoon|evening), Ada$/mu.test(outcome.output);
          log(`${ok ? 'ok  ' : 'FAIL'} ${variant.id} bin ${binary}`);
          if (!ok) failures.push({ what: `${variant.id} bin`, output: outcome.output });
        }
      }
    }
  } finally {
    if (keep) log(`kept ${workspace}`);
    else rmSync(workspace, { recursive: true, force: true });
  }
  for (const { what, output } of failures) {
    process.stderr.write(`\n--- ${what}\n${excerpt(output)}\n`);
  }
  log(
    failures.length === 0
      ? 'check-package-templates: all variants pass'
      : `check-package-templates: ${failures.length} failure(s)`,
  );
  return failures.length === 0 ? 0 : 1;
}

process.exitCode = await main(process.argv.slice(2));
