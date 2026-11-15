#!/usr/bin/env node
// Checks the `entry-excludes-package` profile rule of three-block-architecture (constitution
// D2, D3, D6): the built `.d.ts` of a package entry imports from none of the excluded
// packages, so a host that uses that entry needs no `three` and sees no three.js type.
// Relative imports inside the built output (shared declaration chunks) are followed; imports
// of other packages are not, so a type re-exported through another package's entry that
// itself imports `three` goes unreported (the guideline's rule is to import contract types
// from such a package's `three`-free entry).
//
// The entry and the packages come from the rule's Parameters in the skill's own profile
// (`entry=.; packages=three`), read without a Markdown parser; `--entry` and `--packages`
// override them for a package whose host-facing entry is another one (such as a shared kit's
// `./contract`). A package matches itself and its subpaths (`three` matches `three/tsl`).
//
// Usage: node <skill>/scripts/check-host-tier.mjs <package-dir> [--entry <subpath>] [--packages <a,b>]
//   Run after the package is built. Prints one finding per line and exits 1 when there is any.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const profilePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'three-block-architecture.architecture-profile.md',
);

/** `entry=.; packages=three` from the profile's `entry-excludes-package` row. */
const ruleParameters = (markdown) => {
  const row = /^\| entry-excludes-package\s*\|([^|]*)\|/m.exec(markdown);
  if (row === null) throw new Error(`${profilePath} has no entry-excludes-package rule.`);
  return Object.fromEntries(
    row[1]
      .split(';')
      .map((pair) => pair.trim().split('='))
      .filter((pair) => pair.length === 2)
      .map(([key, value]) => [key.trim(), value.trim()]),
  );
};

const option = (name) => {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
};

const defaults = ruleParameters(readFileSync(profilePath, 'utf8'));
const packageDir = resolve(process.argv[2] ?? '.');
const entry = option('entry') ?? defaults.entry;
const excluded = (option('packages') ?? defaults.packages)
  .split(',')
  .map((name) => name.trim())
  .filter((name) => name.length > 0);

/** The declaration file an `exports` entry points at. */
const typesOf = (target) => {
  if (typeof target === 'string') return target.replace(/\.(m?)js$/, '.d.$1ts');
  if (target === null || typeof target !== 'object') return undefined;
  if (typeof target.types === 'string') return target.types;
  for (const condition of ['import', 'default', 'require']) {
    const nested = typesOf(target[condition]);
    if (nested !== undefined) return nested;
  }
  return undefined;
};

const specifiers = (source) =>
  [
    ...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...source.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm),
  ].map(([, specifier]) => specifier);

/** `./chunk.js` from `dist/index.d.ts` → `dist/chunk.d.ts`, whichever form exists. */
const resolveRelative = (from, specifier) => {
  const base = resolve(dirname(from), specifier);
  const stem = base.replace(/\.(m?)(j|t)s$/, '');
  return [base, `${stem}.d.ts`, `${stem}.d.mts`, join(base, 'index.d.ts')].find(
    (path) => existsSync(path) && path.endsWith('.ts'),
  );
};

const findings = [];
const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
const exportsField = typeof pkg.exports === 'object' && pkg.exports !== null ? pkg.exports : {};
const types = typesOf(
  entry === '.' && typeof pkg.exports === 'string' ? pkg.exports : exportsField[entry],
);
const display = (path) => relative(process.cwd(), path) || '.';

if (types === undefined) {
  findings.push(`${display(packageDir)}: package.json exports no "${entry}" entry with types`);
} else if (!existsSync(join(packageDir, types))) {
  findings.push(
    `${display(packageDir)}: ${types} (entry "${entry}") does not exist; build the package first`,
  );
} else {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const specifier of specifiers(readFileSync(file, 'utf8'))) {
      if (specifier.startsWith('.')) {
        const next = resolveRelative(file, specifier);
        if (next !== undefined) visit(next);
        continue;
      }
      const hit = excluded.find((name) => specifier === name || specifier.startsWith(`${name}/`));
      if (hit !== undefined) {
        findings.push(
          `${display(file)}: entry "${entry}" of ${pkg.name} imports "${specifier}" (entry-excludes-package: ${hit})`,
        );
      }
    }
  };
  visit(join(packageDir, types));
}

for (const finding of findings) console.error(finding);
if (findings.length > 0) {
  console.error(`${findings.length} host-tier finding(s)`);
  process.exit(1);
}
