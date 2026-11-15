// Specs of check-changelogs and release-changelog: finding packages and skills, every refusal of
// the default check, `--staged`, `--release` with the Breaking step, and release-changelog.
// node --test skills/changelog/scripts/
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  checkRelease,
  checkSubject,
  checkTree,
  groupsOf,
  publicFolderTest,
  twinProblems,
  isListedInFiles,
  isShippedChange,
  stagedWarnings,
} from './check-changelogs.mjs';
import {
  NO_PUBLIC_CHANGES,
  coversOf,
  entriesOf,
  findGroupChangelog,
  findSubjects,
  groupOf,
  hasMigration,
  isUnscanned,
  listFiles,
  readSkillFrontmatter,
  workspaceFolders,
  workspacePatterns,
} from './changelog-lib.mjs';
import {
  groupBody,
  planBump,
  planGroup,
  prefixEntry,
  releasePublicText,
  raiseVersion,
  releaseGroupText,
  releaseText,
  requiredStep,
  setPackageVersion,
  setProfileVersion,
  setSkillVersion,
} from './release-changelog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const BIN = join(here, '..', '..', '..', 'node_modules', '.bin');
// validate-md, as `pnpm run test` finds it
process.env.PATH = `${BIN}:${process.env.PATH}`;
const CHECK = join(here, 'check-changelogs.mjs');
const RELEASE = join(here, 'release-changelog.mjs');

/** A changelog with the given sections (each a heading and a body). */
const changelog = (name, ...sections) =>
  `# Changelog: ${name}\n\nRelease notes for those who consume a version.\n\n${sections.join('\n\n')}\n`;
const ADDED = (text) => `### Added\n\n- **${text}.** Details.`;

/** Makes a Git repository with files (path to text) and returns its folder. */
const repository = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'lab-changelogs-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  writeFileSync(join(root, '.gitignore'), 'node_modules\n');
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  execFileSync('git', ['add', '-A'], { cwd: root });
  return root;
};
const manifest = (extra = {}) =>
  JSON.stringify({
    name: '@scope/pkg',
    version: '1.2.0',
    publishConfig: { registry: 'https://npm.pkg.github.com' },
    files: ['dist', 'src', 'skills', 'CHANGELOG.md', '.skeleton'],
    ...extra,
  });
const skillMd = (version) =>
  `---\nname: my-skill\ndescription: A skill.\n${version === undefined ? '' : `metadata:\n  version: "${version}"\n`}---\n\n# My skill\n`;
const withRepository = (files, run) => {
  const root = repository(files);
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};
/** Commits what is staged, so later edits are staged changes against `HEAD`. */
const commitAll = (root) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base'], {
    cwd: root,
  });
/** Stages `text` as the new content of a file. */
const stage = (root, path, text) => {
  writeFileSync(join(root, path), text);
  execFileSync('git', ['add', '--', path], { cwd: root });
};
const subjectsOf = (root) => findSubjects(root, listFiles(root));
const run = (script, args, cwd) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
  });

test("skips the person's notes: a package or a skill under .notes/ or planning/notes/ is not found", () => {
  withRepository(
    {
      'a/package.json': manifest(),
      '.notes/tool/package.json': manifest({ name: 'notes-tool' }),
      'p/.notes/skills/idea/SKILL.md': skillMd('0.1.0'),
      'p/planning/notes/x/package.json': manifest({ name: 'old-notes-tool' }),
    },
    (root) => {
      assert.deepEqual(
        subjectsOf(root).map(({ name }) => name),
        ['@scope/pkg'],
      );
    },
  );
});

test('finds published packages and skills, in dot-folders too, and skips private packages, a private one with a publishConfig and node_modules', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'b/package.json': JSON.stringify({ name: 'private-one', private: true }),
      'c/package.json': JSON.stringify({
        name: 'both',
        private: true,
        publishConfig: { registry: 'r' },
        version: '0.1.0',
      }),
      'a/.claude/skills/my-skill/SKILL.md': skillMd('0.3.0'),
      'lab/.claude/skills/own/SKILL.md': skillMd(undefined),
      'node_modules/x/package.json': manifest({ name: 'x' }),
      'e/package.json': JSON.stringify({ version: '1.0.0' }),
    },
    (root) => {
      assert.deepEqual(
        subjectsOf(root).map(({ kind, name, version }) => [kind, name, version]),
        [
          ['package', '@scope/pkg', '1.2.0'],
          ['skill', 'my-skill', '0.3.0'],
        ],
      );
    },
  );
});

test('the default check refuses a manifest that is neither private nor given a publishConfig, and one that is both', () => {
  withRepository(
    {
      'open/package.json': JSON.stringify({ name: 'open', version: '1.0.0' }),
      'both/package.json': JSON.stringify({
        name: 'both',
        private: true,
        version: '1.0.0',
        publishConfig: { registry: 'r' },
      }),
      'ok/package.json': manifest(),
      'ok/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', '## 1.2.0\n\n' + ADDED('First')),
      'closed/package.json': JSON.stringify({ name: 'closed', private: true, version: '1.0.0' }),
      'unnamed/package.json': JSON.stringify({ version: '1.0.0' }),
    },
    (root) => {
      const { subjects, problems } = checkTree(root, false);
      assert.equal(subjects, 1);
      assert.deepEqual(problems, [
        'both: private and has a publishConfig; remove one',
        'open: not private and no publishConfig; add "publishConfig": { "registry": … } to publish it (GitHub Packages, lab D21), or "private": true',
      ]);
      const result = run(CHECK, ['--no-validate', '.'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /open: not private and no publishConfig/);
    },
  );
});

test('--release keeps exiting 2 for a folder whose manifest breaks the publish rule', () => {
  withRepository(
    {
      'open/package.json': JSON.stringify({ name: 'open', version: '1.0.0' }),
      'both/package.json': JSON.stringify({
        name: 'both',
        private: true,
        version: '1.0.0',
        publishConfig: { registry: 'r' },
      }),
    },
    (root) => {
      for (const folder of ['open', 'both']) {
        const result = run(CHECK, ['--release', '--no-validate', folder], root);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /is not a published package/);
      }
    },
  );
});

test('a skill takes its version from its profile, else from metadata.version', () => {
  withRepository(
    {
      'package.json': manifest(),
      's/SKILL.md': skillMd('9.9.9'),
      's/s.architecture-profile.md':
        '# Profile: s\n\n## 1. Identity\n\n- Version: 0.4.1\n- Classifier: x\n',
      't/SKILL.md': skillMd('0.2.0'),
      'u/SKILL.md': skillMd(undefined),
    },
    (root) => {
      assert.deepEqual(
        subjectsOf(root)
          .filter(({ kind }) => kind === 'skill')
          .map(({ dir, version }) => [dir.slice(root.length + 1), version]),
        [
          ['s', '0.4.1'],
          ['t', '0.2.0'],
          ['u', undefined],
        ],
      );
    },
  );
  assert.deepEqual(
    readSkillFrontmatter('---\nname: "q"\nmetadata:\n  author: me\n  version: \'1.0.0\'\n---\n'),
    {
      name: 'q',
      version: '1.0.0',
    },
  );
});

test('a package or skill with a good changelog passes', () => {
  withRepository(
    {
      'p/package.json': manifest(),
      'p/CHANGELOG.md': changelog(
        '@scope/pkg',
        '## Unreleased',
        `## 1.2.0\n\n${ADDED('A thing')}`,
        `## 1.1.0\n\n${ADDED('Older')}`,
      ),
      'p/skills/my-skill/SKILL.md': skillMd('0.3.0'),
      'p/skills/my-skill/CHANGELOG.md': changelog(
        'my-skill',
        '## Unreleased',
        `## 0.3.0\n\n${ADDED('The skill')}`,
      ),
    },
    (root) => {
      assert.deepEqual(checkTree(root, true), { subjects: 2, problems: [] });
    },
  );
});

test('refuses a missing changelog, a changelog not in files, a wrong title and a missing Unreleased', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'b/package.json': manifest({ name: 'b', files: ['dist'] }),
      'b/CHANGELOG.md': changelog('b', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'c/package.json': manifest({ name: 'c' }),
      'c/CHANGELOG.md': changelog('other', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'd/package.json': manifest({ name: 'd' }),
      'd/CHANGELOG.md': changelog('d', `## 1.2.0\n\n${ADDED('x')}`),
    },
    (root) => {
      const { problems } = checkTree(root, false);
      assert.equal(problems.length, 4);
      assert.match(problems[0], /^a: package @scope\/pkg: no CHANGELOG\.md beside package\.json/);
      assert.match(problems[1], /^b: .*`files` does not list CHANGELOG\.md/);
      assert.match(problems[2], /^c: .*the title is "Changelog: other", it must be "Changelog: c"/);
      assert.match(problems[3], /^d: .*no "## Unreleased" section/);
    },
  );
});

test('refuses an Unreleased section placed below a version heading', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog(
        '@scope/pkg',
        `## 1.2.0\n\n${ADDED('x')}`,
        '## Unreleased',
        `## 1.1.0\n\n${ADDED('y')}`,
      ),
    },
    (root) => {
      const { problems } = checkTree(root, false);
      assert.equal(problems.length, 1);
      assert.match(problems[0], /^a: .*"## Unreleased" must come before every version heading/);
    },
  );
});

test('refuses a top version heading that differs from the version, and a skill without a version', () => {
  withRepository(
    {
      'a/package.json': manifest({ version: '1.3.0' }),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'a/s/SKILL.md': skillMd(undefined),
      'a/s/CHANGELOG.md': changelog('my-skill', '## Unreleased', `## 0.1.0\n\n${ADDED('x')}`),
      'a/t/SKILL.md': skillMd('0.1.0'),
      'a/t/CHANGELOG.md': changelog(
        'my-skill',
        '## Unreleased',
        `## 0.1.0 (2026-10-15)\n\n${ADDED('x')}`,
      ),
    },
    (root) => {
      const { problems } = checkTree(root, false);
      assert.equal(problems.length, 4);
      assert.match(
        problems[0],
        /top version heading is 1\.2\.0, the version in `version` of package\.json is 1\.3\.0/,
      );
      assert.match(problems[1], /no valid version in `metadata\.version` of SKILL\.md \(missing\)/);
      assert.match(
        problems[2],
        /the "## 0\.1\.0 \(2026-10-15\)" heading is neither "Unreleased" nor a version/,
      );
      assert.match(problems[3], /no version heading/);
    },
  );
});

test('validate-md rejects a changelog that breaks the template', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog(
        '@scope/pkg',
        '## Unreleased',
        `## 1.2.0\n\n### Fixed\n\nFree text.`,
      ),
    },
    (root) => {
      const result = run(CHECK, ['.'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /validate-md rejected a changelog/);
      assert.match(result.stderr, /must be a bullet that opens with a bold sentence/);
    },
  );
});

test('exits 0 with a message when everything is right and 2 for a bad call', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
    },
    (root) => {
      const ok = run(CHECK, ['.'], root);
      assert.equal(ok.status, 0);
      assert.match(ok.stdout, /1 package\(s\) and skill\(s\) under \. have a changelog/);
      assert.equal(run(CHECK, [], root).status, 2);
      assert.equal(run(CHECK, ['--bogus', '.'], root).status, 2);
    },
  );
});

