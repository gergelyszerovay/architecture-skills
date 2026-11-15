// Scenario of build-oxlint-config.mjs. Run from the skill's folder: node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const scripts = dirname(fileURLToPath(import.meta.url));

test('the committed oxlint config is the one the profile generates, one override per block', () => {
  const check = spawnSync(process.execPath, [join(scripts, 'build-oxlint-config.mjs'), '--check'], {
    encoding: 'utf8',
  });
  assert.equal(check.status, 0, check.stderr);

  const config = JSON.parse(
    readFileSync(join(scripts, '..', 'assets', 'oxlint-no-symbol.json'), 'utf8'),
  );
  const files = config.overrides.map((override) => override.files[0]);
  assert.ok(files.includes('**/*.rules.ts'));
  assert.ok(!files.includes('**/*.engine.ts'));
  const [severity, ...globals] = config.overrides[0].rules['no-restricted-globals'];
  assert.equal(severity, 'error');
  assert.ok(globals.some((global) => global.name === 'window'));
});
