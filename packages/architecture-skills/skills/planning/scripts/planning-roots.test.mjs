// Specs of planning-root discovery and of move-plan leaving the person's notes (`.notes/`,
// `planning/notes/`) alone:
// node --test skills/planning/scripts/
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  findPlanningRoots,
  isInNotesFolder,
  resolveOneRoot,
  resolveRoots,
} from './planning-lib.mjs';

const scripts = dirname(fileURLToPath(import.meta.url));
const PLAN = '# A plan\n\nImplement this plan by the rules of the `planning` skill.\n';

/** Makes a Git repository with files (path to text) and returns its folder. */
const repository = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'planning-roots-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  execFileSync('git', ['add', '-A'], { cwd: root });
  return root;
};

const labFiles = {
  'products/a/planning/plans/0001/plan.md': PLAN,
  'products/b/planning/draft-plans/idea/plan.md': PLAN,
  'products/a/planning/notes/archive/0009/plan.md': PLAN,
  'planning/plans/.gitkeep': '',
  'node_modules/x/planning/plans/0001/plan.md': PLAN,
  '.hidden/planning/plans/0001/plan.md': PLAN,
  '.notes/old/planning/plans/0001/plan.md': PLAN,
  'products/a/.notes/plans/0001/plan.md': PLAN,
};

