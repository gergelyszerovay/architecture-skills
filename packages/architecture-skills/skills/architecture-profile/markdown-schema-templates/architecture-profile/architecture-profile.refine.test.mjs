// Rules 7, 9 and 10 of architecture-profile.refine.ts: rule names are in the vocabulary, a role
// parameter names a row of Library roles, and a `blocks` parameter names blocks.
// Run from this folder with Node 23.6 or later (it imports the TypeScript refine directly):
// node --test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refine } from './architecture-profile.refine.ts';

/** A parsed profile with two roles and the given structural rule rows. */
const profileWith = (structuralRules) => ({
  identity: { Classifier: 'file-suffix' },
  layers: [{ Layer: 'domain' }],
  libraryRoles: [
    { Role: 'feature', 'May depend on': 'shared' },
    { Role: 'shared', 'May depend on': 'shared' },
  ],
  blocks: [
    { Block: '.model.ts', Layer: 'domain', 'May depend on': 'none' },
    { Block: '.use-case.ts', Layer: 'domain', 'May depend on': 'step' },
    { Block: '.step.ts', Layer: 'domain', 'May depend on': 'step' },
  ],
  structuralRules,
  coverageRules: [],
  specKinds: [],
});

/** The messages the refine reports for a profile. */
const issuesOf = (doc) => {
  const issues = [];
  refine(doc, { addIssue: (issue) => issues.push(issue) });
  return issues;
};

test('accepts role parameters that name rows of Library roles', () => {
  const issues = issuesOf(
    profileWith([
      {
        Rule: 'library-roles',
        Parameters: 'role-source=context-path; default-role=feature; shared-role=shared',
      },
      {
        Rule: 'contract-only',
        Parameters: 'blocks=model; contract-roles=feature; index-roles=feature, shared',
      },
    ]),
  );
  assert.deepEqual(issues, []);
});

test('rejects a role parameter that names no row, at the rule row', () => {
  const issues = issuesOf(
    profileWith([
      { Rule: 'library-roles', Parameters: 'role-source=context-path; default-role=bogus' },
      {
        Rule: 'contract-only',
        Parameters: 'blocks=model; contract-roles=feature; index-roles=feature, shell',
      },
    ]),
  );
  assert.deepEqual(
    issues.map((issue) => [issue.path, issue.message]),
    [
      [
        ['structuralRules', 0, 'Parameters'],
        'library-roles: default-role names "bogus", which is not in Library roles.',
      ],
      [
        ['structuralRules', 1, 'Parameters'],
        'contract-only: index-roles names "shell", which is not in Library roles.',
      ],
    ],
  );
});

test('ignores parameters that name no roles', () => {
  const issues = issuesOf(
    profileWith([{ Rule: 'context-access', Parameters: 'contexts=package-doc; shared-dir=bogus' }]),
  );
  assert.deepEqual(issues, []);
});

test('accepts private-blocks with a blocks parameter that names blocks', () => {
  const issues = issuesOf(profileWith([{ Rule: 'private-blocks', Parameters: 'blocks=step' }]));
  assert.deepEqual(issues, []);
});

test('accepts providers-only, whose blocks parameter names blocks', () => {
  const issues = issuesOf(profileWith([{ Rule: 'providers-only', Parameters: 'blocks=step' }]));
  assert.deepEqual(issues, []);
});

test('accepts lazy-places, which takes no parameter', () => {
  const issues = issuesOf(profileWith([{ Rule: 'lazy-places', Parameters: 'none' }]));
  assert.deepEqual(issues, []);
});

test('accepts entry-only, whose blocks parameter names blocks', () => {
  const issues = issuesOf(profileWith([{ Rule: 'entry-only', Parameters: 'blocks=step' }]));
  assert.deepEqual(issues, []);
});

test('rejects a providers-only blocks parameter that names no block', () => {
  const issues = issuesOf(
    profileWith([{ Rule: 'providers-only', Parameters: 'blocks=providers' }]),
  );
  assert.deepEqual(
    issues.map((issue) => [issue.path, issue.message]),
    [
      [
        ['structuralRules', 0, 'Parameters'],
        'providers-only: blocks names "providers", which is not a block.',
      ],
    ],
  );
});

test('rejects a blocks parameter that names no block, at the rule row', () => {
  const issues = issuesOf(
    profileWith([{ Rule: 'private-blocks', Parameters: 'blocks=step, helper' }]),
  );
  assert.deepEqual(
    issues.map((issue) => [issue.path, issue.message]),
    [
      [
        ['structuralRules', 0, 'Parameters'],
        'private-blocks: blocks names "helper", which is not a block.',
      ],
    ],
  );
});

// The Enforced by enums are not checked by the refine; they are part of the template's schema,
// which validate-md applies. This test pins both tables' enums to the same list, which names
// architecture-check beside the file-level tools.
test('both Enforced by enums name architecture-check', async () => {
  const { readFileSync } = await import('node:fs');
  const template = readFileSync(
    new URL('./architecture-profile.template.md', import.meta.url),
    'utf8',
  );
  const enums = template.match(/^Enforced by: enum: .*$/gm) ?? [];
  assert.equal(enums.length, 2);
  for (const line of enums) {
    assert.match(line, /\| architecture-check \|/);
    assert.match(line, /dependency-cruiser \| eslint \| oxlint \| checker/);
  }
});
