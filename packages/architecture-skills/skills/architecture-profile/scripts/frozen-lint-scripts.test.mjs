// Scenarios of check-tsdoc-tags.mjs and check-block-placement.mjs on a frozen package (architecture-skills plan 0002,
// decision 5): a temporary package bound to an installed fixture profile, with "frozen": { "reason": … } in its binding.
// The fixture is a copy of the node-block-architecture profile and its constitution below a package in a folder under
// the skills package's node_modules, so markdown-schema resolves from it as from a bound package.
// Run from the skill's folder: node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skillsPackage = join(here, '..', '..', '..');
const PROFILE = 'node-block-architecture';
const INSTALLED = /^- Version: (\S+)$/m.exec(
  readFileSync(
    join(skillsPackage, 'skills', PROFILE, `${PROFILE}.architecture-profile.md`),
    'utf8',
  ),
)[1];
const LINE = `@scope/frozen-demo: frozen (kept for the demo); not checked against ${PROFILE} ${INSTALLED}\n`;

const dirs = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

/**
 * A package bound to the installed fixture profile by `binding`, holding `files` (path to text).
 * @returns {string} The package's folder.
 */
function fixturePackage(binding, files) {
  const cache = join(skillsPackage, 'node_modules', '.cache');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'frozen-lint-'));
  dirs.push(root);
  const skill = join(root, '.claude', 'skills', PROFILE);
  mkdirSync(skill, { recursive: true });
  for (const file of [`${PROFILE}.architecture-profile.md`, `${PROFILE}.constitution.md`]) {
    copyFileSync(join(skillsPackage, 'skills', PROFILE, file), join(skill, file));
  }
  const pkg = join(root, 'pkg');
  for (const [path, text] of Object.entries({
    'package.json': JSON.stringify({
      name: '@scope/frozen-demo',
      architecture: { profile: PROFILE, ...binding },
    }),
    ...files,
  })) {
    mkdirSync(dirname(join(pkg, path)), { recursive: true });
    writeFileSync(join(pkg, path), text);
  }
  return pkg;
}

const script = (name, pkg) =>
  spawnSync(process.execPath, [join(here, name), pkg], { cwd: pkg, encoding: 'utf8' });

const FROZEN = { frozen: { reason: 'kept for the demo' } };

test(
  'check-tsdoc-tags prints the frozen line for a frozen package, reports nothing else and exits 0',
  {
    tags: ['scenario'],
    meta: {
      spec: 'check-tsdoc-tags-frozen-line',
      arrange:
        'a temporary package bound to an installed fixture profile with frozen: { reason: "kept for the demo" }, whose blocks lack required TSDoc tags',
      act: 'check-tsdoc-tags runs in the package',
      assert:
        'it prints only "<package name>: frozen (kept for the demo); not checked against <profile> <installed version>" and exits 0',
    },
  },
  () => {
    // a use case with no TSDoc at all, which the profile's tsdoc-tags rule would report
    const pkg = fixturePackage(FROZEN, {
      'libs/orders/src/lib/core/place-order.use-case.ts': 'export function placeOrder() {}\n',
    });
    const result = script('check-tsdoc-tags.mjs', pkg);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, LINE);
    assert.equal(result.stderr, '');
  },
);

test(
  'check-block-placement prints the frozen line for a frozen package, reports nothing else and exits 0',
  {
    tags: ['scenario'],
    meta: {
      spec: 'check-block-placement-frozen-line',
      arrange:
        'a temporary package bound to an installed fixture profile with frozen: { reason: "kept for the demo" }, with a block in a folder its profile does not allow',
      act: 'check-block-placement runs in the package',
      assert:
        'it prints only "<package name>: frozen (kept for the demo); not checked against <profile> <installed version>" and exits 0',
    },
  },
  () => {
    // a use case (layer application, folder core) in a driving adapter's folder
    const misplaced = {
      'libs/orders/src/lib/adapters-driving/place-order.use-case.ts':
        'export function placeOrder() {}\n',
    };
    const unfrozen = script('check-block-placement.mjs', fixturePackage({}, misplaced));
    assert.equal(unfrozen.status, 1, 'the same package unfrozen has a finding');
    const result = script('check-block-placement.mjs', fixturePackage(FROZEN, misplaced));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, LINE);
    assert.equal(result.stderr, '');
  },
);
