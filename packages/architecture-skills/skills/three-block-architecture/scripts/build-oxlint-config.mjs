#!/usr/bin/env node
// Builds the oxlint config of the `no-symbol` profile rule of three-block-architecture
// (constitution D11): one override per restricted block suffix, setting
// `no-restricted-globals` to the rule's symbols. oxlint reports a global that is read as well
// as one that is called, which a call-based rule would miss (`window.innerWidth`).
//
// The symbols and blocks come from the rule's Parameters in the skill's own profile, read
// without a Markdown parser. The output is committed as `assets/oxlint-no-symbol.json`; a
// package's `.oxlintrc.json` extends it after the repository's own config.
//
// Usage: node <skill>/scripts/build-oxlint-config.mjs [--check]
//   Writes the asset; with --check, exits 1 when the committed asset differs instead.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const profilePath = join(skillDir, 'three-block-architecture.architecture-profile.md');
const assetPath = join(skillDir, 'assets', 'oxlint-no-symbol.json');

const row = /^\| no-symbol\s*\|([^|]*)\|/m.exec(readFileSync(profilePath, 'utf8'));
if (row === null) throw new Error(`${profilePath} has no no-symbol rule.`);
const parameters = Object.fromEntries(
  row[1]
    .split(';')
    .map((pair) => pair.trim().split('='))
    .map(([key, value]) => [key.trim(), value.split(',').map((item) => item.trim())]),
);

// oxlint rejects unknown top-level keys (`$comment`), so the asset carries no header.
const config = {
  overrides: parameters.blocks.map((block) => ({
    files: [`**/*.${block}.ts`],
    rules: {
      'no-restricted-globals': [
        'error',
        ...parameters.symbols.map((name) => ({
          name,
          message: `.${block}.ts blocks don't touch browser globals; take ${name} as an argument (three-block-architecture D11).`,
        })),
      ],
    },
  })),
};
const text = `${JSON.stringify(config, null, 2)}\n`;

if (process.argv.includes('--check')) {
  if (readFileSync(assetPath, 'utf8') !== text) {
    console.error(`${assetPath} is out of date; run node scripts/build-oxlint-config.mjs`);
    process.exit(1);
  }
} else {
  writeFileSync(assetPath, text);
}
