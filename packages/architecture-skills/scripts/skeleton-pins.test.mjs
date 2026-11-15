// Specs of the pins in the package skeletons: node --test scripts/
// A skeleton pins other packages of the author (`@gergelyszerovay/*`) in its manifest patches. A pin that accepts the version
// the package is released at can never be installed against the registry, which is what a rename of a package left behind
// (reviewer2 plan 0163: `^0.11.0` of the renamed markdown-schema, at 0.12.0 and about to be 0.13.0).
// The released versions come from the registry (`npm view`, GitHub Packages); the spec FAILS, never skips, when the registry
// does not answer (plan 0042, decision 8).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * Tells whether a version satisfies an exact, caret or tilde range of a plain `x.y.z`.
 * @param {string} range - The range, such as `^0.13.0`.
 * @param {string} version - The version, such as `0.13.0`.
 * @returns {boolean} True when the range accepts it.
 */
export function accepts(range, version) {
  const parse = (text) => /^(\d+)\.(\d+)\.(\d+)$/.exec(text)?.slice(1).map(Number);
  const v = parse(version);
  const m = /^([\^~]?)(\d+\.\d+\.\d+)$/.exec(range);
  if (v === undefined || m === null) return false;
  const [, op, base] = m;
  const r = parse(base);
  const atLeast = v[0] - r[0] || v[1] - r[1] || v[2] - r[2];
  if (atLeast < 0) return false;
  if (op === '') return atLeast === 0;
  if (op === '~') return v[0] === r[0] && v[1] === r[1];
  if (r[0] > 0) return v[0] === r[0];
  if (r[1] > 0) return v[0] === 0 && v[1] === r[1];
  return v[0] === 0 && v[1] === 0 && v[2] === r[2];
}

/**
 * Names the pins of a manifest patch that accept none of the versions a package can have.
 * @param {Record<string, any>} patch - The parsed `package.patch.json`.
 * @param {Map<string, string[]>} versions - The versions each package may have, by name (current, then next release).
 * @returns {string[]} One line per pin that accepts none of them.
 */
export function unsatisfiablePins(patch, versions) {
  const lines = [];
  for (const section of SECTIONS) {
    for (const [name, range] of Object.entries(patch[section] ?? {})) {
      const known = versions.get(name);
      if (known === undefined || typeof range !== 'string') continue;
      if (!known.some((version) => accepts(range, version))) {
        lines.push(`${section}.${name} is ${range}, which accepts none of ${known.join(', ')}`);
      }
    }
  }
  return lines;
}

test('a pin is judged against the versions it is given', () => {
  const versions = new Map([['@gergelyszerovay/markdown-schema', ['0.12.0', '0.13.0']]]);
  const patch = (range) => ({ devDependencies: { '@gergelyszerovay/markdown-schema': range } });
  assert.equal(unsatisfiablePins(patch('^0.11.0'), versions).length, 1);
  assert.equal(unsatisfiablePins(patch('^0.12.0'), versions).length, 0);
  assert.equal(unsatisfiablePins(patch('^0.13.0'), versions).length, 0);
  assert.equal(unsatisfiablePins(patch('~0.13.0'), versions).length, 0);
  assert.equal(unsatisfiablePins(patch('0.14.0'), versions).length, 1);
  assert.equal(unsatisfiablePins(patch('^1.0.0'), versions).length, 1);
  // a package this repository does not know, and a placeholder, are not judged
  assert.deepEqual(unsatisfiablePins({ dependencies: { other: '^9.0.0' } }, versions), []);
  assert.deepEqual(
    unsatisfiablePins(
      { devDependencies: { '@gergelyszerovay/markdown-schema': '$SELF_VERSION' } },
      new Map([['@gergelyszerovay/markdown-schema', ['0.13.0']]]),
    ),
    [
      'devDependencies.@gergelyszerovay/markdown-schema is $SELF_VERSION, which accepts none of 0.13.0',
    ],
  );
});

/** The patches of every skeleton of the skills package. */
function skeletonPatches() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'package.patch.json') found.push(path);
    }
  };
  for (const skill of readdirSync(join(packageRoot, 'skills'))) {
    const assets = join(packageRoot, 'skills', skill, 'assets');
    if (existsSync(assets)) walk(assets);
  }
  return found;
}

/** The packages whose pins the skeletons carry and that this repository does not hold. */
const REGISTRY_PACKAGES = ['@gergelyszerovay/markdown-schema', '@gergelyszerovay/cage2-session'];

/**
 * Asks the registry (GitHub Packages) for the latest released version of a package.
 * @param {string} name - The package name.
 * @returns {string} The version, such as `0.13.2`.
 * @throws {Error} When the registry gives no answer or an answer that is not a version.
 */
function registryVersion(name) {
  let output;
  try {
    output = execFileSync(
      'npm',
      ['view', name, 'version', '--@gergelyszerovay:registry=https://npm.pkg.github.com'],
      { encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
  } catch (error) {
    throw new Error(
      `the registry gives no version of ${name} (npm view failed: ${error.stderr ?? error.message}); this spec needs GitHub Packages and its token`,
      { cause: error },
    );
  }
  assert.match(output, /^\d+\.\d+\.\d+$/, `the registry's answer for ${name} is not a version`);
  return output;
}

/** The released versions of the packages a skeleton may pin, from the registry; the next release is not known here. */
function registryVersions() {
  return new Map(REGISTRY_PACKAGES.map((name) => [name, [registryVersion(name)]]));
}

test('every pin of a skeleton to a package of the registry accepts the version the registry has released', () => {
  const versions = registryVersions();
  assert.equal(versions.size, REGISTRY_PACKAGES.length, 'every package has a released version');
  const patches = skeletonPatches();
  assert.ok(patches.length > 0, 'the skeletons have manifest patches');
  const refused = patches.flatMap((file) =>
    unsatisfiablePins(JSON.parse(readFileSync(file, 'utf8')), versions).map(
      (line) => `${file.slice(packageRoot.length + 1)}: ${line}`,
    ),
  );
  assert.deepEqual(refused, []);
});

// Spec of architecture-skills plan 0002 (decision 6): the package skeletons and the node reference repository bind
// the profile only.
/** Every `package.json` and `package.patch.json` under the skills' `assets/` folders, relative to the package. */
function assetManifests() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'package.json' || entry.name === 'package.patch.json') {
        found.push(path.slice(packageRoot.length + 1));
      }
    }
  };
  for (const skill of readdirSync(join(packageRoot, 'skills'))) {
    const assets = join(packageRoot, 'skills', skill, 'assets');
    if (existsSync(assets)) walk(assets);
  }
  return found.sort();
}

test(
  'no skeleton patch and no reference repository writes architecture.version',
  {
    tags: ['invariant'],
    meta: { spec: 'skeletons-bind-no-version' },
  },
  () => {
    const manifests = assetManifests();
    // the node and three.js skeletons and the node reference repository are among them
    for (const expected of [
      'skills/node-block-architecture/assets/node-package-skeleton/base/package.patch.json',
      'skills/three-block-architecture/assets/three-package-skeleton/base/package.patch.json',
      'skills/node-block-architecture/assets/reference-repo/package.json',
    ]) {
      assert.ok(manifests.includes(expected), `${expected} is not found`);
    }
    const versioned = manifests.filter((path) => {
      const binding = JSON.parse(readFileSync(join(packageRoot, path), 'utf8')).architecture;
      return binding !== undefined && 'version' in binding;
    });
    assert.deepEqual(versioned, []);
  },
);