test('--staged warns about shipped files staged without the changelog, and never fails', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'a/src/index.ts': 'export {};\n',
      'a/skills/my-skill/SKILL.md': skillMd('0.3.0'),
      'a/skills/my-skill/CHANGELOG.md': changelog(
        'my-skill',
        '## Unreleased',
        `## 0.3.0\n\n${ADDED('x')}`,
      ),
    },
    (root) => {
      const warnings = stagedWarnings(root, ['a/src/index.ts', 'a/skills/my-skill/SKILL.md']);
      assert.equal(warnings.length, 2);
      assert.match(
        warnings[0],
        /^warning: a \(package\) has staged changes to shipped files \(src\/index\.ts\) and no change to its CHANGELOG\.md/,
      );
      assert.match(warnings[1], /^warning: a\/skills\/my-skill \(skill\) .*\(SKILL\.md\)/);
      // a staged changelog that adds an entry under Unreleased silences it
      commitAll(root);
      stage(
        root,
        'a/CHANGELOG.md',
        changelog('@scope/pkg', `## Unreleased\n\n${ADDED('y')}`, `## 1.2.0\n\n${ADDED('x')}`),
      );
      assert.deepEqual(stagedWarnings(root, ['a/src/index.ts', 'a/CHANGELOG.md']), []);
      assert.deepEqual(stagedWarnings(root, ['a/.notes/x.ts', 'a/.notes/package.json']), []);
      assert.deepEqual(
        stagedWarnings(root, ['a/src/a.test.ts', 'a/README.md', 'other/x.ts']).length,
        1,
      );
      // the command line reads the staged files and exits 0 with the warning
      const git = (...args) =>
        execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root });
      git('commit', '-q', '-m', 'x');
      writeFileSync(join(root, 'a/src/index.ts'), 'export const a = 1;\n');
      git('add', '-A');
      const result = run(CHECK, ['--staged'], root);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /check-changelogs: warning: a \(package\)/);
      assert.equal(run(CHECK, ['--staged', 'a/CHANGELOG.md'], root).stdout, '');
    },
  );
});

test('a staged file counts as a shipped change by its kind', () => {
  for (const [path, kind, expected] of [
    ['src/index.ts', 'package', true],
    ['README.md', 'package', true],
    ['docs/guide.md', 'package', false],
    ['references/rules.md', 'skill', true],
    ['CHANGELOG.md', 'skill', false],
    ['src/a.test.ts', 'package', false],
    ['layered-docs/1.x.md', 'package', false],
    ['tsconfig.json', 'package', false],
    ['package.json', 'package', true],
    ['scripts/x.test.mjs', 'skill', false],
  ]) {
    assert.equal(isShippedChange(path, kind), expected, path);
  }
});

test('a package with a files list ships what the list includes, a Markdown file too, on top of what it ships without the list', () => {
  const files = ['assets', 'bin/*.mjs', './skills/', 'CHANGELOG.md'];
  for (const [path, expected] of [
    ['assets/manual/0.index.md', true],
    ['bin/lab.mjs', true],
    ['bin/notes.txt', true], // a glob entry is matched by its directory part
    ['lib/x.mjs', true], // not listed, but shipped without the list too
    ['lib/notes.md', false], // Markdown ships only when listed
    ['skills/lab/SKILL.md', true],
    ['docs/guide.md', false],
    ['src/index.ts', true], // what a package ships without the list still counts
    ['package.json', true],
    ['README.md', true],
    ['LICENSE', true],
    ['assets/x.test.mjs', false],
    ['assets/tsconfig.json', false],
    ['assets/layered-docs/1.x.md', false],
    ['CHANGELOG.md', false],
    ['docs/README.md', true], // a README, as without the list
  ]) {
    assert.equal(isShippedChange(path, 'package', files), expected, path);
  }
  // a package that lists only dist still ships its sources
  assert.equal(isShippedChange('src/index.ts', 'package', ['dist']), true);
  assert.equal(isShippedChange('docs/guide.md', 'package', ['dist']), false);
  assert.equal(isShippedChange('dist/index.js', 'package', ['dist']), false);
  // without a files list, today's rule: no Markdown but a README
  assert.equal(isShippedChange('assets/manual/0.index.md', 'package', undefined), false);
  assert.equal(isShippedChange('assets/manual/0.index.md', 'skill', files), true);
});

test('a glob entry of files matches only under its directory part', () => {
  assert.equal(isListedInFiles('bin/lab.mjs', ['bin/*.mjs']), true);
  assert.equal(isListedInFiles('bin/sub/lab.mjs', ['bin/*.mjs']), true);
  assert.equal(isListedInFiles('lib/lab.mjs', ['bin/*.mjs']), false);
  assert.equal(isListedInFiles('dist/chunk-a.js', ['dist/chunk-*.js']), true);
  assert.equal(isListedInFiles('other/chunk-a.js', ['dist/chunk-*.js']), false);
  // no `/` before the `*`: files at the package root only
  assert.equal(isListedInFiles('notes.md', ['*.md']), true);
  assert.equal(isListedInFiles('docs/notes.md', ['*.md']), false);
});

test('--staged warns about a source change of a package whose files list only dist, and about a listed Markdown file', () => {
  withRepository(
    {
      'a/package.json': manifest({ files: ['dist', 'assets', 'CHANGELOG.md'] }),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'a/src/index.ts': 'export {};\n',
      'a/assets/manual.md': '# Manual\n',
      'a/docs/guide.md': '# Guide\n',
    },
    (root) => {
      commitAll(root);
      assert.equal(stagedWarnings(root, ['a/src/index.ts']).length, 1);
      assert.equal(stagedWarnings(root, ['a/assets/manual.md']).length, 1);
      assert.deepEqual(stagedWarnings(root, ['a/docs/guide.md']), []);
    },
  );
});

test('--staged sees a deleted file, a shipped manual, and a changelog edit that adds no entry', () => {
  const base = changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`);
  withRepository(
    {
      'a/package.json': manifest({ files: ['assets', 'CHANGELOG.md'] }),
      'a/CHANGELOG.md': base,
      'a/assets/manual/0.index.md': '# Manual\n',
      'a/assets/old.mjs': 'export {};\n',
      'a/docs/guide.md': '# Guide\n',
    },
    (root) => {
      commitAll(root);
      // a deleted shipped file warns; the package still owns it
      execFileSync('git', ['rm', '-q', 'a/assets/old.mjs'], { cwd: root });
      const deleted = stagedWarnings(root, ['a/assets/old.mjs']);
      assert.equal(deleted.length, 1);
      assert.match(deleted[0], /^warning: a \(package\) .*\(assets\/old\.mjs\)/);
      // a manual under a listed folder warns, a document outside files does not
      assert.equal(stagedWarnings(root, ['a/assets/manual/0.index.md']).length, 1);
      assert.deepEqual(stagedWarnings(root, ['a/docs/guide.md']), []);
      // a changelog edit outside Unreleased (a new version heading text) silences nothing
      stage(root, 'a/CHANGELOG.md', base.replace('Details.', 'More details.'));
      assert.equal(stagedWarnings(root, ['a/assets/old.mjs', 'a/CHANGELOG.md']).length, 1);
      // a release (Unreleased emptied under a new heading) silences nothing either
      stage(
        root,
        'a/CHANGELOG.md',
        changelog(
          '@scope/pkg',
          '## Unreleased',
          `## 1.3.0\n\n${ADDED('y')}`,
          `## 1.2.0\n\n${ADDED('x')}`,
        ),
      );
      assert.equal(stagedWarnings(root, ['a/assets/old.mjs', 'a/CHANGELOG.md']).length, 1);
      // an added Unreleased bullet does
      stage(
        root,
        'a/CHANGELOG.md',
        changelog('@scope/pkg', `## Unreleased\n\n${ADDED('z')}`, `## 1.2.0\n\n${ADDED('x')}`),
      );
      assert.deepEqual(stagedWarnings(root, ['a/assets/old.mjs', 'a/CHANGELOG.md']), []);
      // a deleted changelog silences nothing
      execFileSync('git', ['rm', '-q', '-f', 'a/CHANGELOG.md'], { cwd: root });
      assert.equal(stagedWarnings(root, ['a/assets/old.mjs', 'a/CHANGELOG.md']).length, 1);
    },
  );
});

/** A published app that covers a private library, and the library's files. */
const COVERING = {
  'apps/app/package.json': manifest({
    name: '@scope/app',
    version: '1.0.0',
    changelog: { covers: ['@scope/lib'] },
  }),
  'apps/app/CHANGELOG.md': changelog('@scope/app', '## Unreleased', `## 1.0.0\n\n${ADDED('x')}`),
  'apps/app/src/index.ts': 'export {};\n',
  'libs/lib/package.json': JSON.stringify({ name: '@scope/lib', version: '0.1.0', private: true }),
  'libs/lib/src/index.ts': 'export {};\n',
  'libs/lib/src/index.spec.ts': 'export {};\n',
  'libs/lib/src/testing/helper.ts': 'export {};\n',
  'libs/lib/src/parts/part.fixture.ts': 'export {};\n',
  'libs/lib/README.md': '# lib\n',
  'libs/lib/layered-docs/1.lib.md': '# lib\n',
  'libs/other/package.json': JSON.stringify({
    name: '@scope/other',
    version: '0.1.0',
    private: true,
  }),
  'libs/other/src/index.ts': 'export {};\n',
};

test('a private package that a published package covers counts for it, and the covering changelog silences it', () => {
  withRepository(COVERING, (root) => {
    const warnings = stagedWarnings(root, ['libs/lib/src/index.ts']);
    assert.equal(warnings.length, 1);
    assert.match(
      warnings[0],
      /^warning: apps\/app \(package\) has staged changes to shipped files \(@scope\/lib: src\/index\.ts\) and no change to its CHANGELOG\.md \(apps\/app\/CHANGELOG\.md\)/,
    );
    commitAll(root);
    stage(
      root,
      'apps/app/CHANGELOG.md',
      changelog('@scope/app', `## Unreleased\n\n${ADDED('y')}`, `## 1.0.0\n\n${ADDED('x')}`),
    );
    assert.deepEqual(stagedWarnings(root, ['libs/lib/src/index.ts', 'apps/app/CHANGELOG.md']), []);
    // a private package that nothing covers is never warned about
    assert.deepEqual(stagedWarnings(root, ['libs/other/src/index.ts']), []);
    // specs, test support, Markdown and layered docs are not shipped by the covering package
    assert.deepEqual(
      stagedWarnings(root, [
        'libs/lib/src/index.spec.ts',
        'libs/lib/src/testing/helper.ts',
        'libs/lib/src/parts/part.fixture.ts',
        'libs/lib/README.md',
        'libs/lib/layered-docs/1.lib.md',
      ]),
      [],
    );
  });
});

test('--staged names the covering changelog for a staged change to a covered private package', () => {
  withRepository(COVERING, (root) => {
    const git = (...args) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root });
    git('commit', '-q', '-m', 'x');
    writeFileSync(join(root, 'libs/lib/src/index.ts'), 'export const lib = 1;\n');
    git('add', '-A');
    const warned = run(CHECK, ['--staged'], root);
    assert.equal(warned.status, 0);
    assert.match(
      warned.stdout,
      /check-changelogs: warning: apps\/app \(package\) .*\(apps\/app\/CHANGELOG\.md\)/,
    );
    writeFileSync(
      join(root, 'apps/app/CHANGELOG.md'),
      changelog(
        '@scope/app',
        '## Unreleased',
        '### Added\n\n- **The library changed.** Details.',
        `## 1.0.0\n\n${ADDED('x')}`,
      ),
    );
    git('add', 'apps/app/CHANGELOG.md');
    assert.equal(run(CHECK, ['--staged'], root).stdout, '');
  });
});

