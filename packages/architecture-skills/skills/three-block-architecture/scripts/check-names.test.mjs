// Scenario of check-names.mjs. Run from the skill's folder: node --test scripts/
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-names.mjs');

const packageWith = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'check-names-'));
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  return root;
};

test('reports a missing suffix, a mismatched name and two declarations, and passes named blocks', () => {
  const pkg = packageWith({
    'libs/demo-engine/src/lib/create-demo.engine.ts': 'export function createDemoEngine() {}\n',
    'libs/demo-engine/src/lib/flight.controller.ts': 'export class FlightController {}\n',
    'libs/demo-engine/src/lib/demo-params.model.ts':
      'export type DemoParams = { speed: number };\n',
    'libs/demo-engine/src/lib/create-demo.engine.spec.ts':
      'export const a = 1;\nexport const b = 2;\n',
    'libs/demo-engine/src/lib/helpers.ts': 'export const helper = 1;\n',
    'libs/demo-engine/src/lib/wrong-name.rules.ts': 'export function clampSpeed() {}\n',
    'libs/demo-engine/src/lib/two.rules.ts': 'export function two() {}\nexport const extra = 1;\n',
    'libs/demo-engine/src/lib/unknown.widget.ts': 'export function unknown() {}\n',
  });
  try {
    const run = spawnSync(process.execPath, [script, pkg], { encoding: 'utf8' });
    const lines = run.stderr.trim().split('\n');
    assert.equal(run.status, 1);
    assert.ok(lines.some((l) => l.endsWith('helpers.ts: no block suffix')));
    assert.ok(lines.some((l) => l.endsWith('unknown.widget.ts: no block suffix')));
    assert.ok(lines.some((l) => l.includes('wrong-name.rules.ts: primary declaration clampSpeed')));
    assert.ok(lines.some((l) => l.includes('two.rules.ts: exports 2 functions')));
    assert.equal(lines.at(-1), '4 naming finding(s)');
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

test('passes a host-only app that has no libs folder', () => {
  const pkg = packageWith({ 'src/main.ts': 'export {};\n' });
  try {
    const run = spawnSync(process.execPath, [script, pkg], { encoding: 'utf8' });
    assert.equal(run.status, 0);
    assert.equal(run.stderr, '');
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

test('fails when the package directory does not exist', () => {
  const run = spawnSync(process.execPath, [script, join(tmpdir(), 'check-names-missing-dir')], {
    encoding: 'utf8',
  });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /the package directory does not exist/);
});
