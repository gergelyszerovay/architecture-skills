// Scenarios of load-profile.cjs: the "enforcement" field of the binding, the optional tags
// of the tsdoc-tags rule with the value check check-tsdoc-tags.mjs applies to every tag, a
// binding's ignored "version" and its "frozen" field (architecture-skills plan 0002).
// Run from the skill's folder: node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, it, test } from 'node:test';

const { findBoundProfile, frozenLine, loadBoundProfile, parseOptionalTags, tagValueFinding } =
  createRequire(import.meta.url)('./load-profile.cjs');

const dirs = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

/** A package whose binding is `binding`, with the installed profile file findBoundProfile looks for. */
function packageWith(binding) {
  const dir = mkdtempSync(join(tmpdir(), 'load-profile-'));
  dirs.push(dir);
  mkdirSync(join(dir, '.claude', 'skills', 'p'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'skills', 'p', 'p.architecture-profile.md'), '# p\n');
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ architecture: { profile: 'p', version: '1.0.0', ...binding } }),
  );
  return dir;
}

describe('findBoundProfile: enforcement', () => {
  it('defaults to gate', () => {
    assert.equal(findBoundProfile(packageWith({})).enforcement, 'gate');
  });

  it('reads gate and advisory', () => {
    assert.equal(findBoundProfile(packageWith({ enforcement: 'gate' })).enforcement, 'gate');
    assert.equal(
      findBoundProfile(packageWith({ enforcement: 'advisory' })).enforcement,
      'advisory',
    );
  });

  it('rejects any other value, a typo included', () => {
    assert.throws(
      () => findBoundProfile(packageWith({ enforcement: 'advisory ' })),
      /"architecture.enforcement" must be "gate" or "advisory", not "advisory "/,
    );
  });
});

describe('parseOptionalTags: the optional= parameter of tsdoc-tags', () => {
  it('reads none from none, an empty cell and a cell without optional=', () => {
    assert.deepEqual(parseOptionalTags('none'), []);
    assert.deepEqual(parseOptionalTags(undefined), []);
    assert.deepEqual(parseOptionalTags('include-type-only=true'), []);
  });

  it('reads a tag with its values, beside other parameters', () => {
    assert.deepEqual(parseOptionalTags('mode=strict; optional=requires(native-webgpu/xr)'), [
      { name: 'requires', values: ['native-webgpu', 'xr'] },
    ]);
  });

  it('reads several tags, one without a value set', () => {
    assert.deepEqual(parseOptionalTags('optional=requires(native-webgpu), after'), [
      { name: 'requires', values: ['native-webgpu'] },
      { name: 'after', values: undefined },
    ]);
  });

  it('rejects a malformed tag', () => {
    assert.throws(() => parseOptionalTags('optional=Requires(x)'), /Invalid required tag/);
  });
});

describe('tagValueFinding', () => {
  const requires = { name: 'requires', values: ['native-webgpu'] };

  it('accepts a value that starts with an allowed value, with text after it', () => {
    assert.equal(tagValueFinding(requires, 'native-webgpu: storage textures'), undefined);
    assert.equal(tagValueFinding({ name: 'owns', values: undefined }, 'the canvas'), undefined);
  });

  it('reports a missing, an empty and a disallowed value', () => {
    assert.equal(tagValueFinding(requires, undefined), 'missing @requires');
    assert.equal(tagValueFinding(requires, ''), '@requires is empty');
    assert.equal(
      tagValueFinding(requires, 'webgpu'),
      '@requires must start with one of native-webgpu (found "webgpu")',
    );
  });
});

// Specs of architecture-skills plan 0002. The fixture is a package below an installed copy of the
// three-block-architecture profile (Version 0.6.0) and its constitution, in a folder under the skills
// package's node_modules, so markdown-schema resolves from it as from a bound package.
const skillsPackage = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const THREE = join(skillsPackage, 'skills', 'three-block-architecture');
const PROFILE = 'three-block-architecture';
const INSTALLED = '0.6.0';

/** A package bound by `binding`, below an installed fixture profile; returns its folder. */
function installedPackage(binding) {
  const cache = join(skillsPackage, 'node_modules', '.cache');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'load-profile-'));
  dirs.push(root);
  const skill = join(root, '.claude', 'skills', PROFILE);
  mkdirSync(skill, { recursive: true });
  for (const file of [`${PROFILE}.architecture-profile.md`, `${PROFILE}.constitution.md`]) {
    copyFileSync(join(THREE, file), join(skill, file));
  }
  const pkg = join(root, 'pkg');
  mkdirSync(pkg);
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({ name: '@scope/frozen-demo', architecture: { profile: PROFILE, ...binding } }),
  );
  return pkg;
}