test('a bundled private package ships its code, while a published package keeps its own testing folder', () => {
  for (const [path, kind, expected] of [
    ['src/index.ts', 'bundled', true],
    ['libs/x/src/lib/a.ts', 'bundled', true],
    ['package.json', 'bundled', false],
    ['README.md', 'bundled', false],
    ['docs/guide.md', 'bundled', false],
    ['src/a.spec.ts', 'bundled', false],
    ['src/testing/helper.ts', 'bundled', false],
    ['src/fixtures/sample.json', 'bundled', false],
    ['src/a.fixture.ts', 'bundled', false],
    ['layered-docs/1.x.md', 'bundled', false],
    ['tsconfig.json', 'bundled', false],
    ['src/testing/helper.ts', 'package', true],
  ]) {
    assert.equal(isShippedChange(path, kind), expected, `${kind} ${path}`);
  }
});

test('a bundled private package ships none of its test support, root manifest or configuration, while a published package keeps them', () => {
  for (const [path, kind, expected] of [
    ['src/testing.ts', 'bundled', false],
    ['src/parts/editor-parts.fake.ts', 'bundled', false],
    ['src/a.contract.ts', 'bundled', false],
    ['src/a.stub.ts', 'bundled', false],
    ['src/a.mock.ts', 'bundled', false],
    ['package.json', 'bundled', false],
    ['bin/x.mjs', 'bundled', false],
    ['scripts/build.mjs', 'bundled', false],
    ['angular.json', 'bundled', false],
    ['.postcssrc.json', 'bundled', false],
    ['components.json', 'bundled', false],
    ['.editorconfig', 'bundled', false],
    ['proxy.conf.mjs', 'bundled', false],
    ['libs/x/package.json', 'bundled', true],
    ['libs/x/scripts/y.ts', 'bundled', true],
    ['public/logo.svg', 'bundled', true],
    ['index.ts', 'bundled', true],
    ['src/testing.ts', 'package', true],
    ['src/parts/editor-parts.fake.ts', 'package', true],
    ['package.json', 'package', true],
    ['bin/x.mjs', 'package', true],
    ['angular.json', 'package', true],
  ]) {
    assert.equal(isShippedChange(path, kind), expected, `${kind} ${path}`);
  }
});

test('a staged root manifest or test-only helper of a covered private package warns nobody, and a shipped file still warns', () => {
  withRepository(COVERING, (root) => {
    assert.deepEqual(
      stagedWarnings(root, [
        'libs/lib/package.json',
        'libs/lib/src/parts/part.fake.ts',
        'libs/lib/src/testing.ts',
      ]),
      [],
    );
    assert.equal(stagedWarnings(root, ['libs/lib/src/index.ts']).length, 1);
  });
});

test('check-changelogs . refuses a changelog.covers that is malformed or names no private package of the folder', () => {
  const cases = [
    [['@scope/lib'], []],
    [
      ['@scope/lib', '@scope/published', '@scope/typo'],
      ['names @scope/published, which is not', 'names @scope/typo, which is not'],
    ],
    ['@scope/lib', ['must be a list of package names']],
    [['@scope/lib', 3], ['must be a list of package names']],
  ];
  for (const [covers, expected] of cases) {
    withRepository(
      {
        'apps/app/package.json': manifest({
          name: '@scope/app',
          version: '1.0.0',
          changelog: { covers },
        }),
        'apps/app/CHANGELOG.md': changelog(
          '@scope/app',
          '## Unreleased',
          `## 1.0.0\n\n${ADDED('x')}`,
        ),
        'libs/lib/package.json': JSON.stringify({
          name: '@scope/lib',
          version: '0.1.0',
          private: true,
        }),
        'other/package.json': manifest({ name: '@scope/published', version: '1.0.0' }),
        'other/CHANGELOG.md': changelog(
          '@scope/published',
          '## Unreleased',
          `## 1.0.0\n\n${ADDED('x')}`,
        ),
      },
      (root) => {
        const { problems } = checkTree(root, false);
        assert.equal(problems.length, expected.length, JSON.stringify(covers));
        for (const text of expected) {
          assert.ok(
            problems.some((problem) => problem.includes(text)),
            `${text} in ${JSON.stringify(problems)}`,
          );
        }
      },
    );
  }
});

/**
 * Manifests that `--staged` never reads: a covering one in archive/, in a dot-folder and in
 * node_modules (a read of any would add a warning naming it), and a malformed one in archive/.
 */
const UNREAD = {
  'archive/old/package.json': manifest({
    name: '@scope/old',
    version: '1.0.0',
    changelog: { covers: ['@scope/lib'] },
  }),
  'archive/old/src/index.ts': 'export {};\n',
  'archive/broken/package.json': '{ "name": ',
  '.tools/package.json': manifest({
    name: '@scope/tools',
    version: '1.0.0',
    changelog: { covers: ['@scope/lib'] },
  }),
  '.tools/src/index.ts': 'export {};\n',
  'apps/app/node_modules/dep/package.json': manifest({
    name: 'dep',
    version: '1.0.0',
    changelog: { covers: ['@scope/lib'] },
  }),
};

test('--staged never reads a manifest under archive/, a dot-folder or node_modules, with or without a workspace file', () => {
  for (const workspace of [undefined, "packages:\n  - '**'\n"]) {
    withRepository(
      {
        ...COVERING,
        ...UNREAD,
        ...(workspace === undefined ? {} : { 'pnpm-workspace.yaml': workspace }),
      },
      (root) => {
        // only the covering app warns; a read of a decoy would name it as well
        const warnings = stagedWarnings(root, ['libs/lib/src/index.ts']);
        assert.equal(warnings.length, 1, String(workspace));
        assert.match(warnings[0], /^warning: apps\/app \(package\)/);
        assert.deepEqual(stagedWarnings(root, ['archive/old/src/index.ts']), []);
        assert.deepEqual(stagedWarnings(root, ['.tools/src/index.ts']), []);
      },
    );
  }
});

test('a staged file in a dot-folder of a published package is its shipped content, as the lab skeleton ships its dot-folders', () => {
  withRepository({ ...COVERING, 'apps/app/.skeleton/config.json': '{}\n' }, (root) => {
    const warnings = stagedWarnings(root, ['apps/app/.skeleton/config.json']);
    assert.equal(warnings.length, 1);
    assert.match(
      warnings[0],
      /^warning: apps\/app \(package\) has staged changes to shipped files \(\.skeleton\/config\.json\)/,
    );
  });
});

