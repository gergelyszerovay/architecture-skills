#!/usr/bin/env node
// Checks the `file-naming` profile rule of three-block-architecture (constitution D13, D14):
// every source file under a lib's `src/lib/` has a block suffix of the profile, its primary
// declaration, kebab-cased, equals the stem (or `<stem>-<suffix>`), and it exports one
// function, class or value, or else one type. Specs (`.spec.ts`) and `.d.ts` files are skipped.
//
// The suffix set is the Blocks table of the skill's own profile
// (`three-block-architecture.architecture-profile.md`, beside this folder), read without a
// Markdown parser so the script needs no dependency.
//
// Usage: node <skill>/scripts/check-names.mjs <package-dir>...
//   Prints one finding per line and exits 1 when there is any.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const profilePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'three-block-architecture.architecture-profile.md',
);

/** The block names of the profile's Blocks table: `| .model.ts | …` → `model`. */
const profileSuffixes = (markdown) => {
  const blocks = markdown.split(/^## /m).find((section) => section.startsWith('4. Blocks'));
  return new Set(
    [...(blocks ?? '').matchAll(/^\| \.([a-z][a-z-]*)\.ts\s/gm)].map(([, name]) => name),
  );
};

const suffixes = profileSuffixes(readFileSync(profilePath, 'utf8'));

const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

function sourcesOf(pkg) {
  const libs = join(pkg, 'libs');
  const files = [];
  // A host-only app (a playground that imports its engine from a package) has no libs.
  if (!existsSync(libs)) return files;
  for (const lib of readdirSync(libs)) {
    const lib_ = join(libs, lib, 'src', 'lib');
    try {
      files.push(...walk(lib_));
    } catch {
      // a lib without sources
    }
  }
  return files.filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.d.ts'));
}

function declarationsOf(source) {
  const values = [];
  const types = [];
  const pattern =
    /^export\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(async\s+function\*?|function\*?|class|const|let|enum|type|interface)\s+([A-Za-z_$][\w$]*)/gm;
  for (const [, kind, name] of source.matchAll(pattern)) {
    (kind === 'type' || kind === 'interface' ? types : values).push(name);
  }
  return { values, types };
}

const findings = [];
for (const pkg of process.argv.slice(2)) {
  if (!existsSync(pkg)) {
    findings.push(`${pkg}: the package directory does not exist`);
    continue;
  }
  for (const file of sourcesOf(pkg)) {
    const parts = basename(file, '.ts').split('.');
    const suffix = parts.length > 1 ? parts.at(-1) : undefined;
    const stem = parts.slice(0, -1).join('.');
    if (!suffix || !suffixes.has(suffix)) {
      findings.push(`${file}: no block suffix`);
      continue;
    }
    const { values, types } = declarationsOf(readFileSync(file, 'utf8'));
    if (values.length > 1) {
      findings.push(
        `${file}: exports ${values.length} functions, classes or values (${values.join(', ')})`,
      );
      continue;
    }
    if (values.length === 0 && types.length > 1) {
      findings.push(`${file}: exports ${types.length} types (${types.join(', ')})`);
      continue;
    }
    const primary = values[0] ?? types[0];
    if (!primary) continue;
    const name = kebab(primary);
    if (name !== stem && name !== `${stem}-${suffix}`) {
      findings.push(`${file}: primary declaration ${primary} does not match the file name`);
    }
  }
}

for (const finding of findings) console.error(finding);
if (findings.length > 0) {
  console.error(`${findings.length} naming finding(s)`);
  process.exit(1);
}