test(
  'reads the installed profile for a binding without a version and returns its Version',
  {
    tags: ['scenario'],
    meta: {
      spec: 'binding-without-version-reads-installed-profile',
      arrange:
        'a package bound to { profile } only, below an installed fixture profile whose Version is 0.6.0',
      act: 'loadBoundProfile loads the package’s binding',
      assert: 'the installed profile’s rules are returned, with version 0.6.0',
    },
  },
  () => {
    const profile = loadBoundProfile(installedPackage({}));
    assert.equal(profile.name, PROFILE);
    assert.equal(profile.version, INSTALLED);
    assert.ok(profile.blocks.some((block) => block.suffix === '.engine.ts'));
    assert.equal(profile.frozen, undefined);
  },
);

test(
  'reads the installed profile all the same for a binding whose version is older, newer, malformed or not a string, and throws nothing',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'binding-version-ignored',
      arrange:
        'the installed fixture profile at 0.6.0, and bindings naming version 0.3.3, 9.0.0, "not-a-version" and 42 in turn',
      act: 'loadBoundProfile loads each binding',
      assert:
        'each returns the installed profile with version 0.6.0, none throws, and nothing is printed',
    },
  },
  (t) => {
    const printed = [];
    for (const method of ['log', 'warn', 'error']) {
      t.mock.method(console, method, (...args) => printed.push(args.join(' ')));
    }
    for (const version of ['0.3.3', '9.0.0', 'not-a-version', 42, null, { x: 1 }]) {
      assert.equal(loadBoundProfile(installedPackage({ version })).version, INSTALLED);
    }
    assert.deepEqual(printed, []);
  },
);

test(
  'reads no versions/ folder, even where one holds a copy of the version a binding names',
  {
    tags: ['invariant'],
    meta: { spec: 'no-kept-copy-read' },
  },
  () => {
    const pkg = installedPackage({ version: '0.3.3' });
    const kept = join(pkg, '..', '.claude', 'skills', PROFILE, 'versions', '0.3.3');
    mkdirSync(kept, { recursive: true });
    // a copy that cannot be parsed: reading it would throw
    writeFileSync(join(kept, `${PROFILE}.architecture-profile.md`), '# not a profile\n');
    assert.equal(loadBoundProfile(pkg).version, INSTALLED);
  },
);

test(
  'findBoundProfile returns no version, whatever the binding names',
  {
    tags: ['scenario'],
    meta: {
      spec: 'find-bound-profile-returns-no-version',
      arrange:
        'a package bound to { profile, version: "0.3.3" } below the installed fixture profile',
      act: 'findBoundProfile finds the binding',
      assert: 'the result names the profile and its path and has no version key',
    },
  },
  () => {
    const found = findBoundProfile(installedPackage({ version: '0.3.3' }));
    assert.equal(found.name, PROFILE);
    assert.match(found.profilePath, /three-block-architecture\.architecture-profile\.md$/);
    assert.equal('version' in found, false);
  },
);

// Specs of architecture-skills plan 0002 (decision 5): `frozen` in the binding, an object with one key, `reason`.
test(
  'returns a valid frozen with its reason',
  {
    tags: ['scenario'],
    meta: {
      spec: 'frozen-returned-with-reason',
      arrange: 'a binding with frozen: { reason: "kept for the demo" }',
      act: 'loadBoundProfile loads the binding',
      assert: 'the result carries frozen with the reason "kept for the demo"',
    },
  },
  () => {
    const pkg = installedPackage({ frozen: { reason: 'kept for the demo' } });
    const profile = loadBoundProfile(pkg);
    assert.deepEqual(profile.frozen, { reason: 'kept for the demo' });
    assert.equal(
      frozenLine(profile, pkg),
      `@scope/frozen-demo: frozen (kept for the demo); not checked against ${PROFILE} ${INSTALLED}`,
    );
  },
);

test(
  'refuses a frozen that is not an object, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-not-an-object-refused',
      arrange: 'bindings whose frozen is true, a string and an array in turn',
      act: 'loadBoundProfile loads each binding',
      assert: 'each throws an error that names architecture.frozen',
    },
  },
  () => {
    for (const frozen of [true, 'kept', ['kept'], null]) {
      assert.throws(
        () => loadBoundProfile(installedPackage({ frozen })),
        /"architecture\.frozen" must be an object/,
      );
    }
  },
);