test('the packages that cover a private one are the workspace packages: a published package outside the workspace file is not one', () => {
  const outside = {
    'tools/x/package.json': manifest({
      name: '@scope/x',
      version: '1.0.0',
      changelog: { covers: ['@scope/lib'] },
    }),
    'tools/x/CHANGELOG.md': changelog('@scope/x', '## Unreleased', `## 1.0.0\n\n${ADDED('x')}`),
  };
  withRepository(
    {
      ...COVERING,
      ...outside,
      'pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n  - 'libs/*'\n",
    },
    (root) => {
      const warnings = stagedWarnings(root, ['libs/lib/src/index.ts']);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /^warning: apps\/app \(package\)/);
    },
  );
  // without a workspace file, every tracked manifest is the workspace's
  withRepository({ ...COVERING, ...outside }, (root) => {
    assert.equal(stagedWarnings(root, ['libs/lib/src/index.ts']).length, 2);
  });
});

test('the workspace file names the packages: its globs, quotes and comments are read, its exclusions and the unscanned folders are not', () => {
  assert.deepEqual(
    workspacePatterns(
      '# the workspace\npackages:\n  - \'apps/*\' # the apps\n  - libs/*\n  - "!libs/skip"\n\ncatalog:\n  x: 1\n',
    ),
    ['apps/*', 'libs/*', '!libs/skip'],
  );
  assert.deepEqual(workspacePatterns('overrides:\n  a: 1\n'), []);
  withRepository(
    {
      'apps/app/package.json': manifest({ name: '@scope/app' }),
      'libs/lib/package.json': manifest({ name: '@scope/lib' }),
      'libs/skip/package.json': manifest({ name: '@scope/skip' }),
      'archive/old/package.json': manifest({ name: '@scope/old' }),
      '.tools/package.json': manifest({ name: '@scope/tools' }),
    },
    (root) => {
      assert.deepEqual(workspaceFolders(root, ['**']), [
        '',
        'apps',
        'apps/app',
        'libs',
        'libs/lib',
        'libs/skip',
      ]);
      assert.deepEqual(workspaceFolders(root, ['libs/*', '!libs/skip']), ['libs/lib']);
    },
  );
});

test('isUnscanned names the folders the checker never reads: the root archive/, node_modules, dot-folders and the notes', () => {
  for (const [folder, expected] of [
    ['', false],
    ['products/x/libs/x/src', false],
    ['products/archive/x', false],
    ['archive', true],
    ['archive/old/src', true],
    ['.claude/skills', true],
    ['products/x/.notes/y', true],
    ['products/x/.hidden', true],
    ['planning/notes/a', true],
    ['apps/app/node_modules/dep', true],
  ]) {
    assert.equal(isUnscanned(folder), expected, folder);
  }
});

test('--release refuses a non-empty Unreleased and a top heading that is not the version', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog(
        '@scope/pkg',
        `## Unreleased\n\n${ADDED('pending')}`,
        `## 1.1.0\n\n${ADDED('x')}`,
      ),
    },
    (root) => {
      const [subject] = subjectsOf(root);
      const problems = checkRelease(subject);
      assert.equal(problems.length, 2);
      assert.match(
        problems[0],
        /top version heading is 1\.1\.0, the version in `version` of package\.json is 1\.2\.0/,
      );
      assert.match(problems[1], /"## Unreleased" is not empty/);
      const result = run(CHECK, ['--release', 'a'], root);
      assert.equal(result.status, 1);
    },
  );
});

test('--release demands a minor step in 0.x and a major step from 1.0 for a Breaking entry, since the last tag', () => {
  const breaking = '### Changed\n\n- **Breaking:** **The output moves.** Set `outDir`.';
  const cases = [
    // [previous version, version released, tag the previous version, expected problems]
    ['0.1.0', '0.1.1', true, 1],
    ['0.1.0', '0.2.0', true, 0],
    ['0.1.0', '1.0.0', true, 0],
    ['1.2.0', '1.3.0', true, 1],
    ['1.2.0', '2.0.0', true, 0],
    // no tag: the version heading below the top one is the previous release
    ['0.1.0', '0.1.1', false, 1],
    ['0.1.0', '0.2.0', false, 0],
  ];
  for (const [previous, version, tagged, expected] of cases) {
    withRepository(
      {
        'a/package.json': manifest({ version }),
        'a/CHANGELOG.md': changelog(
          '@scope/pkg',
          '## Unreleased',
          `## ${version}\n\n${breaking}`,
          `## ${previous}\n\n${ADDED('older')}`,
        ),
      },
      (root) => {
        if (tagged) {
          execFileSync(
            'git',
            ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'x'],
            { cwd: root },
          );
          execFileSync('git', ['tag', `pkg@${previous}`], { cwd: root });
        }
        const [subject] = subjectsOf(root);
        const problems = checkRelease(subject);
        assert.equal(
          problems.length,
          expected,
          `${previous} to ${version}: ${problems.join('; ')}`,
        );
        if (expected > 0) assert.match(problems[0], /has a \*\*Breaking:\*\* entry/);
      },
    );
  }
});

test('--release counts a Breaking entry of an earlier unreleased version too', () => {
  withRepository(
    {
      'a/package.json': manifest({ version: '0.2.1' }),
      'a/CHANGELOG.md': changelog(
        '@scope/pkg',
        '## Unreleased',
        `## 0.2.1\n\n${ADDED('x')}`,
        '## 0.2.0\n\n### Changed\n\n- **Breaking:** **Moved.** Yes.',
        `## 0.1.0\n\n${ADDED('older')}`,
      ),
    },
    (root) => {
      execFileSync(
        'git',
        ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'x'],
        { cwd: root },
      );
      execFileSync('git', ['tag', 'pkg@0.1.0'], { cwd: root });
      const [subject] = subjectsOf(root);
      assert.equal(checkRelease(subject).length, 0);
    },
  );
});

test('--release passes for a package and its skills, and judges the skills too', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'a/skills/my-skill/SKILL.md': skillMd('0.3.0'),
      'a/skills/my-skill/CHANGELOG.md': changelog(
        'my-skill',
        `## Unreleased\n\n${ADDED('still open')}`,
        `## 0.3.0\n\n${ADDED('x')}`,
      ),
    },
    (root) => {
      const result = run(CHECK, ['--release', 'a'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /skill my-skill: "## Unreleased" is not empty/);
      const folder = run(CHECK, ['--release', 'a/skills/my-skill'], root);
      assert.equal(folder.status, 2);
    },
  );
});

test('--release refuses a folder that is not a published package, and an unreadable package.json, without a stack trace', () => {
  withRepository(
    {
      'a/package.json': JSON.stringify({ name: 'private-one', private: true }),
      'a/CHANGELOG.md': changelog('private-one', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
      'b/package.json': '{ not json',
      'c/readme.md': 'no package here\n',
    },
    (root) => {
      const unpublished = run(CHECK, ['--release', 'a'], root);
      assert.equal(unpublished.status, 2);
      assert.match(unpublished.stderr, /^check-changelogs: a is not a published package\n$/);
      const none = run(CHECK, ['--release', 'c'], root);
      assert.equal(none.status, 2);
      assert.match(none.stderr, /c is not a published package/);
      const broken = run(CHECK, ['--release', 'b'], root);
      assert.equal(broken.status, 2);
      assert.match(broken.stderr, /^check-changelogs: b\/package\.json cannot be read: /);
      assert.doesNotMatch(broken.stderr, /\bat .*\.mjs:\d+/);
    },
  );
});

test('says so when validate-md is not on the PATH, and --no-validate does not need it', () => {
  withRepository(
    {
      'a/package.json': manifest(),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`),
    },
    (root) => {
      // a PATH that holds git (the script lists files through it) and nothing else
      const bare = mkdtempSync(join(tmpdir(), 'lab-changelogs-path-'));
      try {
        const git = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
        const gitBin = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
        symlinkSync(gitBin, join(bare, 'git'));
        const env = { ...process.env, PATH: bare, GIT_EXEC_PATH: git };
        const checked = spawnSync(process.execPath, [CHECK, '.'], {
          cwd: root,
          encoding: 'utf8',
          env,
        });
        assert.equal(checked.status, 1);
        assert.match(checked.stderr, /validate-md is not on the PATH/);
        const released = spawnSync(process.execPath, [CHECK, '--release', 'a'], {
          cwd: root,
          encoding: 'utf8',
          env,
        });
        assert.equal(released.status, 1);
        assert.match(released.stderr, /validate-md is not on the PATH/);
        const skipped = spawnSync(process.execPath, [CHECK, '.', '--no-validate'], {
          cwd: root,
          encoding: 'utf8',
          env,
        });
        assert.equal(skipped.status, 0, skipped.stderr);
      } finally {
        rmSync(bare, { recursive: true, force: true });
      }
    },
  );
});

test('checkSubject names a missing changelog of a skill beside SKILL.md', () => {
  withRepository({ 'package.json': manifest(), 's/SKILL.md': skillMd('0.1.0') }, (root) => {
    const subject = subjectsOf(root).find(({ kind }) => kind === 'skill');
    assert.match(checkSubject(subject).problems[0], /no CHANGELOG\.md beside SKILL\.md/);
  });
});

test('release-changelog moves Unreleased under the version and leaves it empty', () => {
  const text = changelog(
    'x',
    `## Unreleased\n\n${ADDED('new')}\n\n### Fixed\n\n- **A fix.** Yes.`,
    `## 0.1.0\n\n${ADDED('old')}`,
  );
  assert.equal(
    releaseText(text, '0.2.0'),
    changelog(
      'x',
      '## Unreleased',
      `## 0.2.0\n\n${ADDED('new')}\n\n### Fixed\n\n- **A fix.** Yes.`,
      `## 0.1.0\n\n${ADDED('old')}`,
    ),
  );
});

test('release-changelog refuses an empty Unreleased, an old version, a bad version and a missing file', () => {
  const empty = changelog('x', '## Unreleased', `## 0.1.0\n\n${ADDED('old')}`);
  const full = changelog('x', `## Unreleased\n\n${ADDED('new')}`, `## 0.1.0\n\n${ADDED('old')}`);
  assert.throws(() => releaseText(empty, '0.2.0'), /no entry to release/);
  assert.throws(() => releaseText(full, '0.1.0'), /not newer than 0\.1\.0/);
  assert.throws(() => releaseText(full, 'v0.2.0'), /not a version/);
  assert.throws(() => releaseText('# Changelog: x\n\n## 0.1.0\n', '0.2.0'), /no "## Unreleased"/);
  withRepository({ 'a/CHANGELOG.md': full }, (root) => {
    assert.equal(run(RELEASE, ['a', '0.2.0'], root).status, 0);
    assert.equal(existsSync(join(root, 'a', 'CHANGELOG.md')), true);
    assert.equal(
      run(RELEASE, ['a', '0.2.0'], root).status,
      1,
      'the second run finds nothing to release',
    );
    assert.equal(run(RELEASE, ['b', '0.3.0'], root).status, 1);
    assert.equal(run(RELEASE, ['a'], root).status, 2);
  });
});

const BREAKING = (text) => `### Changed\n\n- **Breaking:** **${text}.** Details.`;
const read = (root, path) => readFileSync(join(root, path), 'utf8');
/** A package at a version whose changelog holds the given Unreleased body. */
const bumpable = (version, unreleased, extra = {}) => ({
  'p/package.json': `${JSON.stringify(
    {
      name: '@scope/pkg',
      version,
      publishConfig: { registry: 'https://npm.pkg.github.com' },
      devEngines: { runtime: { name: 'node', version: '24.21.0' } },
      ...extra,
    },
    null,
    2,
  )}\n`,
  'p/CHANGELOG.md': changelog(
    '@scope/pkg',
    `## Unreleased\n\n${unreleased}`,
    `## ${version}\n\n${ADDED('old')}`,
  ),
});

test('requiredStep and raiseVersion: a Breaking entry needs a minor step in 0.x and a major step from 1.0, else a patch', () => {
  assert.deepEqual(requiredStep('0.1.1', ADDED('x')), {
    step: 'patch',
    why: 'patch: no Breaking entry',
  });
  assert.equal(requiredStep('0.1.1', BREAKING('Gone')).step, 'minor');
  assert.match(
    requiredStep('0.1.1', BREAKING('Gone')).why,
    /^minor: \*\*Breaking:\*\* \*\*Gone\.\*\*/,
  );
  assert.equal(requiredStep('1.4.2', BREAKING('Gone')).step, 'major');
  assert.equal(requiredStep('1.4.2', ADDED('x')).step, 'patch');
  assert.equal(raiseVersion('0.1.1', 'patch'), '0.1.2');
  assert.equal(raiseVersion('0.1.1', 'minor'), '0.2.0');
  assert.equal(raiseVersion('0.9.3', 'major'), '1.0.0');
  assert.throws(() => raiseVersion('1.0.0', 'huge'), /not patch/);
  assert.throws(() => raiseVersion('1.0.0; rm -rf', 'patch'), /not a version/);
});

test('--bump raises a package and moves Unreleased, changing no other line of package.json', () => {
  withRepository(bumpable('0.1.1', ADDED('new')), (root) => {
    const before = read(root, 'p/package.json');
    const result = run(RELEASE, ['--bump', 'p'], root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /@scope\/pkg 0\.1\.1 -> 0\.1\.2 \(patch: no Breaking entry\)/);
    assert.equal(
      read(root, 'p/package.json'),
      before.replace('"version": "0.1.1"', '"version": "0.1.2"'),
    );
    assert.match(read(root, 'p/CHANGELOG.md'), /## Unreleased\n\n## 0\.1\.2\n\n### Added/);
    assert.equal(JSON.parse(read(root, 'p/package.json')).devEngines.runtime.version, '24.21.0');
    // the bumped folder is ready to release
    assert.equal(run(CHECK, ['--release', '--no-validate', 'p'], root).status, 0);
  });
});

test('--bump takes the smallest step the Breaking entries allow, accepts a larger one and refuses a smaller one', () => {
  withRepository(bumpable('0.1.1', BREAKING('Gone')), (root) => {
    const refused = run(RELEASE, ['--bump', 'p', 'patch'], root);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /0\.1\.2 is too small.*Breaking.*Gone.*0\.2\.0/);
    assert.equal(run(RELEASE, ['--bump', 'p', '0.1.9'], root).status, 1);
    assert.match(read(root, 'p/package.json'), /"version": "0\.1\.1"/, 'a refusal changes nothing');
    assert.match(read(root, 'p/CHANGELOG.md'), /## Unreleased\n\n### Changed/);
    const plan = planBump(join(root, 'p'), 'major');
    assert.equal(plan.to, '1.0.0');
    assert.match(plan.why, /asked for/);
    assert.equal(run(RELEASE, ['--bump', 'p'], root).status, 0);
    assert.match(read(root, 'p/package.json'), /"version": "0\.2\.0"/);
  });
  withRepository(bumpable('1.2.0', BREAKING('Gone')), (root) => {
    assert.equal(planBump(join(root, 'p'), undefined).to, '2.0.0');
    assert.equal(run(RELEASE, ['--bump', 'p', 'minor'], root).status, 1);
    assert.equal(planBump(join(root, 'p'), '3.0.0').to, '3.0.0');
  });
  withRepository(bumpable('1.2.0', ADDED('x')), (root) => {
    assert.equal(planBump(join(root, 'p'), 'minor').to, '1.3.0');
  });
});

test('--bump --dry-run writes nothing and --json prints one object', () => {
  withRepository(bumpable('0.1.1', BREAKING('Gone')), (root) => {
    const before = [read(root, 'p/package.json'), read(root, 'p/CHANGELOG.md')];
    const result = run(RELEASE, ['--bump', 'p', '--dry-run', '--json'], root);
    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout);
    assert.deepEqual(
      {
        from: plan.from,
        to: plan.to,
        kind: plan.kind,
        name: plan.name,
        dryRun: plan.dryRun,
        written: plan.written,
      },
      {
        from: '0.1.1',
        to: '0.2.0',
        kind: 'package',
        name: '@scope/pkg',
        dryRun: true,
        written: false,
      },
    );
    assert.match(plan.why, /^minor: \*\*Breaking:\*\*/);
    assert.deepEqual([read(root, 'p/package.json'), read(root, 'p/CHANGELOG.md')], before);
    const text = run(RELEASE, ['--bump', '--dry-run', 'p'], root);
    assert.match(text.stdout, /0\.1\.1 -> 0\.2\.0 .*nothing written/);
  });
});

test('--bump refuses an empty Unreleased, a version that is not valid, and the old form needs no flag', () => {
  withRepository(bumpable('0.1.1', ADDED('x')), (root) => {
    assert.equal(run(RELEASE, ['--bump', 'p'], root).status, 0);
    const again = run(RELEASE, ['--bump', 'p'], root);
    assert.equal(again.status, 1);
    assert.match(again.stderr, /no entry to release/);
    assert.match(
      read(root, 'p/package.json'),
      /"version": "0\.1\.2"/,
      'the second run changes nothing',
    );
    assert.equal(run(RELEASE, ['--bump', 'p', '1.0.0; rm -rf'], root).status, 1);
    assert.equal(run(RELEASE, ['--bump'], root).status, 2);
    assert.equal(run(RELEASE, ['--dry-run', 'p', '0.3.0'], root).status, 2);
    assert.equal(run(RELEASE, ['--bump', 'nowhere'], root).status, 1);
  });
});

test('setPackageVersion replaces the one top-level version line, and refuses zero or several', () => {
  const text =
    '{\n  "name": "x",\n  "version": "1.0.0",\n  "devEngines": {\n    "version": "9.9.9"\n  }\n}\n';
  assert.equal(
    setPackageVersion(text, '1.1.0'),
    text.replace('"version": "1.0.0"', '"version": "1.1.0"'),
  );
  assert.equal(
    setPackageVersion('{\n\t"name": "x",\n\t"version": "1.0.0"\n}\n', '1.0.1'),
    '{\n\t"name": "x",\n\t"version": "1.0.1"\n}\n',
  );
  assert.throws(() => setPackageVersion('{\n  "name": "x"\n}\n', '1.0.1'), /no line/);
  assert.throws(
    () => setPackageVersion('{\n  "version": "1.0.0",\n  "version": "1.0.0"\n}\n', '1.0.1'),
    /2 line/,
  );
  assert.throws(
    () => setPackageVersion('{"name":"x","version":"1.0.0"}', '1.0.1'),
    /one key per line/,
  );
});

test('a skill is raised in its profile, else in metadata.version, and --bump writes the right home', () => {
  const profile = '# Profile: s\n\n## 1. Identity\n\n- Version: 0.4.1\n- Classifier: x\n';
  assert.equal(setProfileVersion(profile, '0.5.0'), profile.replace('0.4.1', '0.5.0'));
  assert.throws(() => setProfileVersion('# none\n', '0.5.0'), /no line/);
  const md = skillMd('0.3.0');
  assert.equal(setSkillVersion(md, '0.3.1'), md.replace('"0.3.0"', '"0.3.1"'));
  assert.throws(() => setSkillVersion(skillMd(undefined), '0.3.1'), /no metadata\.version/);
  assert.throws(
    () => setSkillVersion('---\nname: s\nversion: 1.0.0\n---\n', '1.0.1'),
    /no metadata\.version/,
    'a top-level version is not the skill version',
  );
  const unreleased = `## Unreleased\n\n${ADDED('new')}`;
  withRepository(
    {
      'package.json': manifest({ version: '9.0.0' }),
      'CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 9.0.0\n\n${ADDED('old')}`),
      'a/skills/my-skill/SKILL.md': skillMd('0.3.0'),
      'a/skills/my-skill/CHANGELOG.md': changelog(
        'my-skill',
        unreleased,
        `## 0.3.0\n\n${ADDED('old')}`,
      ),
      'a/skills/prof/SKILL.md': skillMd('9.9.9').replace('my-skill', 'prof'),
      'a/skills/prof/prof.architecture-profile.md': profile,
      'a/skills/prof/CHANGELOG.md': changelog('prof', unreleased, `## 0.4.1\n\n${ADDED('old')}`),
    },
    (root) => {
      const result = run(RELEASE, ['--bump', 'a/skills/my-skill'], root);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(read(root, 'a/skills/my-skill/SKILL.md'), md.replace('"0.3.0"', '"0.3.1"'));
      const bumped = run(RELEASE, ['--bump', 'a/skills/prof', 'minor'], root);
      assert.equal(bumped.status, 0, bumped.stderr);
      assert.doesNotMatch(bumped.stdout, /versions\//);
      assert.equal(
        read(root, 'a/skills/prof/prof.architecture-profile.md'),
        profile.replace('0.4.1', '0.5.0'),
      );
      assert.match(
        read(root, 'a/skills/prof/SKILL.md'),
        /version: "9\.9\.9"/,
        'SKILL.md keeps its own',
      );
      assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
    },
  );
});

// --- Release groups (root plan 0027) -----------------------------------------------------------------

/** A package of the group `g` at `dir`, with a changelog of the given sections. */
const grouped = (name, version, ...sections) => ({
  [`p/packages/${name}/package.json`]: manifest({
    name: `@scope/${name}`,
    version,
    changelog: { group: 'g' },
  }),
  [`p/packages/${name}/CHANGELOG.md`]: changelog(`@scope/${name}`, '## Unreleased', ...sections),
});
const groupChangelog = (...sections) => changelog('g', '## Unreleased', ...sections);

test('a package names its group in changelog.group, which covers does not need', () => {
  assert.equal(groupOf({ changelog: { group: 'reviewer2', covers: ['a'] } }), 'reviewer2');
  assert.equal(groupOf({}), undefined);
  assert.equal(groupOf({ changelog: { covers: [] } }), undefined);
  for (const bad of [1, 'Bad Name', '', '-x', ['a']])
    assert.equal(groupOf({ changelog: { group: bad } }), null);
  assert.equal(coversOf({ changelog: { group: 'g' } }), undefined);
  assert.deepEqual(coversOf({ changelog: { group: 'g', covers: ['a'] } }), ['a']);
  assert.equal(coversOf({ changelog: { group: 'g', covers: 'a' } }), null);
  assert.equal(coversOf({ changelog: 'x' }), null);
});

test('prefixEntry puts the package name inside the bold sentence, after a Breaking marker', () => {
  assert.equal(
    prefixEntry('- **It moves.** Detail.\n  more', 'lab'),
    '- **lab: It moves.** Detail.\n  more',
  );
  assert.equal(
    prefixEntry('- **Breaking:** **It moves.** Set `outDir`.', 'lab'),
    '- **Breaking:** **lab: It moves.** Set `outDir`.',
  );
  assert.equal(prefixEntry('- no bold here', 'lab'), '- **lab:** no bold here');
});

test('groupBody merges the categories of the packages that have the version, each entry named, and skips the others', () => {
  const a = changelog(
    '@scope/a',
    '## Unreleased',
    `## 0.3.0\n\n${ADDED('A adds')}\n\n### Fixed\n\n- **A fixes.** x.`,
    `## 0.1.0\n\n${ADDED('old')}`,
  );
  const b = changelog('@scope/b', '## Unreleased', `## 0.3.0\n\n${ADDED('B adds')}`);
  const c = changelog('@scope/c', '## Unreleased', `## 0.1.0\n\n${ADDED('C is unchanged')}`);
  const { body, from } = groupBody('0.3.0', [
    { name: '@scope/a', text: a },
    { name: '@scope/b', text: b },
    { name: '@scope/c', text: c },
  ]);
  assert.deepEqual(from, ['@scope/a', '@scope/b']);
  assert.equal(
    body,
    '### Added\n\n- **a: A adds.** Details.\n\n- **b: B adds.** Details.\n\n### Fixed\n\n- **a: A fixes.** x.',
  );
  assert.equal(groupBody('9.9.9', [{ name: '@scope/a', text: a }]).body, '');
});

test('releaseGroupText makes the file, adds a newer section above the older ones and refuses the rest', () => {
  const body = '### Added\n\n- **a: One.** x.';
  const made = releaseGroupText(undefined, 'g', '0.2.0', body);
  assert.match(made, /^# Changelog: g\n\nRelease notes of the g group/);
  assert.match(made, /## Unreleased\n\n## 0\.2\.0\n\n### Added/);
  const next = releaseGroupText(made, 'g', '0.3.0', body);
  assert.ok(next.indexOf('## 0.3.0') < next.indexOf('## 0.2.0'));
  assert.ok(next.indexOf('## Unreleased') < next.indexOf('## 0.3.0'));
  assert.throws(() => releaseGroupText(made, 'g', '0.2.0', body), /not newer/);
  assert.throws(() => releaseGroupText(made, 'g', '0.1.0', body), /not newer/);
  assert.throws(() => releaseGroupText(made, 'other', '0.3.0', body), /must be "Changelog: other"/);
  assert.throws(() => releaseGroupText(made, 'g', '0.3.0', ''), /no package of the group/);
  assert.throws(() => releaseGroupText(made, 'g', 'x', body), /not a version/);
  const edited = made.replace('## Unreleased\n', '## Unreleased\n\n### Added\n\n- **Hand.** x.\n');
  assert.throws(
    () => releaseGroupText(edited, 'g', '0.3.0', body),
    /generated and must stay empty/,
  );
});

test('release-changelog --group writes the group changelog from the packages of the group, validate-md accepts it, --dry-run writes nothing', () => {
  withRepository(
    {
      ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`, `## 0.2.0\n\n${ADDED('old')}`),
      ...grouped('b', '0.3.0', `## 0.1.0\n\n${ADDED('B is unchanged')}`),
      'p/packages/other/package.json': manifest({
        name: '@scope/other',
        changelog: { group: 'x' },
      }),
      'p/packages/other/CHANGELOG.md': changelog(
        '@scope/other',
        '## Unreleased',
        `## 1.2.0\n\n${ADDED('no')}`,
      ),
    },
    (root) => {
      const dry = run(RELEASE, ['--group', 'g', 'p', '0.3.0', '--dry-run'], root);
      assert.equal(dry.status, 0, dry.stderr);
      assert.equal(existsSync(join(root, 'p', 'CHANGELOG.md')), false);
      const real = run(RELEASE, ['--group', 'g', 'p', '0.3.0'], root);
      assert.equal(real.status, 0, real.stderr);
      const text = readFileSync(join(root, 'p', 'CHANGELOG.md'), 'utf8');
      assert.match(text, /- \*\*a: A adds\.\*\*/);
      assert.doesNotMatch(text, /B is unchanged|\bno\b/);
      const checked = run(CHECK, ['p'], root);
      assert.equal(checked.status, 0, checked.stdout + checked.stderr);
      assert.equal(run(RELEASE, ['--group', 'g', 'p', '0.3.0'], root).status, 1);
      assert.equal(run(RELEASE, ['--group', 'g', 'p'], root).status, 2);
      assert.equal(run(RELEASE, ['--group', 'Bad Name', 'p', '0.4.0'], root).status, 1);
    },
  );
});

test('planGroup orders the packages as asked and refuses a folder that is not of the group', () => {
  withRepository(
    {
      ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`),
      ...grouped('b', '0.3.0', `## 0.3.0\n\n${ADDED('B adds')}`),
    },
    (root) => {
      const dir = (name) => join(root, 'p', 'packages', name);
      const plan = planGroup({
        group: 'g',
        dir: join(root, 'p'),
        version: '0.3.0',
        order: [dir('b'), dir('a')],
      });
      assert.deepEqual(plan.from, ['@scope/b', '@scope/a']);
      assert.throws(
        () => planGroup({ group: 'g', dir: join(root, 'p'), version: '0.3.0', order: [dir('z')] }),
        /not a package of the group g/,
      );
    },
  );
});

test('check-changelogs lets a package of a group skip versions, and refuses a top heading above its version, a bad group and a group changelog out of step', () => {
  const ok = {
    ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`),
    ...grouped('b', '0.3.0', `## 0.1.0\n\n${ADDED('B is unchanged')}`),
    'p/CHANGELOG.md': groupChangelog(`## 0.3.0\n\n### Added\n\n- **a: A adds.** Details.`),
  };
  withRepository(ok, (root) => {
    const { problems } = checkTree(root, true);
    assert.deepEqual(problems, []);
    const found = groupsOf(subjectsOf(root));
    assert.equal(found.get('g').members.length, 2);
    assert.equal(found.get('g').path, join(root, 'p', 'CHANGELOG.md'));
    assert.equal(
      findGroupChangelog(join(root, 'p', 'packages', 'a'), 'g'),
      join(root, 'p', 'CHANGELOG.md'),
    );
    assert.equal(findGroupChangelog(join(root, 'p', 'packages', 'a'), 'nope'), undefined);
  });
  // no group changelog yet: not an error in the default check
  withRepository({ ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`) }, (root) => {
    assert.deepEqual(checkTree(root, true).problems, []);
  });
  // the same without the group: a top heading below the version is refused
  withRepository(
    {
      'a/package.json': manifest({ version: '0.3.0' }),
      'a/CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 0.1.0\n\n${ADDED('x')}`),
    },
    (root) => assert.match(checkTree(root, false).problems.join('\n'), /must be equal/),
  );
  withRepository({ ...grouped('a', '0.3.0', `## 0.4.0\n\n${ADDED('A adds')}`) }, (root) =>
    assert.match(checkTree(root, false).problems.join('\n'), /above the version/),
  );
  withRepository(
    {
      ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`),
      'p/packages/a/package.json': manifest({ version: '0.3.0', changelog: { group: 'Bad Name' } }),
    },
    (root) => assert.match(checkTree(root, false).problems.join('\n'), /must be a group name/),
  );
  withRepository(
    {
      ...ok,
      'p/CHANGELOG.md': groupChangelog(`## 0.2.0\n\n### Added\n\n- **a: A adds.** Details.`),
    },
    (root) => assert.match(checkTree(root, false).problems.join('\n'), /group has one version/),
  );
  withRepository(
    {
      ...ok,
      'p/CHANGELOG.md': changelog(
        'g',
        '## Unreleased\n\n### Added\n\n- **Hand.** x.',
        `## 0.3.0\n\n### Added\n\n- **a: A adds.** Details.`,
      ),
    },
    (root) => assert.match(checkTree(root, false).problems.join('\n'), /must stay empty/),
  );
});

test('--release of a package of a group needs the group changelog at the group version, and counts the group tag for a Breaking entry', () => {
  const breaking = '### Changed\n\n- **Breaking:** **The output moves.** Set `outDir`.';
  const files = (version, groupTop) => ({
    ...grouped('a', version, `## ${version}\n\n${breaking}`, `## 0.1.0\n\n${ADDED('old')}`),
    ...grouped('b', version, `## 0.1.0\n\n${ADDED('B is unchanged')}`),
    ...(groupTop === undefined
      ? {}
      : {
          'p/CHANGELOG.md': groupChangelog(
            `## ${groupTop}\n\n### Changed\n\n- **Breaking:** **a: The output moves.** Set \`outDir\`.`,
          ),
        }),
  });
  const releaseProblems = (root) =>
    subjectsOf(root)
      .filter(({ kind }) => kind === 'package')
      .flatMap((subject) => checkRelease(subject));
  // the group changelog is missing
  withRepository(files('0.2.0', undefined), (root) =>
    assert.match(releaseProblems(root).join('\n'), /changelog of the group g .* is missing/),
  );
  // the group changelog has another top version
  withRepository(files('0.2.0', '0.1.0'), (root) =>
    assert.match(releaseProblems(root).join('\n'), /does not have 0\.2\.0 as its top version/),
  );
  // ready: the unchanged package b has no section 0.2.0 and passes
  withRepository(files('0.2.0', '0.2.0'), (root) => {
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'x'], {
      cwd: root,
    });
    execFileSync('git', ['tag', 'g@0.1.0'], { cwd: root });
    assert.deepEqual(releaseProblems(root), []);
  });
  // a patch step after the group's tag with a Breaking entry is refused, for the package that has it
  withRepository(files('0.1.1', '0.1.1'), (root) => {
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'x'], {
      cwd: root,
    });
    execFileSync('git', ['tag', 'g@0.1.0'], { cwd: root });
    assert.match(releaseProblems(root).join('\n'), /has a \*\*Breaking:\*\* entry/);
  });
});

// Specs of architecture-skills plan 0002 (decisions 3 and 4): when an entry needs a `**Migration:**` line, in the
// default check and in `--release`, and the library's `hasMigration` and `entriesOf`.
const BREAKING_ENTRY =
  '### Changed\n\n- **Breaking:** **A binding names the profile only.** Details.';
const MIGRATION_LINE = '\n\n  **Migration:** In every `package.json`, delete `version`.';
/** A package that ships the skill `my-skill`, whose `## Unreleased` holds `unreleased`. */
const shippedSkill = (unreleased, packageUnreleased = '') => ({
  'p/package.json': manifest(),
  'p/CHANGELOG.md': changelog(
    '@scope/pkg',
    `## Unreleased${packageUnreleased === '' ? '' : `\n\n${packageUnreleased}`}`,
    `## 1.2.0\n\n${ADDED('A thing')}`,
  ),
  'p/skills/my-skill/SKILL.md': skillMd('0.3.0'),
  'p/skills/my-skill/CHANGELOG.md': changelog(
    'my-skill',
    `## Unreleased\n\n${unreleased}`,
    `## 0.3.0\n\n${ADDED('The skill')}`,
  ),
});

test(
  'check-changelogs . refuses a skill’s unreleased **Breaking:** entry without a **Migration:** line',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'skill-breaking-without-migration-refused',
      arrange:
        'a repository with a skill whose ## Unreleased holds a **Breaking:** entry with no **Migration:** line',
      act: 'check-changelogs . runs',
      assert: 'it exits 1 and names the skill’s changelog and the entry',
    },
  },
  () => {
    withRepository(shippedSkill(BREAKING_ENTRY), (root) => {
      const result = run(CHECK, ['.'], root);
      assert.equal(result.status, 1, result.stdout);
      assert.match(
        result.stderr,
        /p\/skills\/my-skill: skill my-skill: a \*\*Breaking:\*\* entry under "## Unreleased" has no \*\*Migration:\*\* line \("- \*\*Breaking:\*\* \*\*A binding names the profile only\.\*\*/,
      );
    });
  },
);

test(
  'check-changelogs . accepts a skill’s unreleased **Breaking:** entry with a **Migration:** line',
  {
    tags: ['scenario'],
    meta: {
      spec: 'skill-breaking-with-migration-accepted',
      arrange:
        'a repository with a skill whose ## Unreleased holds a **Breaking:** entry with a **Migration:** line',
      act: 'check-changelogs . runs',
      assert: 'it exits 0',
    },
  },
  () => {
    withRepository(shippedSkill(`${BREAKING_ENTRY}${MIGRATION_LINE}`), (root) => {
      const result = run(CHECK, ['.'], root);
      assert.equal(result.status, 0, result.stderr);
    });
  },
);

test(
  'check-changelogs . accepts a package’s **Breaking:** entry without a **Migration:** line',
  {
    tags: ['scenario'],
    meta: {
      spec: 'package-breaking-without-migration-accepted',
      arrange:
        'a repository with a package whose ## Unreleased holds a **Breaking:** entry with no **Migration:** line',
      act: 'check-changelogs . runs',
      assert: 'it exits 0',
    },
  },
  () => {
    withRepository(shippedSkill(ADDED('New'), BREAKING_ENTRY), (root) => {
      const result = run(CHECK, ['.'], root);
      assert.equal(result.status, 0, result.stderr);
    });
  },
);

test(
  'check-changelogs . accepts a **Migration:** line on a non-breaking entry',
  {
    tags: ['scenario'],
    meta: {
      spec: 'migration-on-non-breaking-entry-accepted',
      arrange: 'a skill whose ## Unreleased holds a non-breaking entry with a **Migration:** line',
      act: 'check-changelogs . runs',
      assert: 'it exits 0',
    },
  },
  () => {
    withRepository(
      shippedSkill(`### Changed\n\n- **The layout moved.** Details.${MIGRATION_LINE}`),
      (root) => {
        const result = run(CHECK, ['.'], root);
        assert.equal(result.status, 0, result.stderr);
      },
    );
  },
);

/** A package at 1.3.0 tagged at 1.2.0, shipping `my-skill` whose released section `0.4.0` is `released`. */
const releasedSkill = (released, earlier = ADDED('The skill')) => ({
  'p/package.json': manifest({ version: '1.3.0' }),
  'p/CHANGELOG.md': changelog(
    '@scope/pkg',
    '## Unreleased',
    `## 1.3.0\n\n${ADDED('More')}`,
    `## 1.2.0\n\n${ADDED('A thing')}`,
  ),
  'p/skills/my-skill/SKILL.md': skillMd('0.4.0'),
  'p/skills/my-skill/CHANGELOG.md': changelog(
    'my-skill',
    '## Unreleased',
    `## 0.4.0\n\n${released}`,
    `## 0.3.0\n\n${earlier}`,
  ),
});

/**
 * Commits the repository with the skill's changelog as it was at the last release (`atRelease`),
 * tags that commit `tag`, then stages the current changelog again.
 */
const tagRelease = (root, tag, atRelease) => {
  const path = 'p/skills/my-skill/CHANGELOG.md';
  const current = read(root, path);
  stage(root, path, atRelease);
  commitAll(root);
  execFileSync('git', ['tag', tag], { cwd: root });
  stage(root, path, current);
};
/** The skill's changelog at the release tagged before `releasedSkill`'s 0.4.0: it tops at 0.3.0. */
const atRelease030 = (earlier = ADDED('The skill')) =>
  changelog('my-skill', '## Unreleased', `## 0.3.0\n\n${earlier}`);

test(
  '--release refuses a skill’s **Breaking:** entry without a **Migration:** line in the released section',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'release-skill-breaking-without-migration-refused',
      arrange:
        'a repository whose skill has a raised version not yet tagged, its section holding a **Breaking:** entry with no **Migration:** line',
      act: 'check-changelogs --release runs for the group',
      assert: 'it reports the entry of the released section beside the **Breaking:** step check',
    },
  },
  () => {
    withRepository(releasedSkill(BREAKING_ENTRY), (root) => {
      // the tag holds the skill at 0.3.0, so 0.4.0 is what this release ships
      tagRelease(root, 'pkg@1.2.0', atRelease030());
      const result = run(CHECK, ['--release', '--no-validate', 'p'], root);
      assert.equal(result.status, 1, result.stderr);
      assert.match(
        result.stderr,
        /skill my-skill: a \*\*Breaking:\*\* entry under "## 0\.4\.0" has no \*\*Migration:\*\* line/,
      );
      // the default check sees the same section as not released yet
      const tree = run(CHECK, ['--no-validate', '.'], root);
      assert.equal(tree.status, 1);
      assert.match(tree.stderr, /under "## 0\.4\.0" has no \*\*Migration:\*\* line/);
      // with the line, both pass
      stage(
        root,
        'p/skills/my-skill/CHANGELOG.md',
        read(root, 'p/skills/my-skill/CHANGELOG.md').replace(
          'Details.',
          `Details.${MIGRATION_LINE}`,
        ),
      );
      assert.equal(run(CHECK, ['--release', '--no-validate', 'p'], root).status, 0);
      assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
    });
  },
);

