#!/usr/bin/env node
// roadmap: prints the roadmap of a planning folder to standard output: from the plans' titles,
// their frontmatter (`after:`, `fixes:`) and the files beside them (references/roadmap-and-direction.md
// of the planning skill). The roadmap is generated on demand and never committed. No
// dependencies; Node 20+.
//
//   node roadmap.mjs <planning-dir> [--write <path>] [--title <name>]
//
// With --write it writes the roadmap to <path> instead (links relative to that file; a local
// copy, which `.gitignore` ignores as `planning/roadmap.md`) and prints nothing else; it is
// refused when the folder holds several planning roots. The title defaults to
// "<folder above the planning dir> roadmap".

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { posixPath, readPlans, resolveRoots, statusOf } from './planning-lib.mjs';

const args = process.argv.slice(2);
const writeAt = args.indexOf('--write');
const writeArg = writeAt >= 0 ? args[writeAt + 1] : undefined;
if (writeAt >= 0 && (writeArg === undefined || writeArg.startsWith('--'))) {
  process.stderr.write('roadmap: --write needs a path\n');
  process.exit(2);
}
if (args.includes('--check')) {
  process.stderr.write('roadmap: --check is gone; the roadmap is printed, not committed\n');
  process.exit(2);
}
const titleAt = args.indexOf('--title');
const titleArg = titleAt >= 0 ? args[titleAt + 1] : undefined;
const dirArg = args.find(
  (arg, i) =>
    !arg.startsWith('--') &&
    (titleAt < 0 || i !== titleAt + 1) &&
    (writeAt < 0 || i !== writeAt + 1),
);
if (!dirArg) {
  process.stderr.write('Usage: roadmap <planning-dir> [--write <path>] [--title <name>]\n');
  process.exit(2);
}
const roots = resolveRoots(dirArg);
if (roots.length > 1 || roots[0] !== resolve(dirArg)) {
  // A folder that is not a planning root: do each root found under it (D15).
  if (roots.length > 1 && titleArg !== undefined) {
    process.stderr.write(`roadmap: --title is refused with ${roots.length} planning roots\n`);
    process.exit(1);
  }
  if (roots.length > 1 && writeArg !== undefined) {
    process.stderr.write(`roadmap: --write is refused with ${roots.length} planning roots\n`);
    process.exit(1);
  }
  let failed = false;
  for (const each of roots) {
    const run = spawnSync(
      process.execPath,
      [
        fileURLToPath(import.meta.url),
        each,
        ...(writeArg === undefined ? [] : ['--write', writeArg]),
        ...(titleArg === undefined ? [] : ['--title', titleArg]),
      ],
      { stdio: 'inherit' },
    );
    failed ||= run.status !== 0;
  }
  process.exit(failed ? 1 : 0);
}
const root = resolve(dirArg);
const product = titleArg ?? basename(dirname(root));

const cell = (text) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
// Links are relative to the folder the text lands in: the planning root, or the --write file's.
const base = writeArg === undefined ? root : dirname(resolve(writeArg));
const link = (label, file) => `[${label}](${posixPath(relative(base, file))})`;

const plans = readPlans(root);
const numbered = plans.filter((plan) => !plan.draft);
const byNumber = (a, b) => a.id.localeCompare(b.id);
const label = (plan) => plan.id;

// Open plans in `after:` order, then by number.
function ordered(list) {
  const placed = [];
  const waitingOn = (plan) =>
    plan.after.filter((number) => list.some((other) => other.number === number));
  const pending = [...list].sort(byNumber);
  while (pending.length > 0) {
    const index = pending.findIndex((plan) =>
      waitingOn(plan).every((number) => placed.some((other) => other.number === number)),
    );
    placed.push(...pending.splice(index < 0 ? 0 : index, 1));
  }
  return placed;
}

function table(header, rows) {
  if (rows.length === 0) return 'None.\n';
  const lines = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`];
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`);
  return `${lines.join('\n')}\n`;
}

const open = ordered(
  numbered.filter((plan) => ['open', 'waiting'].includes(statusOf(plan, plans))),
);
const questions = numbered.filter((plan) => statusOf(plan, plans) === 'questions').sort(byNumber);
const implemented = numbered
  .filter((plan) => ['implemented', 'answered'].includes(statusOf(plan, plans)))
  .sort(byNumber);
const done = numbered
  .filter((plan) => statusOf(plan, plans) === 'reviewed')
  .sort(byNumber)
  .reverse();
const drafts = plans.filter((plan) => plan.draft).sort(byNumber);

const waitsFor = (plan) => {
  const pending = plan.after.filter((number) =>
    numbered.some((other) => other.number === number && !other.artifact && !other.hasNotes),
  );
  return pending.length === 0 ? '' : pending.join(', ');
};

// The archived roadmaps: `notes/archive/`, or `archive/` in a folder migrated before it moved.
const archived = ['notes/archive', 'archive'].flatMap((dir) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir))
        .filter((name) => /^roadmap.*\.md$/.test(name))
        .sort()
        .map((name) => `${dir}/${name}`)
    : [],
);
const pointers = [
  existsSync(join(root, 'direction.md')) &&
    `direction not yet planned is in ${link('direction.md', join(root, 'direction.md'))}`,
  existsSync(join(root, 'deferred.md')) &&
    `what was left out on purpose is in ${link('deferred.md', join(root, 'deferred.md'))}`,
  ...archived.map(
    (path) =>
      `the roadmap before plans held their own status is ${link('archived', join(root, path))}`,
  ),
].filter(Boolean);
const seeAlso = pointers.length === 0 ? '' : ` See also: ${pointers.join('; ')}.`;

const out = [
  `# ${product} roadmap`,
  '',
  `Generated on demand by \`roadmap.mjs\` of the planning skill from the plans in \`plans/\` and \`draft-plans/\`; never committed. A plan's number is its only ID.${seeAlso}`,
  '',
  '## Open',
  '',
  table(
    ['Plan', 'Title', 'Waits for'],
    open.map((plan) => [link(label(plan), plan.file), cell(plan.title), waitsFor(plan)]),
  ),
  '## Questions for you',
  '',
  table(
    ['Plan', 'Title', 'Questions'],
    questions.map((plan) => [
      link(label(plan), plan.file),
      cell(plan.title),
      link('questions', plan.questionsFile),
    ]),
  ),
  '## Implemented, not reviewed',
  '',
  table(
    ['Plan', 'Title', 'Notes'],
    implemented.map((plan) => [
      link(label(plan), plan.file),
      cell(plan.title),
      link('notes', plan.notesFile),
    ]),
  ),
  '## Done',
  '',
  table(
    ['Plan', 'Title', 'Notes', 'Review'],
    done.map((plan) => [
      link(label(plan), plan.file),
      cell(plan.title),
      plan.hasNotes ? link('notes', plan.notesFile) : '',
      link('review', plan.reviewFile),
    ]),
  ),
  '## Drafts',
  '',
  table(
    ['Draft', 'Title'],
    drafts.map((plan) => [link(plan.slug, plan.file), cell(plan.title)]),
  ),
];
const next = `${out.join('\n')}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

if (writeArg === undefined) {
  process.stdout.write(next);
} else {
  mkdirSync(dirname(resolve(writeArg)), { recursive: true });
  writeFileSync(resolve(writeArg), next);
  process.stdout.write(`roadmap: wrote ${relative(process.cwd(), resolve(writeArg))}\n`);
}