test(
  'refuses a frozen without a reason, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-without-reason-refused',
      arrange: 'a binding with frozen: {}',
      act: 'loadBoundProfile loads the binding',
      assert: 'it throws an error that names architecture.frozen.reason',
    },
  },
  () => {
    assert.throws(
      () => loadBoundProfile(installedPackage({ frozen: {} })),
      /"architecture\.frozen\.reason" must be one line of 1 to 300 characters/,
    );
    assert.throws(
      () => loadBoundProfile(installedPackage({ frozen: { reason: 7 } })),
      /"architecture\.frozen\.reason"/,
    );
  },
);

test(
  'refuses a frozen whose reason is empty, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-empty-reason-refused',
      arrange: 'a binding with frozen: { reason: "" }',
      act: 'loadBoundProfile loads the binding',
      assert: 'it throws an error that names architecture.frozen.reason',
    },
  },
  () => {
    for (const reason of ['', '   ']) {
      assert.throws(
        () => loadBoundProfile(installedPackage({ frozen: { reason } })),
        /"architecture\.frozen\.reason"/,
      );
    }
  },
);

test(
  'refuses a frozen whose reason spans several lines, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-multi-line-reason-refused',
      arrange: 'a binding with frozen: { reason: "first line\\nsecond line" }',
      act: 'loadBoundProfile loads the binding',
      assert: 'it throws an error that names architecture.frozen.reason',
    },
  },
  () => {
    for (const reason of ['first line\nsecond line', 'first line\rsecond line']) {
      assert.throws(
        () => loadBoundProfile(installedPackage({ frozen: { reason } })),
        /"architecture\.frozen\.reason"/,
      );
    }
  },
);

test(
  'refuses a frozen whose reason holds a control character, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-control-character-refused',
      arrange:
        'bindings whose frozen reason holds a vertical tab, an escape sequence, a tab, DEL, NEL (U+0085), U+2028 and U+2029 in turn',
      act: 'loadBoundProfile loads each binding',
      assert:
        'each throws an error that names architecture.frozen.reason, so a printed reason cannot move the cursor or rewrite the terminal',
    },
  },
  () => {
    for (const reason of [
      'kept\u000bpassed',
      'kept\u001b[1A\u001b[2Kpassed',
      'kept\tfor now',
      'kept\u007f',
      'kept\u0085passed',
      'kept passed',
      'kept passed',
    ]) {
      assert.throws(
        () => loadBoundProfile(installedPackage({ frozen: { reason } })),
        /"architecture\.frozen\.reason" must be one line .* no control characters/,
        JSON.stringify(reason),
      );
    }
    // the reason is checked untrimmed and returned as written
    assert.deepEqual(
      loadBoundProfile(installedPackage({ frozen: { reason: ' kept for the demo ' } })).frozen,
      { reason: ' kept for the demo ' },
    );
  },
);

test(
  'refuses a frozen whose reason is 301 characters long, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-long-reason-refused',
      arrange: 'a binding whose frozen reason is 301 characters long, and one whose reason is 300',
      act: 'loadBoundProfile loads each binding',
      assert:
        'the 301-character reason throws an error that names architecture.frozen.reason; the 300-character one is returned',
    },
  },
  () => {
    assert.throws(
      () => loadBoundProfile(installedPackage({ frozen: { reason: 'x'.repeat(301) } })),
      /"architecture\.frozen\.reason"/,
    );
    assert.equal(
      loadBoundProfile(installedPackage({ frozen: { reason: 'x'.repeat(300) } })).frozen.reason
        .length,
      300,
    );
  },
);

test(
  'refuses a frozen with a key other than reason, naming the field',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'frozen-other-key-refused',
      arrange: 'a binding with frozen: { reason: "kept", since: "0.5.1" }',
      act: 'loadBoundProfile loads the binding',
      assert: 'it throws an error that names architecture.frozen and the key since',
    },
  },
  () => {
    assert.throws(
      () => loadBoundProfile(installedPackage({ frozen: { reason: 'kept', since: '0.5.1' } })),
      /"architecture\.frozen" takes only "reason", not "since"/,
    );
  },
);

test(
  'keeps enforcement and coverage beside frozen',
  {
    tags: ['scenario'],
    meta: {
      spec: 'frozen-beside-enforcement-and-coverage',
      arrange:
        'a binding with enforcement: "advisory", a coverage and frozen: { reason: "kept for the demo" }',
      act: 'loadBoundProfile loads the binding',
      assert: 'the result carries the advisory enforcement, the coverage and the frozen reason',
    },
  },
  () => {
    const profile = loadBoundProfile(
      installedPackage({
        enforcement: 'advisory',
        coverage: 'specified',
        frozen: { reason: 'kept for the demo' },
      }),
    );
    assert.equal(profile.enforcement, 'advisory');
    assert.equal(profile.coverage, 'specified');
    assert.deepEqual(profile.frozen, { reason: 'kept for the demo' });
  },
);