test(
  '--release leaves the **Breaking:** entries of earlier releases alone',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'release-earlier-sections-not-judged',
      arrange:
        'a skill whose tagged earlier release holds a **Breaking:** entry with no **Migration:** line, and whose released section is clean',
      act: 'check-changelogs --release runs for the group',
      assert: 'it reports nothing about the earlier section',
    },
  },
  () => {
    withRepository(releasedSkill(ADDED('New'), BREAKING_ENTRY), (root) => {
      tagRelease(root, 'pkg@1.2.0', atRelease030(BREAKING_ENTRY));
      const result = run(CHECK, ['--release', '--no-validate', 'p'], root);
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stderr, /Migration/);
      // nor does the default check, which judges only what the tag did not hold
      assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
    });
  },
);

// Specs of the fix after architecture-skills plan 0002: a released section is never judged, whatever the tags are
// named; a package of a release group is released under the group's tag (`<group>@<version>`), and a skill has no
// tag of its own.
test(
  'a skill section released under the group tag of the package that ships it is not judged, one above it is',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'group-tag-releases-skill-sections',
      arrange:
        'a package of the group g, tagged only g@1.2.0 at a commit where its skill tops at 0.3.0 with a **Breaking:** entry and no **Migration:** line; the skill now adds 0.4.0',
      act: 'check-changelogs . and --release run',
      assert:
        'neither names 0.3.0; both name 0.4.0 while its **Breaking:** entry has no **Migration:** line',
    },
  },
  () => {
    const files = releasedSkill(BREAKING_ENTRY, BREAKING_ENTRY);
    files['p/package.json'] = manifest({ version: '1.3.0', changelog: { group: 'g' } });
    withRepository(files, (root) => {
      tagRelease(root, 'g@1.2.0', atRelease030(BREAKING_ENTRY));
      for (const args of [
        ['--no-validate', '.'],
        ['--release', '--no-validate', 'p'],
      ]) {
        const result = run(CHECK, args, root);
        assert.equal(result.status, 1, `${args}: ${result.stderr}`);
        assert.match(result.stderr, /under "## 0\.4\.0" has no \*\*Migration:\*\* line/);
        assert.doesNotMatch(result.stderr, /"## 0\.3\.0"/);
      }
      // once 0.4.0 is released too, nothing is judged
      commitAll(root);
      execFileSync('git', ['tag', 'g@1.3.0'], { cwd: root });
      assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
    });
  },
);

