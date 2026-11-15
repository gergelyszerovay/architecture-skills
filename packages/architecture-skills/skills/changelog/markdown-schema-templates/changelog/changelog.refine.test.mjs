// Specs of changelog.refine.ts: the version headings and the categories of the open sections.
// Run from this folder with Node 23.6 or later (it imports the TypeScript refine directly):
// node --test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refine } from './changelog.refine.ts';

const ENTRY = '* **An entry.** Details.';
const section = (heading, text) => ({ key: heading, heading, text });
const messagesOf = (doc) => {
  const issues = [];
  refine(doc, { addIssue: (issue) => issues.push(issue) });
  return issues.map((issue) => issue.message);
};

test('accepts versions newest first with categories in order', () => {
  assert.deepEqual(
    messagesOf({
      unreleased: `### Added\n\n${ENTRY}\n\n### Fixed\n\n* **Breaking:** **A fix.** Yes.`,
      additionalSections: [
        section('1.0.0', `### Changed\n\n${ENTRY}\n  wrapped line\n\n### Security\n\n${ENTRY}`),
        section('1.0.0-rc.1', `### Added\n\n${ENTRY}`),
        section('0.9.9', `### Removed\n\n${ENTRY}`),
      ],
    }),
    [],
  );
  assert.deepEqual(messagesOf({}), []);
});

test('rejects a heading that is not a bare version, with the date or a v', () => {
  const messages = messagesOf({
    additionalSections: [
      section('0.2.0 (2026-10-15)', `### Added\n\n${ENTRY}`),
      section('v0.1.0', `### Added\n\n${ENTRY}`),
    ],
  });
  assert.equal(messages.length, 2);
  assert.match(
    messages[0],
    /must be a version such as "## 1\.2\.0": the version only, no date, no "v"/,
  );
});

test('rejects versions that do not go newest first', () => {
  const messages = messagesOf({
    additionalSections: [
      section('0.1.0', `### Added\n\n${ENTRY}`),
      section('0.2.0', `### Added\n\n${ENTRY}`),
      section('0.2.0', `### Added\n\n${ENTRY}`),
    ],
  });
  assert.equal(messages.length, 2);
  assert.match(messages[0], /"## 0\.2\.0" is not older than "## 0\.1\.0"/);
});

test('rejects an unknown, repeated, out-of-order or empty category', () => {
  const messages = messagesOf({
    unreleased: `### Fixed\n\n${ENTRY}\n\n### Added\n\n${ENTRY}\n\n### Fixed\n\n${ENTRY}\n\n### Notes\n\n${ENTRY}\n\n### Security`,
  });
  assert.equal(messages.length, 4);
  assert.match(messages[0], /"### Added" is out of order or repeated/);
  assert.match(messages[1], /"### Fixed" is out of order or repeated/);
  assert.match(messages[2], /"### Notes" is not a category/);
  assert.match(messages[3], /"### Security" has no entry/);
});

test('rejects text before the first category and an entry that is not a bold-led bullet', () => {
  const messages = messagesOf({
    unreleased: `Some prose.\n\n### Added\n\n* plain bullet\n\nprose line\n\n* **ok.** yes`,
  });
  assert.equal(messages.length, 3);
  assert.match(messages[0], /Text before the first category/);
  assert.match(messages[1], /must be a bullet that opens with a bold sentence/);
  assert.match(messages[2], /prose line/);
});

test('ignores a heading inside a code fence', () => {
  assert.deepEqual(
    messagesOf({ unreleased: `### Added\n\n${ENTRY}\n\n  \`\`\`\n  ### Not a category\n  \`\`\`` }),
    [],
  );
});

// Specs of architecture-skills plan 0002 (decision 3): the `**Migration:**` marker, an indented line of its own at
// the end of an entry.
const MIGRATION = '  **Migration:** In every `package.json`, delete `version`.';

test(
  'accepts an indented **Migration:** line after an entry’s detail, with or without a blank line before it',
  {
    tags: ['scenario'],
    meta: {
      spec: 'migration-line-accepted',
      arrange:
        'an open section with one entry whose detail is followed directly by "  **Migration:** …", and one with a blank line between them',
      act: 'refine checks each section',
      assert: 'neither reports an issue',
    },
  },
  () => {
    assert.deepEqual(
      messagesOf({ unreleased: `### Changed\n\n${ENTRY}\n  More detail.\n${MIGRATION}` }),
      [],
    );
    assert.deepEqual(
      messagesOf({
        unreleased: `### Changed\n\n${ENTRY}\n  More detail.\n\n${MIGRATION}\n  It runs on.\n\n${ENTRY}`,
      }),
      [],
    );
  },
);

