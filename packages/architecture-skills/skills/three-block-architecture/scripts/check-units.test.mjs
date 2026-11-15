// Scenarios of check-units.mjs. Run from the skill's folder: node --test scripts/
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-units.mjs');
const RUNTIME = '@acme/engine';
const BINDING = { profile: 'three-block-architecture', version: '0.3.2' };
/** What a package's manifest binds: the profile only (architecture-skills plan 0002). */
const PACKAGE_BINDING = { profile: BINDING.profile };

/**
 * Installs a fixture of the profile at `version` in `root`, where every package below it finds it
 * (`.claude/skills/<profile>/<profile>.architecture-profile.md`); check-units reads its `- Version:` line.
 */
const installProfile = (root, version = BINDING.version) => {
  const skill = join(root, '.claude', 'skills', BINDING.profile);
  mkdirSync(skill, { recursive: true });
  writeFileSync(
    join(skill, `${BINDING.profile}.architecture-profile.md`),
    `# Profile: ${BINDING.profile}\n\n## 1. Identity\n\n- Version: ${version}\n`,
  );
};

const unit = (name, more = {}) =>
  JSON.stringify({
    unit: 1,
    name,
    architecture: BINDING,
    role: 'render-kit',
    runtime: { [RUNTIME]: '^0.2.0' },
    peers: { three: '~0.186.1' },
    ...more,
  });
const libDoc = (role = 'render-kit') => `# lib\n\n## 1. Identity\n\n- Role: ${role}\n`;
const packageDoc = (rows) =>
  `# pkg\n\n## 1. Boundaries\n\nx\n\n## 2. Approved Packages\n\n| Package | Layers | Reason |\n| --- | --- | --- |\n${rows}\n\n## 4. Decisions\n`;