test(
  'without a release tag only ## Unreleased is judged, never the version sections',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'no-tag-judges-unreleased-only',
      arrange:
        'a repository with no tag whose skill has a **Breaking:** entry without **Migration:** under 0.4.0 and 0.3.0',
      act: 'check-changelogs . and --release run, then the same entry is added under ## Unreleased',
      assert:
        'both pass while the entries are under version headings; the default check refuses the one under ## Unreleased',
    },
  },
  () => {
    withRepository(releasedSkill(BREAKING_ENTRY, BREAKING_ENTRY), (root) => {
      commitAll(root);
      assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
      assert.equal(run(CHECK, ['--release', '--no-validate', 'p'], root).status, 0);
      stage(
        root,
        'p/skills/my-skill/CHANGELOG.md',
        read(root, 'p/skills/my-skill/CHANGELOG.md').replace(
          '## Unreleased',
          `## Unreleased\n\n${BREAKING_ENTRY}`,
        ),
      );
      const result = run(CHECK, ['--no-validate', '.'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /under "## Unreleased" has no \*\*Migration:\*\* line/);
      assert.doesNotMatch(result.stderr, /"## 0\.[34]\.0"/);
    });
  },
);

test(
  'entriesOf splits a body into its entries and hasMigration finds the marker only on an indented line of its own',
  {
    tags: ['invariant'],
    meta: { spec: 'has-migration-and-entries-of' },
  },
  () => {
    const body = [
      '### Changed',
      '',
      '- **Breaking:** **One.** Detail',
      '  wrapped.',
      '',
      '  **Migration:** Do this.',
      '* **Two.** It says **Migration:** inline.',
      '  Then mentions it: **Migration:** mid-line.',
      '',
      '### Fixed',
      '',
      '- **Three.** Done.',
      '  **Migration:**',
    ].join('\n');
    const entries = entriesOf(body);
    assert.deepEqual(entries, [
      '- **Breaking:** **One.** Detail\n  wrapped.\n\n  **Migration:** Do this.',
      '* **Two.** It says **Migration:** inline.\n  Then mentions it: **Migration:** mid-line.',
      '- **Three.** Done.\n  **Migration:**',
    ]);
    assert.deepEqual(entries.map(hasMigration), [true, false, false]);
    assert.deepEqual(entriesOf(''), []);
    assert.equal(hasMigration('- **Breaking:** **x.** y\n**Migration:** unindented'), false);
  },
);

