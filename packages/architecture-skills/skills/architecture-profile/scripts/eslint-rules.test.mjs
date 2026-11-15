// Scenarios of eslint-rules.cjs: the `tsdoc-syntax` wrapper of `tsdoc/syntax`, and the builders
// on a frozen profile (architecture-skills plan 0002).
// Run from the skill's folder: node --test scripts/*.test.mjs
//
// ESLint and eslint-plugin-tsdoc are devDependencies of this package; the spec requires them, so a missing
// or uninstalled one fails the spec. No scenario is skipped.
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, it, test } from 'node:test';

const require = createRequire(import.meta.url);
const {
  buildEntryOnly,
  buildMaxFacades,
  buildProvidersOnly,
  buildRestrictedSyntax,
  tsdocSyntaxPlugin,
} = require('./eslint-rules.cjs');
const { loadBoundProfile } = require('./load-profile.cjs');

/** The skills package's root: three folders above this script. */
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { Linter } = require('eslint');
const tsdoc = require('eslint-plugin-tsdoc');

/**
 * Lints one comment with a rule.
 * @param {string} body - The comment's text, without `/**` and `*\/`.
 * @param {'tsdoc/syntax' | 'architecture-skills/tsdoc-syntax'} rule - The rule to run.
 * @returns {string[]} The message ids reported.
 */
function lint(body, rule) {
  const linter = new Linter({ configType: 'flat' });
  const messages = linter.verify(
    `/**\n * ${body}\n */\nexport const x = 1;\n`,
    [
      {
        files: ['**/*.js'],
        plugins: { tsdoc, 'architecture-skills': tsdocSyntaxPlugin(tsdoc) },
        rules: { [rule]: 'error' },
      },
    ],
    'probe.js',
  );
  for (const message of messages) {
    assert.ok(message.ruleId !== null, `a fatal message: ${message.message}`);
  }
  return messages.map((message) => message.message.split(':')[0]);
}

describe('tsdoc-syntax: a link to a repository-root path', () => {
  const accepted = [
    '{@link /products/reviewer2/layered-docs/2.reviewer2.constitution.md#D21 | D21}',
    '{@link /products/reviewer2/layered-docs/2.reviewer2.constitution.md#D21}',
    '{@link /products/reviewer2/layered-docs/2.reviewer2.browser.file-tree.region.md#L1 | L1}',
    '{@link /reviewer2/README.md | the README}',
    '{@link\n *   /reviewer2/layered-docs/2.reviewer2.constitution.md#D55 | D55}',
  ];
  for (const link of accepted) {
    it(`accepts ${link.replace(/\n \*\s+/, ' ')}, which tsdoc/syntax rejects`, () => {
      assert.notDeepEqual(lint(`See ${link}.`, 'tsdoc/syntax'), []);
      assert.deepEqual(lint(`See ${link}.`, 'architecture-skills/tsdoc-syntax'), []);
    });
  }

  it('accepts the forms the parser takes already', () => {
    for (const link of [
      '{@link ../../layered-docs/2.reviewer2.constitution.md#D21 | D21}',
      '{@link reviewer2/layered-docs/2.reviewer2.constitution.md#D21 | D21}',
      '{@link @gergelyszerovay/reviewer2-repository-manifest#resolveLink | resolveLink}',
    ]) {
      assert.deepEqual(lint(`See ${link}.`, 'architecture-skills/tsdoc-syntax'), []);
    }
  });
});

describe('tsdoc-syntax: every other message', () => {
  const rejected = [
    // Root targets that are no file path.
    '{@link /foo | x}',
    '{@link /@scope/pkg#X | x}',
    '{@link /reviewer2/a b.md | x}',
    // A root target followed by a malformed rest of the tag.
    '{@link /a.md#D1 D1}',
    '{@link /a.md#D1 | D1 | x}',
    '{@link /a.md#D1 /b.md#D2 | x}',
    '{@link /a.md#D1 trailing words}',
    // The import-path message outside a link tag.
    '{@inheritDoc /reviewer2/README.md#X}',
    // Other syntax errors.
    'An unknown tag. @notATag',
    '@param x a parameter without its hyphen',
    'An unclosed {@link tag',
    'A `code span that never closes',
  ];
  for (const body of rejected) {
    it(`reports what tsdoc/syntax reports for ${JSON.stringify(body)}`, () => {
      const original = lint(body, 'tsdoc/syntax');
      assert.notDeepEqual(original, []);
      assert.deepEqual(lint(body, 'architecture-skills/tsdoc-syntax'), original);
    });
  }

  it('reports the other messages of a comment that has a root link', () => {
    const body = 'See {@link /reviewer2/README.md#D1 | D1}. @notATag';
    const original = lint(body, 'tsdoc/syntax');
    assert.ok(original.includes('tsdoc-reference-malformed-import-path'));
    assert.deepEqual(
      lint(body, 'architecture-skills/tsdoc-syntax'),
      original.filter((id) => id !== 'tsdoc-reference-malformed-import-path'),
    );
    assert.notDeepEqual(lint(body, 'architecture-skills/tsdoc-syntax'), []);
  });

  it('is one plugin object per tsdoc plugin', () => {
    assert.equal(tsdocSyntaxPlugin(tsdoc), tsdocSyntaxPlugin(tsdoc));
  });
});

// Spec of architecture-skills plan 0002 (decision 5): a frozen profile gets no rule of the profile. Each profile is
// loaded from an installed copy (the profile and its constitution) below a package in a folder under the skills
// package's node_modules, once bound plainly and once frozen.
const fixtures = [];
after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/** Loads `profileName` for a package whose binding adds `extra`. */
function loadInstalled(profileName, extra) {
  const cache = join(packageRoot, 'node_modules', '.cache');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'eslint-rules-'));
  fixtures.push(root);
  const skill = join(root, '.claude', 'skills', profileName);
  mkdirSync(skill, { recursive: true });
  for (const file of [`${profileName}.architecture-profile.md`, `${profileName}.constitution.md`]) {
    copyFileSync(join(packageRoot, 'skills', profileName, file), join(skill, file));
  }
  const pkg = join(root, 'pkg');
  mkdirSync(pkg);
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({ name: 'demo', architecture: { profile: profileName, ...extra } }),
  );
  return loadBoundProfile(pkg);
}

test(
  'every builder returns no rule for a frozen profile, and the same rules as before for one that is not',
  {
    tags: ['invariant'],
    meta: { spec: 'builders-return-no-rule-when-frozen' },
  },
  () => {
    const builders = {
      buildRestrictedSyntax: (profile) => buildRestrictedSyntax(profile, { base: [] }),
      buildMaxFacades,
      buildProvidersOnly,
      buildEntryOnly,
    };
    let built = 0;
    for (const name of [
      'angular-block-architecture',
      'node-block-architecture',
      'three-block-architecture',
      'product-profile',
    ]) {
      const plain = loadInstalled(name, {});
      const frozen = loadInstalled(name, { frozen: { reason: 'kept for the demo' } });
      for (const [builder, build] of Object.entries(builders)) {
        assert.deepEqual(build(frozen), [], `${builder} of a frozen ${name}`);
        const entries = build(plain);
        built += entries.length;
        // the rules a plain binding gets are those of the profile without any frozen field
        assert.deepEqual(
          entries.map((entry) => entry.name),
          build({ ...plain, frozen: undefined }).map((entry) => entry.name),
        );
      }
    }
    // the angular and node profiles have eslint-enforced rules, so the comparison is not empty
    assert.ok(built >= 3, `only ${built} entries built`);
  },
);