test('findPlanningRoots finds each root, skips node_modules and dot-folders and never enters a root', () => {
  // arrange
  const root = repository(labFiles);
  try {
    // act
    const found = findPlanningRoots(root).map((path) => path.slice(root.length + 1));
    // assert
    assert.deepEqual(found, ['planning', 'products/a/planning', 'products/b/planning']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('resolveRoots answers a root as itself and another folder as the roots under it', () => {
  const root = repository(labFiles);
  try {
    assert.deepEqual(resolveRoots(join(root, 'planning')), [join(root, 'planning')]);
    assert.equal(resolveRoots(root).length, 3);
    assert.deepEqual(resolveRoots(join(root, 'products/b')), [join(root, 'products/b/planning')]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('resolveOneRoot refuses several matching roots, naming them', () => {
  const root = repository({
    'x/planning/draft-plans/same/plan.md': PLAN,
    'y/planning/draft-plans/same/plan.md': PLAN,
  });
  try {
    const has = (each) => each.endsWith('planning');
    assert.throws(
      () => resolveOneRoot(root, has, 'draft same'),
      /several planning roots.*x\/planning.*y\/planning/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('check-planning checks each root under a folder, one table each, and fails when any fails', () => {
  const root = repository({
    'a/planning/plans/0001/plan.md': PLAN,
    'b/planning/plans/0001/implementation-notes.md': '# Notes\n',
  });
  try {
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'check-planning.mjs'), root, '--no-validate'],
      {
        encoding: 'utf8',
      },
    );
    assert.equal(run.status, 1);
    assert.equal(run.stdout.match(/Implemented\?/g)?.length, 2);
    assert.match(run.stdout, /check-planning: 2 plans|check-planning: 1 plans/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('roadmap refuses --title with several roots and promote-plan finds the one root with the draft', () => {
  const root = repository({
    'a/planning/draft-plans/idea/plan.md': PLAN,
    'b/planning/plans/0001/plan.md': PLAN,
  });
  try {
    const titled = spawnSync(
      process.execPath,
      [join(scripts, 'roadmap.mjs'), root, '--title', 'x'],
      { encoding: 'utf8' },
    );
    assert.equal(titled.status, 1);
    assert.match(titled.stderr, /--title is refused/);
    const promoted = spawnSync(
      process.execPath,
      [join(scripts, 'promote-plan.mjs'), root, 'idea'],
      {
        encoding: 'utf8',
        cwd: root,
      },
    );
    assert.equal(promoted.status, 0, promoted.stderr);
    assert.equal(promoted.stdout.trim(), '0001');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('roadmap prints to standard output, writes only with --write and has no --check', () => {
  // arrange
  const root = repository({ 'p/planning/plans/0001/plan.md': PLAN });
  const planning = join(root, 'p/planning');
  const run = (...args) =>
    spawnSync(process.execPath, [join(scripts, 'roadmap.mjs'), ...args], { encoding: 'utf8' });
  try {
    // act
    const printed = run(planning);
    const target = join(root, 'out', 'roadmap.md');
    const written = run(planning, '--write', target);
    const checked = run(planning, '--check');
    // assert
    assert.equal(printed.status, 0, printed.stderr);
    assert.match(printed.stdout, /^# p roadmap\n/);
    assert.match(printed.stdout, /\[0001\]\(plans\/0001\/plan\.md\)/);
    assert.equal(existsSync(join(planning, 'roadmap.md')), false);
    assert.equal(written.status, 0, written.stderr);
    assert.match(readFileSync(target, 'utf8'), /\]\(\.\.\/p\/planning\/plans\/0001\/plan\.md\)/);
    assert.equal(checked.status, 2);
    assert.match(checked.stderr, /--check is gone/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('move-plan rewrites links outside planning/notes and leaves the notes files as they are', () => {
  const root = repository({
    'planning/plans/0001/plan.md': PLAN,
    'docs/guide.md': '[plan](../planning/plans/0001/plan.md)\n',
    'planning/notes/idea.md': '[plan](../plans/0001/plan.md)\n',
  });
  try {
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'move-plan.mjs'), 'planning/plans/0001', 'planning/plans/0002'],
      { encoding: 'utf8', cwd: root },
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      readFileSync(join(root, 'docs/guide.md'), 'utf8'),
      '[plan](../planning/plans/0002/plan.md)\n',
    );
    assert.equal(
      readFileSync(join(root, 'planning/notes/idea.md'), 'utf8'),
      '[plan](../plans/0001/plan.md)\n',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('move-plan never reads or rewrites a file of a .notes/ folder, at the root or in a product', () => {
  const root = repository({
    'products/a/planning/plans/0001/plan.md': PLAN,
    'products/a/README.md': '[plan](planning/plans/0001/plan.md)\n',
    '.notes/idea.md': '[plan](../products/a/planning/plans/0001/plan.md)\n',
    'products/a/.notes/idea.md':
      '[plan](../planning/plans/0001/plan.md), [root](/products/a/planning/plans/0001/plan.md)\n',
    'products/a/.notes/link.md': '',
  });
  symlinkSync('../planning/plans/0001/plan.md', join(root, 'products/a/.notes/plan.md'));
  execFileSync('git', ['add', '-A'], { cwd: root });
  try {
    const run = spawnSync(
      process.execPath,
      [
        join(scripts, 'move-plan.mjs'),
        'products/a/planning/plans/0001',
        'products/b/planning/plans/0001',
      ],
      { encoding: 'utf8', cwd: root },
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      readFileSync(join(root, 'products/a/README.md'), 'utf8'),
      '[plan](../b/planning/plans/0001/plan.md)\n',
    );
    assert.equal(
      readFileSync(join(root, '.notes/idea.md'), 'utf8'),
      '[plan](../products/a/planning/plans/0001/plan.md)\n',
    );
    assert.equal(
      readFileSync(join(root, 'products/a/.notes/idea.md'), 'utf8'),
      '[plan](../planning/plans/0001/plan.md), [root](/products/a/planning/plans/0001/plan.md)\n',
    );
    assert.equal(
      readlinkSync(join(root, 'products/a/.notes/plan.md')),
      '../planning/plans/0001/plan.md',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('isInNotesFolder knows .notes/ at any depth and planning/notes/, and nothing that resembles them', () => {
  for (const path of [
    '.notes/a.md',
    'p/.notes/b/c.md',
    'planning/notes/a.md',
    'x/planning/notes/y/z.md',
  ])
    assert.equal(isInNotesFolder(path), true, path);
  for (const path of [
    '.notes',
    'notes/a.md',
    'x/.notes.md',
    'x/my.notes/a.md',
    'planning/notes',
    'p/plans/0001/implementation-notes.md',
  ])
    assert.equal(isInNotesFolder(path), false, path);
});

test('move-plan rewrites a root link into a moved path in the root form and leaves one out of it', () => {
  const root = repository({
    'planning/draft-plans/idea/plan.md': `${PLAN}\nSee [D1](/docs/constitution.md#D1).\n`,
    'docs/constitution.md': '# C\n',
    'docs/guide.md':
      '[idea](/planning/draft-plans/idea/plan.md), [folder](/planning/draft-plans/idea/), ' +
      '[missing](/planning/draft-plans/gone/plan.md)\n',
  });
  try {
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'move-plan.mjs'), 'planning/draft-plans/idea', 'planning/plans/0001'],
      { encoding: 'utf8', cwd: root },
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      readFileSync(join(root, 'docs/guide.md'), 'utf8'),
      '[idea](/planning/plans/0001/plan.md), [folder](/planning/plans/0001/), ' +
        '[missing](/planning/draft-plans/gone/plan.md)\n',
    );
    assert.match(
      readFileSync(join(root, 'planning/plans/0001/plan.md'), 'utf8'),
      /\[D1\]\(\/docs\/constitution\.md#D1\)/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('move-plan rewrites a TSDoc root link into a moved path in a source file and leaves the others', () => {
  const comment =
    '/**\n * See {@link /docs/constitution.md#D1 | D1}, {@link /docs/constitution.md#D2},\n' +
    ' * {@link /docs/gone.md#D3 | D3} and {@link /other/rules.md#D4 | D4}.\n */\n';
  const root = repository({
    'docs/constitution.md': '# C\n',
    'other/rules.md': '# R\n',
    'src/a.ts': `${comment}export const a = 1;\n`,
    'src/b.mjs': '// {@link /docs/constitution.md#D5 | D5}\n',
    'src/c.txt': '{@link /docs/constitution.md#D6 | D6}\n',
    'docs/guide.md': '`{@link /docs/constitution.md#D7 | D7}` [D8](/docs/constitution.md#D8)\n',
  });
  try {
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'move-plan.mjs'), 'docs', 'products/x/layered-docs'],
      { encoding: 'utf8', cwd: root },
    );
    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      readFileSync(join(root, 'src/a.ts'), 'utf8'),
      '/**\n * See {@link /products/x/layered-docs/constitution.md#D1 | D1}, ' +
        '{@link /products/x/layered-docs/constitution.md#D2},\n' +
        ' * {@link /docs/gone.md#D3 | D3} and {@link /other/rules.md#D4 | D4}.\n */\n' +
        'export const a = 1;\n',
    );
    assert.equal(
      readFileSync(join(root, 'src/b.mjs'), 'utf8'),
      '// {@link /products/x/layered-docs/constitution.md#D5 | D5}\n',
    );
    // not a source file, and a TSDoc link in Markdown inline code: both left alone
    assert.equal(
      readFileSync(join(root, 'src/c.txt'), 'utf8'),
      '{@link /docs/constitution.md#D6 | D6}\n',
    );
    assert.equal(
      readFileSync(join(root, 'products/x/layered-docs/guide.md'), 'utf8'),
      '`{@link /docs/constitution.md#D7 | D7}` [D8](/products/x/layered-docs/constitution.md#D8)\n',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('move-plan points moved symbolic links again, leaves archive/ alone, rewrites p/ like any folder and reads a wrapped TSDoc link', () => {
  const root = repository({
    'docs/constitution.md': '[p](../skills/x/templates/plan/plan.template.md)\n',
    'skills/x/templates/plan/plan.template.md': '# T\n',
    'src/a.ts':
      '/**\n * See {@link\n * /docs/constitution.md#D1 | D1}.\n */\nexport const a = 1;\n',
    'archive/old.md': '[c](/docs/constitution.md#D1)\n',
    'p/note.md': '[c](../docs/constitution.md)\n',
  });
  try {
    mkdirSync(join(root, 'catalog'));
    symlinkSync('../skills/x/templates/plan', join(root, 'catalog/plan'));
    symlinkSync('../../docs/constitution.md', join(root, 'skills/x/link.md'));
    symlinkSync('/absolute/elsewhere', join(root, 'catalog/absolute'));
    execFileSync('git', ['add', '-A'], { cwd: root });
    const run = spawnSync(
      process.execPath,
      [
        join(scripts, 'move-plan.mjs'),
        'skills',
        'products/s/packages/s',
        'docs',
        'products/s/layered-docs',
      ],
      { encoding: 'utf8', cwd: root },
    );
    assert.equal(run.status, 0, run.stderr);
    // a link into a moved folder, and a moved link into another moved folder, point again
    assert.equal(
      readlinkSync(join(root, 'catalog/plan')),
      '../products/s/packages/s/x/templates/plan',
    );
    assert.equal(
      readlinkSync(join(root, 'products/s/packages/s/x/link.md')),
      '../../../layered-docs/constitution.md',
    );
    assert.equal(readlinkSync(join(root, 'catalog/absolute')), '/absolute/elsewhere');
    // the link to the constitution is not written through: the file itself is rewritten from its own folder
    assert.equal(
      readFileSync(join(root, 'products/s/layered-docs/constitution.md'), 'utf8'),
      '[p](../packages/s/x/templates/plan/plan.template.md)\n',
    );
    assert.equal(
      readFileSync(join(root, 'src/a.ts'), 'utf8'),
      '/**\n * See {@link\n * /products/s/layered-docs/constitution.md#D1 | D1}.\n */\nexport const a = 1;\n',
    );
    assert.equal(
      readFileSync(join(root, 'archive/old.md'), 'utf8'),
      '[c](/docs/constitution.md#D1)\n',
    );
    assert.equal(
      readFileSync(join(root, 'p/note.md'), 'utf8'),
      '[c](../products/s/layered-docs/constitution.md)\n',
    );
    // the index holds the new link texts
    const staged = execFileSync('git', ['diff', '--cached', '--name-only'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.match(staged, /^catalog\/plan$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('check-planning resolves a root link from the repository root and reports a missing one', () => {
  const notes = '# Notes\n\n[Implement](plan.md)\n';
  const root = repository({
    'docs/constitution.md': '# C\n',
    'p/planning/plans/0001/plan.md': `${PLAN}\n## Scope\n\nSee [D1](/docs/constitution.md#D1).\n`,
    'p/planning/plans/0002/plan.md': `${PLAN}\n## Scope\n\nSee [D1](/docs/gone.md#D1).\n`,
    'p/planning/plans/0001/implementation-notes.md': notes,
  });
  try {
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'check-planning.mjs'), join(root, 'p/planning'), '--no-validate'],
      { encoding: 'utf8' },
    );
    const output = run.stdout + run.stderr;
    assert.equal(run.status, 1, output);
    assert.doesNotMatch(output, /link target not found: \/docs\/constitution\.md#D1/);
    assert.match(output, /0002\/plan\.md.*link target not found: \/docs\/gone\.md#D1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