// Spec of architecture-skills plan 0002 (decision 2): no kept copies, so no reminder to keep one.
test(
  'release-changelog --bump of a skill with a profile prints no reminder about versions/',
  {
    tags: ['scenario'],
    meta: {
      spec: 'bump-prints-no-versions-reminder',
      arrange: 'a skill with an architecture profile and an entry under ## Unreleased',
      act: 'release-changelog --bump runs for the skill',
      assert: 'its output names the new version and says nothing about versions/ or a kept copy',
    },
  },
  () => {
    const profile = '# Profile: prof\n\n## 1. Identity\n\n- Version: 0.4.1\n- Classifier: x\n';
    withRepository(
      {
        'package.json': manifest({ version: '9.0.0' }),
        'CHANGELOG.md': changelog('@scope/pkg', '## Unreleased', `## 9.0.0\n\n${ADDED('old')}`),
        'a/skills/prof/SKILL.md': skillMd('9.9.9').replace('my-skill', 'prof'),
        'a/skills/prof/prof.architecture-profile.md': profile,
        'a/skills/prof/CHANGELOG.md': changelog(
          'prof',
          `## Unreleased\n\n${ADDED('new')}`,
          `## 0.4.1\n\n${ADDED('old')}`,
        ),
      },
      (root) => {
        const result = run(RELEASE, ['--bump', 'a/skills/prof'], root);
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /skill prof 0\.4\.1 -> 0\.4\.2/);
        assert.doesNotMatch(result.stdout, /versions\/|kept|copy/);
      },
    );
  },
);