const packageWith = (files, manifest = {}, installed = BINDING.version) => {
  const root = mkdtempSync(join(tmpdir(), 'check-units-'));
  installProfile(root, installed);
  const all = {
    'package.json': JSON.stringify({
      name: 'kit',
      architecture: PACKAGE_BINDING,
      dependencies: { [RUNTIME]: 'workspace:*' },
      peerDependencies: { three: '~0.186.1' },
      ...manifest,
    }),
    ...files,
  };
  for (const [path, source] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  return root;
};
const run = (pkg) => spawnSync(process.execPath, [script, pkg], { encoding: 'utf8' });

test('passes units that import their own libs, the runtime, three and an approved vendor, and ignores libs that are no unit', () => {
  const pkg = packageWith({
    'libs/mesh/unit.json': unit('mesh'),
    'libs/mesh/layered-docs/1.mesh.three-lib.md': libDoc(),
    'libs/mesh/src/index.ts': "export { mesh } from './lib/mesh.geometry';\n",
    'libs/mesh/src/lib/mesh.geometry.ts':
      "import { BufferGeometry } from 'three';\nimport type { MeshData } from '@acme/engine/contract';\nexport const mesh = [BufferGeometry];\n",
    'libs/noise/unit.json': unit('noise', {
      dependencies: { '@dimforge/rapier3d-compat': '0.21.0' },
      layers: { '@dimforge/rapier3d-compat': ['runtime'] },
    }),
    'libs/noise/layered-docs/1.noise.three-lib.md': libDoc(),
    'libs/noise/src/index.ts':
      "import { mesh } from '~libs/mesh';\nimport RAPIER from '@dimforge/rapier3d-compat';\nimport { it } from 'vitest';\nexport const noise = [mesh, RAPIER, it];\n",
    'libs/plain/src/index.ts': "import 'whatever';\nimport '~libs/ghost';\n",
    'layered-docs/1.kit.three-package.md': packageDoc(
      '| @dimforge/rapier3d-compat | runtime, scene | physics |',
    ),
  });
  try {
    const result = run(pkg);
    assert.equal(result.stderr, '');
    assert.equal(result.status, 0);
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

test('reports a wrong profile and version, a runtime that is no dependency, a role and a lib doc that disagree, imports that are not allowed and a vendor the package doc does not approve', () => {
  const pkg = packageWith({
    'libs/wrong/unit.json': unit('wrong', {
      architecture: { profile: 'node-block-architecture', version: '0.4.0' },
    }),
    'libs/old/unit.json': unit('old', {
      architecture: { profile: BINDING.profile, version: '0.2.0' },
    }),
    'libs/old/layered-docs/1.old.three-lib.md': libDoc(),
    'libs/norun/unit.json': unit('norun', { runtime: { '@x/missing': '^1.0.0' } }),
    'libs/norun/layered-docs/1.norun.three-lib.md': libDoc('domain'),
    'libs/nodoc/unit.json': unit('nodoc'),
    'libs/plain/src/index.ts': 'export const plain = 1;\n',
    'libs/bad/unit.json': unit('bad', {
      dependencies: { rapier: '1.0.0', other: '1.0.0' },
      layers: { rapier: ['runtime'], other: ['runtime'] },
    }),
    'libs/bad/layered-docs/1.bad.three-lib.md': libDoc(),
    'libs/bad/src/index.ts':
      "import '~libs/plain';\nimport '~libs/ghost';\nimport '../../nodoc/src/index';\nimport 'sneaky/deep';\nimport 'rapier';\n",
    'libs/broken/unit.json': '{"unit":2,"extra":1}',
    'layered-docs/1.kit.three-package.md': packageDoc('| rapier | scene | physics |'),
  });
  try {
    const result = run(pkg);
    const lines = result.stderr.trim().split('\n');
    assert.equal(result.status, 1);
    const has = (needle) =>
      assert.ok(
        lines.some((line) => line.includes(needle)),
        `${needle}\n${result.stderr}`,
      );
    has(
      'libs/wrong/unit.json: names the profile node-block-architecture, but the package binds three-block-architecture',
    );
    has(
      'libs/old/unit.json: was written for three-block-architecture 0.2.0, which the installed profile (at 0.3.2) cannot take',
    );
    has('libs/norun/unit.json: lists @x/missing as runtime, which is no dependency of the package');
    has('libs/norun/unit.json: has role render-kit, but its lib doc says domain');
    has('libs/nodoc/unit.json: the lib has no lib doc layered-docs/1.nodoc.three-lib.md');
    has('libs/bad/unit.json: imports ~libs/plain, which is no unit');
    has('libs/bad/unit.json: imports ~libs/ghost, which the package does not have');
    has('src/index.ts: ../../nodoc/src/index reaches outside the lib bad');
    has(
      'libs/bad/unit.json: imports sneaky, which unit.json lists in none of runtime, peers or dependencies',
    );
    has(
      'libs/bad/unit.json: vendor rapier is approved in 1.kit.three-package.md for scene, not for runtime',
    );
    has(
      'libs/bad/unit.json: vendor other is not in the Approved Packages of 1.kit.three-package.md',
    );
    has('libs/broken/unit.json: `unit` must be 1');
    has('libs/broken/unit.json: `extra` is not a key of unit.json');
    assert.match(lines.at(-1), /^\d+ unit finding\(s\)$/);
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

test('passes a package without libs or without units, and fails for a package directory that does not exist', () => {
  const host = packageWith({ 'src/main.ts': 'export {};\n' });
  const plain = packageWith({ 'libs/a/src/index.ts': 'export const a = 1;\n' });
  try {
    assert.equal(run(host).status, 0);
    assert.equal(run(plain).status, 0);
    const missing = run(join(tmpdir(), 'check-units-missing-dir'));
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /the package directory does not exist/);
  } finally {
    rmSync(host, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
});

test('reads the file, the format and the keys from the unit-manifest row of the skill profile', () => {
  const profile = readFileSync(
    join(dirname(script), '..', 'three-block-architecture.architecture-profile.md'),
    'utf8',
  );
  const row = profile.split('\n').find((line) => line.startsWith('| unit-manifest '));
  assert.ok(row, 'the profile has a unit-manifest row');
  assert.match(row, /file=unit\.json; format=1; keys=unit, name, architecture, role,/);
  assert.match(row, /\|\s+checker\s+\|\s+D64\s+\|$/);
  const imports = profile.split('\n').find((line) => line.startsWith('| unit-imports '));
  assert.ok(imports, 'the profile has a unit-imports row');
  assert.match(imports, /scope=product; form=package\/lib; kit=all-libs-units-no-engine;/);
  assert.match(imports, /cycles=refused; same-minor=three \s*\|\s+checker\s+\|\s+D64\s+\|$/);
  const pkg = packageWith({
    'libs/a/unit.json': unit('a', { unit: 2, extra: 1 }),
    'libs/a/src/index.ts': 'export const a = 1;\n',
    'libs/a/layered-docs/1.a.three-lib.md': libDoc(),
  });
  try {
    const result = run(pkg);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /`unit` must be 1/);
    assert.match(result.stderr, /`extra` is not a key of unit\.json/);
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

test('judges the files Git tracks in a unit and does not follow a link', () => {
  const pkg = packageWith({
    'libs/a/unit.json': unit('a'),
    'libs/a/src/index.ts': 'export const a = 1;\n',
    'libs/a/layered-docs/1.a.three-lib.md': libDoc(),
  });
  try {
    const git = (...args) => spawnSync('git', args, { cwd: pkg, encoding: 'utf8' });
    assert.equal(git('init', '-q').status, 0);
    assert.equal(git('add', '-A').status, 0);
    writeFileSync(join(pkg, 'libs/a/src/untracked.ts'), "import 'sneaky';\n");
    symlinkSync('/etc', join(pkg, 'libs/a/src/out'));
    assert.equal(run(pkg).status, 0, 'an untracked file is not part of what is copied');
    assert.equal(git('add', '-f', 'libs/a/src/out').status, 0);
    const result = run(pkg);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /src\/out is a symbolic link, which a unit may not carry/);
    assert.doesNotMatch(result.stderr, /sneaky/);
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});

/** A product with the packages given by name: `{ files, manifest }` each, laid out as products/p/packages/<name>. */
const productWith = (packages) => {
  const root = mkdtempSync(join(tmpdir(), 'check-units-product-'));
  installProfile(root);
  for (const [key, { files = {}, manifest = {} }] of Object.entries(packages)) {
    // `q/far-kit` lies in another product
    const [product, name] = key.includes('/') ? key.split('/') : ['p', key];
    const all = {
      'package.json': JSON.stringify({ name, architecture: PACKAGE_BINDING, ...manifest }),
      ...files,
    };
    for (const [path, source] of Object.entries(all)) {
      const file = join(root, 'products', product, 'packages', name, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, source);
    }
  }
  return root;
};
const kitUnit = (lib, source, more = {}) => ({
  [`libs/${lib}/unit.json`]: unit(lib, { runtime: {}, peers: {}, ...more }),
  [`libs/${lib}/layered-docs/1.${lib}.three-lib.md`]: libDoc(),
  [`libs/${lib}/src/index.ts`]: source,
});
/** The `exports` of a kit that exposes the units given as subpath entries. */
const exportsOf = (...libs) => ({
  exports: Object.fromEntries(libs.map((lib) => [`./${lib}`, { default: `./dist/${lib}.js` }])),
});
const packageIn = (root, name) => join(root, 'products', 'p', 'packages', name);

test('passes a unit that imports a unit of another kit of the same product by <package>/<lib>', () => {
  const root = productWith({
    'shader-kit': {
      manifest: exportsOf('noise'),
      files: kitUnit('noise', 'export const noise = 1;\n'),
    },
    'demo-kit': {
      manifest: { dependencies: { 'shader-kit': 'workspace:*' } },
      files: kitUnit(
        'sdf',
        "import { noise } from 'shader-kit/noise';\nexport const sdf = noise;\n",
      ),
    },
  });
  try {
    const result = run(packageIn(root, 'demo-kit'));
    assert.equal(result.stderr, '');
    assert.equal(result.status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports an import of a non-kit package, a barrel, a path inside a unit, a missing lib, an unlisted dependency, the own package and a cycle', () => {
  const root = productWith({
    'shader-kit': {
      manifest: { dependencies: { 'demo-kit': 'workspace:*' }, ...exportsOf('noise') },
      files: kitUnit('noise', 'export const noise = 1;\n'),
    },
    'q/far-kit': { files: kitUnit('x', 'export const x = 1;\n') },
    'lesson-kit': {
      files: {
        ...kitUnit('part', 'export const part = 1;\n'),
        ...kitUnit('liquid-engine', 'export const l = 1;\n', { role: 'engine' }),
      },
    },
    'bare-kit': { files: kitUnit('z', 'export const z = 1;\n') },
    engine: {
      files: {
        ...kitUnit('plasma', 'export const p = 1;\n'),
        'libs/engine/src/index.ts': 'export const e = 1;\n',
      },
    },
    'back-kit': {
      manifest: { dependencies: { 'demo-kit': 'workspace:*' } },
      files: kitUnit('y', 'export const y = 1;\n'),
    },
    'demo-kit': {
      manifest: {
        dependencies: {
          engine: 'workspace:*',
          'back-kit': 'workspace:*',
          'lesson-kit': 'workspace:*',
          'bare-kit': 'workspace:*',
        },
      },
      files: {
        ...kitUnit('to-engine', "import 'engine/plasma';\n"),
        ...kitUnit('to-lesson', "import 'lesson-kit/part';\n"),
        ...kitUnit('to-bare', "import 'bare-kit/z';\n"),
        ...kitUnit('to-far', "import 'far-kit/x';\n"),
        ...kitUnit('as-peer', "import 'back-kit/y';\n", { peers: { 'back-kit': '^1.0.0' } }),
        ...kitUnit('as-dependency', 'export const d = 1;\n', {
          dependencies: { 'bare-kit': '1.0.0' },
          layers: { 'bare-kit': ['runtime'] },
        }),
        ...kitUnit('to-barrel', "import 'back-kit';\n"),
        ...kitUnit('to-deep', "import 'back-kit/y/src/index';\n"),
        ...kitUnit('to-ghost', "import 'back-kit/ghost';\n"),
        ...kitUnit('to-unlisted', "import 'shader-kit/noise';\n"),
        ...kitUnit('to-self', "import 'demo-kit/to-self';\n"),
        ...kitUnit('to-cycle', "import 'back-kit/y';\n"),
      },
    },
  });
  try {
    const result = run(packageIn(root, 'demo-kit'));
    assert.equal(result.status, 1);
    const has = (needle) =>
      assert.ok(
        result.stderr.split('\n').some((line) => line.includes(needle)),
        `${needle}\n${result.stderr}`,
      );
    has(
      'to-engine/unit.json: imports engine, which is no kit: engine is no unit (a unit imports only kits, whose libs are all units and none an engine)',
    );
    has(
      'to-lesson/unit.json: imports lesson-kit, which is no kit: liquid-engine has the role engine (a unit imports only kits, whose libs are all units and none an engine)',
    );
    has(
      "to-bare/unit.json: imports bare-kit/z, but bare-kit has no exports['./z'] (the kit exposes a unit that another kit imports as a subpath export, with a src/z.ts re-export)",
    );
    has(
      'to-far/unit.json: imports far-kit, a package of the product q: a unit imports only units of kits of its own product',
    );
    has(
      'as-peer/unit.json: lists back-kit in peers, which is a package of the lab: a unit takes the code of another package only as back-kit/<lib> or ~libs/<lib>, and an engine only as the runtime',
    );
    has(
      'as-dependency/unit.json: lists bare-kit in dependencies, which is a package of the lab: a unit takes the code of another package only as bare-kit/<lib> or ~libs/<lib>, and an engine only as the runtime',
    );
    has(
      'to-barrel/unit.json: imports back-kit by its barrel: a unit imports one unit of a kit, as back-kit/<lib>',
    );
    has(
      'to-deep/unit.json: imports back-kit/y/src/index: a unit imports a unit of a kit only as back-kit/y, never a path inside it',
    );
    has('to-ghost/unit.json: imports back-kit/ghost, but back-kit has no lib ghost');
    has(
      'to-unlisted/unit.json: imports shader-kit, which the package does not list in its dependencies',
    );
    has(
      'to-unlisted/unit.json: imports shader-kit, which depends back on the package (demo-kit -> shader-kit -> demo-kit): kits do not form cycles',
    );
    has(
      "to-self/unit.json: imports its own package demo-kit by name: a unit imports its package's libs as ~libs/<lib>",
    );
    has(
      'to-cycle/unit.json: imports back-kit, which depends back on the package (demo-kit -> back-kit -> demo-kit): kits do not form cycles',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const folder of [
  ['prototypes', 'viewer'],
  ['prototypes', 'games', 'viewer'],
]) {
  test(`does not take a package outside the product for a kit (${folder.join('/')})`, () => {
    const root = mkdtempSync(join(tmpdir(), 'check-units-proto-'));
    installProfile(root);
    try {
      const pkg = join(root, ...folder);
      for (const [file, source] of Object.entries({
        'package.json': JSON.stringify({
          name: 'viewer',
          architecture: PACKAGE_BINDING,
          dependencies: { 'shader-kit': '1.0.0' },
        }),
        ...kitUnit('sdf', "import 'shader-kit/noise';\n"),
      })) {
        mkdirSync(dirname(join(pkg, file)), { recursive: true });
        writeFileSync(join(pkg, file), source);
      }
      const result = run(pkg);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /imports shader-kit, which unit\.json lists in none of runtime, peers or dependencies/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

// Specs of architecture-skills plan 0002 (decisions 5 and 6): a unit is compared with the installed profile's
// Version, not the binding's, and a frozen package's units are not judged.
/** One unit `mesh` written for `version`, in a package whose binding adds `binding`, below the profile at `installed`. */
const unitPackage = (version, binding, installed = '0.5.2') =>
  packageWith(
    {
      'libs/mesh/unit.json': unit('mesh', {
        architecture: { profile: BINDING.profile, version },
      }),
      'libs/mesh/layered-docs/1.mesh.three-lib.md': libDoc(),
      'libs/mesh/src/index.ts': 'export const mesh = 1;\n',
    },
    { architecture: { ...PACKAGE_BINDING, ...binding } },
    installed,
  );

test(
  'compares a unit with the installed profile’s version whatever the binding’s version says',
  {
    tags: ['invariant'],
    meta: { spec: 'unit-compared-with-installed-version' },
  },
  () => {
    for (const binding of [{}, { version: '0.3.2' }, { version: '9.0.0' }, { version: 42 }]) {
      // a unit at the installed version passes, one a minor behind is refused, whatever the binding names
      for (const [version, status] of [
        ['0.5.2', 0],
        ['0.5.0', 0],
        ['0.4.0', 1],
      ]) {
        const pkg = unitPackage(version, binding);
        try {
          const result = run(pkg);
          assert.equal(
            result.status,
            status,
            `unit ${version}, binding ${JSON.stringify(binding)}: ${result.stderr}`,
          );
        } finally {
          rmSync(pkg, { recursive: true, force: true });
        }
      }
    }
  },
);

test(
  'refuses a unit two minor versions behind the installed profile, naming the installed version',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'unit-two-minors-behind-refused',
      arrange:
        'a package bound to three-block-architecture with no version, the installed profile at 0.5.2, and a unit whose unit.json names 0.3.2',
      act: 'check-units runs in the package',
      assert:
        'it exits 1 and the finding names the unit, its version 0.3.2 and the installed version 0.5.2',
    },
  },
  () => {
    const pkg = unitPackage('0.3.2', {});
    try {
      const result = run(pkg);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /libs\/mesh\/unit\.json: was written for three-block-architecture 0\.3\.2, which the installed profile \(at 0\.5\.2\) cannot take/,
      );
    } finally {
      rmSync(pkg, { recursive: true, force: true });
    }
  },
);

test(
  'judges no unit of a frozen package and prints the frozen line',
  {
    tags: ['scenario'],
    meta: {
      spec: 'frozen-package-units-not-judged',
      arrange:
        'a package bound with frozen: { reason: "kept for the demo" } whose unit would be refused (its unit.json two minors behind)',
      act: 'check-units runs in the package',
      assert:
        'it prints only "<package name>: frozen (kept for the demo); not checked against three-block-architecture <installed version>" and exits 0',
    },
  },
  () => {
    const pkg = unitPackage('0.3.2', { frozen: { reason: 'kept for the demo' } });
    try {
      const result = run(pkg);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(
        result.stdout,
        'kit: frozen (kept for the demo); not checked against three-block-architecture 0.5.2\n',
      );
      assert.equal(result.stderr, '');
    } finally {
      rmSync(pkg, { recursive: true, force: true });
    }
    // a frozen field of another shape is refused, as the loader refuses it
    const bad = unitPackage('0.5.1', { frozen: { reason: '' } });
    try {
      const result = run(bad);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /"architecture\.frozen\.reason" must be one line/);
    } finally {
      rmSync(bad, { recursive: true, force: true });
    }
  },
);
