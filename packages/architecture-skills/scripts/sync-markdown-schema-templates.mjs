#!/usr/bin/env node
// Syncs the template catalog of the skills package (`markdown-schema-templates/`): one relative
// symbolic link per template folder of the skills (`skills/<skill>/markdown-schema-templates/<name>`),
// so a document anywhere in the package binds to every skill template by name, and
// nothing else. The skills' template folders are the source; the catalog only links them.
//
//   node scripts/sync-markdown-schema-templates.mjs           # rewrite the catalog's links
//   node scripts/sync-markdown-schema-templates.mjs --check   # fail on drift, change nothing
//
// Before plan 0128 this script mirrored the legacy `layered-doc-templates/` into the archived
// `reviewer/` tree; both are archived, so it now keeps the catalog of the live templates.
// Plain Node, no dependencies.
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(packageRoot, 'markdown-schema-templates');

/**
 * Lists the template folders of the skills, keyed by template name.
 * @returns {Map<string, string>} Each name with its link target, relative to the catalog.
 */
function wantedLinks() {
  const wanted = new Map();
  const skills = join(packageRoot, 'skills');
  for (const skill of readdirSync(skills).sort()) {
    const templates = join(skills, skill, 'markdown-schema-templates');
    if (!existsSync(templates)) continue;
    for (const name of readdirSync(templates).sort()) {
      const folder = join(templates, name);
      if (lstatSync(folder).isSymbolicLink() || !lstatSync(folder).isDirectory()) continue;
      if (!existsSync(join(folder, `${name}.template.md`))) continue;
      if (wanted.has(name)) {
        throw new Error(
          `Two skills hold the template "${name}": ${wanted.get(name)} and ${skill}.`,
        );
      }
      wanted.set(name, `../skills/${skill}/markdown-schema-templates/${name}`);
    }
  }
  return wanted;
}

/**
 * Lists the catalog's current entries.
 * @returns {Map<string, string | undefined>} Each entry with its link target (undefined when it is
 *   not a symbolic link).
 */
function currentLinks() {
  const current = new Map();
  if (!existsSync(CATALOG)) return current;
  for (const name of readdirSync(CATALOG).sort()) {
    const path = join(CATALOG, name);
    current.set(name, lstatSync(path).isSymbolicLink() ? readlinkSync(path) : undefined);
  }
  return current;
}

const wanted = wantedLinks();
const current = currentLinks();
const drift = [];
for (const [name, target] of wanted) {
  if (!current.has(name)) drift.push(`missing:  ${name} -> ${target}`);
  else if (current.get(name) !== target) drift.push(`differs:  ${name} -> ${current.get(name)}`);
}
for (const name of current.keys()) {
  if (!wanted.has(name)) drift.push(`stale:    ${name}`);
}

if (process.argv.includes('--check')) {
  if (drift.length > 0) {
    console.error(
      'The template catalog (markdown-schema-templates of the skills package) is out of date:',
    );
    for (const line of drift) console.error(`  ${line}`);
    console.error('\nrun: pnpm templates:sync   (in the skills package)');
    process.exit(1);
  }
  console.log(`The template catalog is up to date (${wanted.size} templates).`);
} else {
  mkdirSync(CATALOG, { recursive: true });
  for (const name of current.keys()) {
    if (!wanted.has(name) || current.get(name) !== wanted.get(name)) {
      rmSync(join(CATALOG, name), { recursive: true, force: true });
    }
  }
  for (const [name, target] of wanted) {
    if (current.get(name) !== target) symlinkSync(target, join(CATALOG, name));
  }
  console.log(`Synced the template catalog: ${wanted.size} templates, ${drift.length} changed.`);
}
