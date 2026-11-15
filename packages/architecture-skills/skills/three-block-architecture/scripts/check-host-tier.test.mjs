// Scenario of check-host-tier.mjs. Run from the skill's folder: node --test scripts/
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-host-tier.mjs');

const builtPackage = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'check-host-tier-'));
  const exports = {
    '.': { types: './dist/index.d.ts', default: './dist/index.js' },
    './kit': { types: './dist/kit.d.ts', default: './dist/kit.js' },
  };
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: '@scope/demo', exports }));
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  return root;
};

const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('reports three imported by the host tier through a shared chunk, and passes a clean one', () => {
  const leaky = builtPackage({
    'dist/index.d.ts': "export { a } from './shared-x1.js';\nexport type P = { speed: number };\n",
    'dist/shared-x1.d.ts': "import { Mesh } from 'three';\nexport declare const a: Mesh;\n",
    'dist/kit.d.ts': "import { Texture } from 'three';\nexport declare const t: Texture;\n",
  });
  const clean = builtPackage({
    'dist/index.d.ts':
      "import type { EngineOptions } from '@scope/core/contract';\nexport type O = EngineOptions;\n",
    'dist/kit.d.ts': "import { Texture } from 'three/webgpu';\nexport declare const t: Texture;\n",
  });
  try {
    const failed = run(leaky);
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /shared-x1\.d\.ts: entry "\." of @scope\/demo imports "three"/);
    assert.match(failed.stderr, /1 host-tier finding\(s\)/);

    assert.equal(run(clean).status, 0);
    const kit = run(clean, '--entry', './kit');
    assert.equal(kit.status, 1);
    assert.match(kit.stderr, /imports "three\/webgpu"/);
  } finally {
    rmSync(leaky, { recursive: true, force: true });
    rmSync(clean, { recursive: true, force: true });
  }
});