// Spec of the review of architecture-skills plan 0002: a `**Migration:**` marker inside a fenced code block is an
// example, not the entry's note, as the lab's parser reads it.
test(
  'hasMigration ignores a **Migration:** marker inside a fenced code block, and entriesOf keeps the block in its entry',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'fenced-migration-marker-ignored',
      arrange:
        'a body whose breaking entry carries an indented fenced example opening with **Migration:** and no note of its own, then a second entry with a real note',
      act: 'entriesOf splits the body and hasMigration reads each entry',
      assert:
        'the fenced example stays in the first entry, which has no note; the second has one; check-changelogs . refuses the first',
    },
  },
  () => {
    const body = [
      '### Changed',
      '',
      '- **Breaking:** **Example only.** Write it like this:',
      '',
      '  ```markdown',
      '  **Migration:** In every package, do this.',
      '- **Not an entry.** Inside the fence.',
      '  ```',
      '',
      '- **Breaking:** **A real one.** Detail.',
      '',
      '  **Migration:** Do this.',
    ].join('\n');
    const entries = entriesOf(body);
    assert.equal(entries.length, 2);
    assert.match(entries[0], /Not an entry\.[\s\S]*```$/);
    assert.deepEqual(entries.map(hasMigration), [false, true]);
    withRepository(shippedSkill(body), (root) => {
      const result = run(CHECK, ['--no-validate', '.'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Example only\./);
      assert.doesNotMatch(result.stderr, /A real one\./);
    });
  },
);

// --- CHANGELOG.public.md: the public twin of a changelog -----------------------------------------

const PUB = 'CHANGELOG.public.md';
const NONE = NO_PUBLIC_CHANGES;
/** A published package `a` with a changelog and, optionally, a public twin. */
const withTwin = (internal, publicText) => ({
  'a/package.json': manifest(),
  'a/CHANGELOG.md': internal,
  ...(publicText === undefined ? {} : { [`a/${PUB}`]: publicText }),
});
const PAIR_INTERNAL = changelog(
  '@scope/pkg',
  `## Unreleased\n\n${ADDED('Internal (plan 0046)')}`,
  `## 1.2.0\n\n${ADDED('Old')}`,
);
const PAIR_PUBLIC = changelog(
  '@scope/pkg',
  `## Unreleased\n\n${ADDED('Public')}`,
  `## 1.2.0\n\n${NONE}`,
);

test('a public twin with the same title and versions passes, validated with the same template', () => {
  withRepository(withTwin(PAIR_INTERNAL, PAIR_PUBLIC), (root) => {
    const result = run(CHECK, ['.'], root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test('validate-md rejects a malformed public twin, and the nothing-public line only passes under a version', () => {
  const bad = changelog('@scope/pkg', `## Unreleased\n\n${NONE}`, `## 1.2.0\n\n${NONE}`);
  withRepository(withTwin(PAIR_INTERNAL, bad), (root) => {
    const result = run(CHECK, ['.'], root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /validate-md rejected/);
    assert.match(result.stderr, /CHANGELOG\.public\.md/);
  });
});

test('a public twin that lacks a version, has an extra one or lists them out of order is named', () => {
  const internal = changelog(
    '@scope/pkg',
    '## Unreleased',
    `## 1.2.0\n\n${ADDED('b')}`,
    `## 1.1.0\n\n${ADDED('a')}`,
  );
  const missing = twinProblems(
    'package @scope/pkg',
    internal,
    changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${NONE}`),
  );
  assert.equal(missing.length, 1);
  assert.match(missing[0], /lacks the version 1\.1\.0/);
  const extra = twinProblems(
    'package @scope/pkg',
    internal,
    changelog(
      '@scope/pkg',
      '## Unreleased',
      `## 1.3.0\n\n${NONE}`,
      `## 1.2.0\n\n${NONE}`,
      `## 1.1.0\n\n${NONE}`,
    ),
  );
  assert.equal(extra.length, 1);
  assert.match(extra[0], /has the version 1\.3\.0 that CHANGELOG\.md does not have/);
  const reordered = twinProblems(
    'package @scope/pkg',
    internal,
    changelog('@scope/pkg', '## Unreleased', `## 1.1.0\n\n${NONE}`, `## 1.2.0\n\n${NONE}`),
  );
  assert.equal(reordered.length, 1);
  assert.match(reordered[0], /out of order \(1\.1\.0, 1\.2\.0\)/);
  withRepository(
    withTwin(internal, changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${NONE}`)),
    (root) => {
      const result = run(CHECK, ['--no-validate', '.'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /CHANGELOG\.public\.md lacks the version 1\.1\.0/);
    },
  );
});

test('a public twin with another title, or Unreleased after a version, is refused', () => {
  const problems = twinProblems(
    'package @scope/pkg',
    PAIR_INTERNAL,
    changelog('@scope/other', `## 1.2.0\n\n${NONE}`, '## Unreleased'),
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0], /title of CHANGELOG\.public\.md is "Changelog: @scope\/other"/);
  assert.match(problems[1], /"## Unreleased" must come before every version heading/);
});

test('--public reports a changelog with no public twin; without it none is asked for', () => {
  const files = {
    ...withTwin(PAIR_INTERNAL),
    'a/skills/my-skill/SKILL.md': skillMd('0.3.0'),
    'a/skills/my-skill/CHANGELOG.md': changelog(
      'my-skill',
      '## Unreleased',
      `## 0.3.0\n\n${ADDED('x')}`,
    ),
  };
  withRepository(files, (root) => {
    assert.equal(run(CHECK, ['--no-validate', '.'], root).status, 0);
    const result = run(CHECK, ['--no-validate', '--public', '.'], root);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /package @scope\/pkg: no CHANGELOG\.public\.md beside CHANGELOG\.md/,
    );
    assert.match(result.stderr, /skill my-skill: no CHANGELOG\.public\.md/);
    assert.match(result.stderr, /2 problem/);
  });
});

test('--public=<list> restricts which folders must have a twin, by path or glob, and a pattern covers the folders below', () => {
  const skill = (folder) => ({
    [`a/skills/${folder}/SKILL.md`]: skillMd('0.3.0').replace('my-skill', folder),
    [`a/skills/${folder}/CHANGELOG.md`]: changelog(
      folder,
      '## Unreleased',
      `## 0.3.0\n\n${ADDED('x')}`,
    ),
  });
  const files = { ...withTwin(PAIR_INTERNAL, PAIR_PUBLIC), ...skill('one'), ...skill('two') };
  withRepository(files, (root) => {
    const only = run(
      CHECK,
      ['--no-validate', '--public=a/skills/one', 'a'.replace('a', '.')],
      root,
    );
    assert.equal(only.status, 1);
    assert.match(only.stderr, /skill one: no CHANGELOG\.public\.md/);
    assert.doesNotMatch(only.stderr, /skill two/);
    const glob = run(CHECK, ['--no-validate', '--public=a/skills/*', '.'], root);
    assert.match(glob.stderr, /skill one/);
    assert.match(glob.stderr, /skill two/);
    // the package already has its twin; naming it covers the skills below it too
    const below = run(CHECK, ['--no-validate', '--public=a', '.'], root);
    assert.match(below.stderr, /2 problem/);
    // a restriction that names no folder with a changelog asks for nothing
    assert.equal(run(CHECK, ['--no-validate', '--public=elsewhere', '.'], root).status, 0);
    // repeated flags add up
    const both = run(
      CHECK,
      ['--no-validate', '--public=a/skills/one', '--public=a/skills/two', '.'],
      root,
    );
    assert.match(both.stderr, /2 problem/);
  });
  const test = publicFolderTest(['x/**/y', 'p/*']);
  assert.equal(test('x/a/b/y'), true);
  assert.equal(test('x/y'), true);
  assert.equal(test('p/a'), true);
  assert.equal(test('p/a/b'), true);
  assert.equal(test('q/p/a'), false);
  assert.equal(publicFolderTest([])('anything'), true);
});

test('--release --public checks both files: the public Unreleased must be empty and the twin must exist', () => {
  const internal = changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${ADDED('x')}`);
  withRepository(
    withTwin(
      internal,
      changelog('@scope/pkg', `## Unreleased\n\n${ADDED('p')}`, `## 1.2.0\n\n${NONE}`),
    ),
    (root) => {
      const result = run(CHECK, ['--no-validate', '--release', '--public', 'a'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /"## Unreleased" of CHANGELOG\.public\.md is not empty/);
    },
  );
  withRepository(withTwin(internal), (root) => {
    assert.equal(run(CHECK, ['--no-validate', '--release', 'a'], root).status, 0);
    const result = run(CHECK, ['--no-validate', '--release', '--public', 'a'], root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no CHANGELOG\.public\.md beside CHANGELOG\.md/);
  });
  withRepository(
    withTwin(internal, changelog('@scope/pkg', '## Unreleased', `## 1.2.0\n\n${NONE}`)),
    (root) => {
      const result = run(CHECK, ['--release', '--public', 'a'], root);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    },
  );
});

test('a group changelog is paired with its public twin, and --public asks for it', () => {
  const files = {
    ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('A adds')}`),
    'p/CHANGELOG.md': groupChangelog(`## 0.3.0\n\n${ADDED('a: A adds')}`),
    'p/packages/a/CHANGELOG.public.md': changelog(
      '@scope/a',
      '## Unreleased',
      `## 0.3.0\n\n${NONE}`,
    ),
  };
  withRepository(files, (root) => {
    const result = run(CHECK, ['--public', 'p'], root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /group g: no CHANGELOG\.public\.md/);
    assert.doesNotMatch(result.stderr, /package @scope\/a: no/);
  });
  withRepository(
    { ...files, 'p/CHANGELOG.public.md': changelog('g', '## Unreleased', `## 0.2.0\n\n${NONE}`) },
    (root) => {
      const result = run(CHECK, ['--no-validate', 'p'], root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /group g.*lacks the version 0\.3\.0/);
    },
  );
});

test('release-changelog moves the entries of both files; an empty public Unreleased gets the nothing-public line', () => {
  const internal = changelog(
    'x',
    `## Unreleased\n\n${ADDED('new')}`,
    `## 0.1.0\n\n${ADDED('old')}`,
  );
  const empty = changelog('x', '## Unreleased', `## 0.1.0\n\n${NONE}`);
  assert.equal(
    releasePublicText(empty, '0.2.0'),
    changelog('x', '## Unreleased', `## 0.2.0\n\n${NONE}`, `## 0.1.0\n\n${NONE}`),
  );
  assert.equal(
    releasePublicText(changelog('x', `## Unreleased\n\n${ADDED('p')}`), '0.2.0'),
    changelog('x', '## Unreleased', `## 0.2.0\n\n${ADDED('p')}`),
  );
  assert.throws(() => releasePublicText(empty, '0.1.0'), /not newer/);
  assert.throws(() => releaseText(empty, '0.2.0'), /no entry to release/);
  withRepository(
    {
      'x/package.json': manifest({ name: 'x', version: '0.1.0' }),
      'x/CHANGELOG.md': internal,
      [`x/${PUB}`]: empty,
    },
    (root) => {
      const result = run(RELEASE, ['x', '0.2.0'], root);
      assert.equal(result.status, 0, result.stderr);
      const publicText = readFileSync(join(root, 'x', PUB), 'utf8');
      assert.match(
        publicText,
        /## Unreleased\n\n## 0\.2\.0\n\nNo changes for users of the package\.\n\n## 0\.1\.0/,
      );
      assert.match(
        readFileSync(join(root, 'x', 'CHANGELOG.md'), 'utf8'),
        /## 0\.2\.0\n\n### Added/,
      );
      assert.equal(
        twinProblems('x', readFileSync(join(root, 'x', 'CHANGELOG.md'), 'utf8'), publicText).length,
        0,
      );
    },
  );
});

test('release-changelog --bump moves both files, writes both or neither', () => {
  const internal = changelog(
    'x',
    `## Unreleased\n\n${ADDED('new')}`,
    `## 0.1.0\n\n${ADDED('old')}`,
  );
  const files = (publicText) => ({
    'x/package.json': `${JSON.stringify(JSON.parse(manifest({ name: 'x', version: '0.1.0' })), null, 2)}\n`,
    'x/CHANGELOG.md': internal,
    [`x/${PUB}`]: publicText,
  });
  withRepository(
    files(changelog('x', `## Unreleased\n\n${ADDED('p')}`, `## 0.1.0\n\n${NONE}`)),
    (root) => {
      const plan = planBump(join(root, 'x'));
      assert.deepEqual(
        plan.edits.map(({ path }) => path.slice(root.length + 1)),
        ['x/package.json', 'x/CHANGELOG.md', `x/${PUB}`],
      );
      assert.equal(run(RELEASE, ['--bump', 'x'], root).status, 0);
      assert.match(
        readFileSync(join(root, 'x', PUB), 'utf8'),
        /## 0\.1\.1\n\n### Added\n\n- \*\*p\.\*\*/,
      );
    },
  );
  // a public twin that cannot take the version stops the release before anything is written
  withRepository(files(changelog('x', '## Unreleased', '## 0.1.1\n\n' + NONE)), (root) => {
    const result = run(RELEASE, ['--bump', 'x'], root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CHANGELOG\.public\.md: 0\.1\.1 is not newer/);
    assert.match(
      readFileSync(join(root, 'x', 'CHANGELOG.md'), 'utf8'),
      /## Unreleased\n\n### Added/,
    );
    assert.match(readFileSync(join(root, 'x', 'package.json'), 'utf8'), /"version": "0\.1\.0"/);
  });
});

test("release-changelog --group writes the public twin from the packages' public changelogs only", () => {
  const publicOf = (name, ...sections) => changelog(`@scope/${name}`, '## Unreleased', ...sections);
  withRepository(
    {
      ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('Internal A (plan 0046)')}`),
      ...grouped('b', '0.3.0', `## 0.3.0\n\n${ADDED('Internal B (plan 0046)')}`),
      'p/packages/a/CHANGELOG.public.md': publicOf('a', `## 0.3.0\n\n${ADDED('Public A')}`),
      'p/packages/b/CHANGELOG.public.md': publicOf('b', `## 0.3.0\n\n${NONE}`),
      'p/CHANGELOG.public.md': changelog('g', '## Unreleased'),
    },
    (root) => {
      const plan = planGroup({ group: 'g', dir: join(root, 'p'), version: '0.3.0', public: true });
      assert.equal(plan.path, join(root, 'p', PUB));
      assert.match(plan.text, /\*\*a: Public A\.\*\*/);
      assert.doesNotMatch(plan.text, /Internal|plan 0046/);
      const real = run(RELEASE, ['--group', 'g', 'p', '0.3.0'], root);
      assert.equal(real.status, 0, real.stderr);
      const internalText = readFileSync(join(root, 'p', 'CHANGELOG.md'), 'utf8');
      assert.match(internalText, /Internal A/);
      assert.doesNotMatch(readFileSync(join(root, 'p', PUB), 'utf8'), /Internal/);
      assert.equal(
        twinProblems('g', internalText, readFileSync(join(root, 'p', PUB), 'utf8')).length,
        0,
      );
    },
  );
  // every package has nothing public: the section is the nothing-public line
  withRepository(
    {
      ...grouped('a', '0.3.0', `## 0.3.0\n\n${ADDED('Internal A')}`),
      'p/packages/a/CHANGELOG.public.md': publicOf('a', `## 0.3.0\n\n${NONE}`),
    },
    (root) => {
      const plan = planGroup({ group: 'g', dir: join(root, 'p'), version: '0.3.0', public: true });
      assert.match(plan.text, /## 0\.3\.0\n\nNo changes for users of the package\.\n$/);
    },
  );
});

test('--staged names a staged CHANGELOG.md change whose CHANGELOG.public.md did not change', () => {
  const internal = (entry) =>
    changelog('@scope/pkg', `## Unreleased\n\n${ADDED(entry)}`, `## 1.2.0\n\n${ADDED('Old')}`);
  withRepository(withTwin(internal('first'), PAIR_PUBLIC), (root) => {
    commitAll(root);
    stage(root, 'a/CHANGELOG.md', internal('second'));
    const warnings = stagedWarnings(root, ['a/CHANGELOG.md']);
    assert.equal(warnings.length, 1);
    assert.match(
      warnings[0],
      /a\/CHANGELOG\.md is staged and a\/CHANGELOG\.public\.md beside it is not/,
    );
    // staging the public file too silences it
    stage(root, `a/${PUB}`, `${PAIR_PUBLIC}\n`);
    assert.deepEqual(stagedWarnings(root, ['a/CHANGELOG.md', `a/${PUB}`]), []);
    // a staged public file is not a shipped change
    assert.deepEqual(stagedWarnings(root, [`a/${PUB}`]), []);
  });
  // a package without a public twin gets no such warning
  withRepository(withTwin(internal('first')), (root) => {
    commitAll(root);
    stage(root, 'a/CHANGELOG.md', internal('second'));
    assert.deepEqual(stagedWarnings(root, ['a/CHANGELOG.md']), []);
  });
});
