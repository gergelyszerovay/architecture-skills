#!/usr/bin/env node
// Checks the `block-placement` profile rule: a file whose suffix names a profile block
// sits in a folder its block allows. The rule's parameters map a layer, or a single block
// by name, to the folders allowed for it (`driving=adapters-driving; router=adapters-driving, app`);
// a block entry overrides its layer's. A file is in a folder when that folder is one of
// its path segments; a folder written with a trailing slash (`entry=src/`) is the file's
// parent folder itself, so the file sits directly in it. Blocks whose layer and name are both unlisted aren't checked, and
// neither are test files, unless the profile makes the test suffix a block (as the
// product profile does with `.spec.ts`).
//
// Usage: node check-block-placement.mjs <package-dir> [--roots libs,app]
//   <package-dir> must bind to a profile in its package.json ("architecture"); a frozen
//   binding prints one line and exits 0.
//   --roots: the folders to scan, relative to the package; defaults to `libs` plus the
//   composition-root rule's folder, or, when neither exists, every top-level folder.
//   Root-level files such as `tsdown.config.ts` are never scanned.
// Exits 1 when any finding is reported.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const { frozenLine, loadBoundProfile } = require('./load-profile.cjs');
const { vendorRoots } = require('./vendor-roots.cjs');

const packageDir = resolve(process.argv[2] ?? '.');
const profile = loadBoundProfile(packageDir);
// A frozen package is not checked against the profile: one line says so (load-profile.cjs).
const frozen = frozenLine(profile, packageDir);
if (frozen !== undefined) {
  console.log(frozen);
  process.exit(0);
}

const rule = profile.structuralRules.find((r) => r.rule === 'block-placement');
if (rule === undefined) {
  console.log(`${profile.name} has no block-placement rule; nothing to check.`);
  process.exit(0);
}

const parameters = (row) =>
  Object.fromEntries(
    (row.parameters === 'none' ? '' : row.parameters)
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const at = pair.indexOf('=');
        return [
          pair.slice(0, at).trim(),
          pair
            .slice(at + 1)
            .split(',')
            .map((dir) => dir.trim()),
        ];
      }),
  );
const placement = parameters(rule);

const rootsArg = process.argv.indexOf('--roots');
const compositionDir = profile.structuralRules
  .find((r) => r.rule === 'composition-root')
  ?.parameters.match(/(?:^|;\s*)dir=([^;]+)/)?.[1]
  .trim();
const SKIP = new Set(['node_modules', 'dist']);
const topLevelFolders = () =>
  readdirSync(packageDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIP.has(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => entry.name);
const defaultRoots = ['libs', ...(compositionDir === undefined ? [] : [compositionDir])].filter(
  (root) => existsSync(join(packageDir, root)),
);
const roots =
  rootsArg !== -1
    ? process.argv[rootsArg + 1].split(',')
    : defaultRoots.length > 0
      ? defaultRoots
      : topLevelFolders();
// A vendor root of the package doc is a vendored package, not this package's code.
const vendorDirs = new Set(
  vendorRoots(profile, packageDir).map((root) => join(packageDir, root.directory)),
);
const listFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith('.')) return [];
    const path = join(dir, name);
    if (vendorDirs.has(path)) return [];
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const findings = [];
let checked = 0;
for (const root of roots) {
  const rootDir = join(packageDir, root);
  if (!existsSync(rootDir)) continue;
  for (const file of listFiles(rootDir)) {
    const block = profile.blocks.find((b) => file.endsWith(b.suffix));
    if (block === undefined) continue;
    const allowed = placement[block.name] ?? placement[block.layer];
    if (allowed === undefined) continue;
    checked += 1;
    const path = relative(packageDir, file);
    const folders = path.split(sep).slice(0, -1);
    const isIn = (dir) =>
      dir.endsWith('/') ? folders.at(-1) === dir.slice(0, -1) : folders.includes(dir);
    if (!allowed.some(isIn)) {
      findings.push(
        `${path}: ${block.suffix} (${block.layer}) belongs ${allowed.some((d) => d.endsWith('/')) ? 'directly ' : ''}in ${allowed.map((d) => (d.endsWith('/') ? d : `${d}/`)).join(' or ')}`,
      );
    }
  }
}

for (const finding of findings) console.log(finding);
console.log(
  `block-placement (${rule.decisions.join(', ')}): ${checked} files checked, ${findings.length} finding(s).`,
);
process.exit(findings.length === 0 ? 0 : 1);