test(
  'refuses a second **Migration:** line in the same entry',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'second-migration-line-refused',
      arrange: 'an entry with two indented **Migration:** lines',
      act: 'refine checks the section',
      assert: 'it reports one issue on the second line, naming the marker',
    },
  },
  () => {
    const messages = messagesOf({
      unreleased: `### Changed\n\n${ENTRY}\n${MIGRATION}\n\n  **Migration:** And the second one.\n\n${ENTRY}\n${MIGRATION}`,
    });
    assert.equal(messages.length, 1);
    assert.match(
      messages[0],
      /second "\*\*Migration:\*\*" line: "\*\*Migration:\*\* And the second one\."/,
    );
  },
);

test(
  'refuses a **Migration:** line with no text after the marker',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'empty-migration-line-refused',
      arrange: 'an entry whose indented line is "  **Migration:**" alone',
      act: 'refine checks the section',
      assert: 'it reports one issue on that line, saying the marker needs text',
    },
  },
  () => {
    const messages = messagesOf({ unreleased: `### Changed\n\n${ENTRY}\n  **Migration:**  ` });
    assert.equal(messages.length, 1);
    assert.match(
      messages[0],
      /"\*\*Migration:\*\*" line under "### Changed" needs text after the marker/,
    );
  },
);

test(
  'refuses a **Migration:** line before any entry of its category',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'migration-line-before-entry-refused',
      arrange: 'a category whose first line after the heading is an indented **Migration:** line',
      act: 'refine checks the section',
      assert: 'it reports one issue on that line, saying it belongs to no entry',
    },
  },
  () => {
    const messages = messagesOf({
      unreleased: `### Added\n\n${ENTRY}\n\n### Changed\n\n${MIGRATION}\n\n${ENTRY}`,
    });
    assert.equal(messages.length, 1);
    assert.match(
      messages[0],
      /"\*\*Migration:\*\*" line belongs to no entry: "\*\*Migration:\*\* In every/,
    );
  },
);

test(
  'accepts an entry that opens with **Breaking:** and carries a **Migration:** line',
  {
    tags: ['scenario'],
    meta: {
      spec: 'breaking-entry-with-migration-accepted',
      arrange:
        'an entry "* **Breaking:** **A binding names the profile only.** …" followed by an indented **Migration:** line',
      act: 'refine checks the section',
      assert: 'it reports no issue',
    },
  },
  () => {
    assert.deepEqual(
      messagesOf({
        additionalSections: [
          section(
            '0.3.0',
            `### Changed\n\n* **Breaking:** **A binding names the profile only.** The loader ignores it.\n\n${MIGRATION}`,
          ),
        ],
      }),
      [],
    );
  },
);

// Spec of the review of architecture-skills plan 0002: the refine rule reads a fenced `**Migration:**` line as an
// example, as `hasMigration` and the lab's parser do.
test(
  'ignores a **Migration:** line inside a fenced code block',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'fenced-migration-line-ignored',
      arrange:
        'an entry with a fenced example holding two **Migration:** lines and an empty one, then its own note',
      act: 'refine checks the section',
      assert: 'it reports no issue: the fenced lines are neither a second note nor an empty one',
    },
  },
  () => {
    assert.deepEqual(
      messagesOf({
        unreleased: `### Changed\n\n${ENTRY}\n\n  \`\`\`\n  **Migration:** One.\n  **Migration:** Two.\n  **Migration:**\n  \`\`\`\n\n${MIGRATION}`,
      }),
      [],
    );
  },
);

test('a version section may be the single nothing-public line, Unreleased and other text may not', () => {
  const none = 'No changes for users of the package.';
  assert.deepEqual(
    messagesOf({ additionalSections: [section('1.0.0', none), section('0.9.0', `${none}\n`)] }),
    [],
  );
  assert.equal(messagesOf({ unreleased: none }).length, 1);
  assert.equal(messagesOf({ additionalSections: [section('1.0.0', `${none} More.`)] }).length, 1);
});
