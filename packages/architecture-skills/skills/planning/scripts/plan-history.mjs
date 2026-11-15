#!/usr/bin/env node
// plan-history: shows how a plan changed the documents, in three states, derived from Git
// without relying on how the commits were made or worded (references/plans.md of the
// planning skill). No dependencies; Node 20+.
//
//   node plan-history.mjs <planning-dir> <nnnn> [<document>] [--plan <artifact>]
//
// A folder that is not a planning root is searched for the one root with `plans/<nnnn>/`.
//
//   original     the document before planning: the parent of the commit that added the plan
//   planned      the document at handoff: where the implementation branch left off
//                (the merge base of the merge that added the implementation notes), or the
//                working tree while the plan is not implemented yet
//   implemented  the document at the tip of the implementation branch
//
// Without <document> it lists every document the plan links that changed, with the lines
// added and removed in planning and in implementation, and the other files the
// implementation changed. With <document> it prints the two diffs.
//
// A plan folder moved to `plans/<nnnn>/` when plans got their own folder. The script reads
// the folder under both paths: a commit's `Plan:` trailer may name the old path, and the
// plan and its notes were added under it. Git sees the move as a rename, so the folder's
// history continues across it.
//
// Edits made for other reasons between the plan's first commit and the handoff count as
// planning; the diffs are still right.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { resolveLinkPath, resolveOneRoot } from './planning-lib.mjs';

// A closed pipe (`| head`) ends the output, not the process with an error.
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

const args = process.argv.slice(2);
const planOption = args.indexOf('--plan');
const artifact = planOption >= 0 ? args[planOption + 1] : undefined;
const positional = args.filter(
  (arg, index) => !arg.startsWith('--') && (planOption < 0 || index !== planOption + 1),
);
let [dirArg, number, documentArg] = positional;
if (!dirArg || !/^\d{4}$/.test(number ?? '')) {
  process.stderr.write(
    'Usage: plan-history <planning-dir> <nnnn> [<document>] [--plan <artifact>]\n',
  );
  process.exit(2);
}

// A folder that is not a planning root: the one root under it that holds the plan (D15).
try {
  dirArg =
    resolveOneRoot(
      dirArg,
      (each) => existsSync(join(each, 'plans', number)) || existsSync(join(each, number)),
      `plan ${number}`,
    ) ?? dirArg;
} catch (error) {
  process.stderr.write(`plan-history: ${error.message}\n`);
  process.exit(2);
}

// Paths are passed from the repository root, so Git runs there once the root is known.
let gitCwd = process.cwd();
const git = (...gitArgs) =>
  execFileSync('git', gitArgs, {
    cwd: gitCwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
const tryGit = (...gitArgs) => {
  try {
    return git(...gitArgs);
  } catch {
    return '';
  }
};

const top = git('rev-parse', '--show-toplevel');
const fromCwd = (path) => resolve(path);
const fromTop = (path) => relative(top, resolve(path)).split('\\').join('/');
gitCwd = top;
const currentFolder = fromCwd(join(dirArg, 'plans', number));
const folder = existsSync(currentFolder) ? currentFolder : fromCwd(join(dirArg, number));
// The same folder before the move to `plans/`.
const oldFolder = fromCwd(join(dirArg, number));
const prefix = artifact ? `${artifact}.` : '';
const planFile = join(folder, `${prefix}plan.md`);
const notesFile = join(folder, `${prefix}implementation-notes.md`);
const oldPlanFile = join(oldFolder, `${prefix}plan.md`);
const oldNotesFile = join(oldFolder, `${prefix}implementation-notes.md`);
const planGrep = [planFile, oldPlanFile].map((path) => `--grep=^Plan: ${fromTop(path)}$`);
if (!existsSync(planFile)) {
  process.stderr.write(`plan-history: ${fromTop(planFile)} does not exist\n`);
  process.exit(2);
}

/** The oldest commit reachable from HEAD that added a path, or '' when none did. */
function addedIn(path, firstParent, oldPath) {
  const log = tryGit(
    'log',
    ...(firstParent ? ['--first-parent'] : []),
    '--diff-filter=A',
    '--format=%H',
    'HEAD',
    '--',
    fromTop(path),
    ...(oldPath ? [fromTop(oldPath)] : []),
  );
  return log.split('\n').filter(Boolean).at(-1) ?? '';
}

const planCommit = addedIn(planFile, false, oldPlanFile);
const original = planCommit ? tryGit('rev-parse', `${planCommit}^`) : git('rev-parse', 'HEAD');

// The implementation: the first-parent commit that brought in the notes. A merge's second
// parent is the branch tip and its merge base the handoff; a direct commit is its own tip,
// and the handoff is the parent of the oldest commit carrying the plan's `Plan:` trailer.
let planned = '';
let implementationBase = '';
let implemented = '';
const notesCommit = addedIn(notesFile, true, oldNotesFile);
if (notesCommit) {
  const parents = git('rev-list', '--parents', '-n', '1', notesCommit).split(' ').slice(1);
  if (parents.length > 1) {
    implemented = parents[1];
    // The merge base is where the branch's own changes start, even when the branch merged the
    // main line into itself on the way. The handoff is earlier: the parent of the branch's
    // first commit with the plan's trailer, when there is one.
    implementationBase = git('merge-base', parents[0], parents[1]);
    const first = tryGit('log', '--format=%H', ...planGrep, `${parents[0]}..${parents[1]}`)
      .split('\n')
      .filter(Boolean)
      .at(-1);
    planned = first ? git('rev-parse', `${first}^1`) : implementationBase;
  } else {
    implemented = notesCommit;
    const trailer = tryGit('log', '--format=%H', ...planGrep, notesCommit)
      .split('\n')
      .filter(Boolean)
      .at(-1);
    planned = trailer ? git('rev-parse', `${trailer}^`) : parents[0];
    implementationBase = planned;
  }
}

const short = (rev) => (rev ? rev.slice(0, 9) : 'working tree');
const range = (from, to) => (to ? [from, to] : [from]);

/** Lines added and removed in a path between two states (to = '' means the working tree). */
function stat(from, to, path) {
  const out = tryGit('diff', '--numstat', ...range(from, to), '--', path);
  const [added = '0', removed = '0'] = out.split('\t');
  if (out) return `+${added} -${removed}`;
  const lines = untrackedLines(to, path);
  return lines === undefined ? 'unchanged' : `new +${lines}`;
}

/**
 * The line count of a file that is new in the working tree and not tracked yet, which
 * `git diff` doesn't see; undefined for anything else.
 */
function untrackedLines(to, path) {
  if (to !== '' || tryGit('ls-files', '--', path) !== '') return undefined;
  const file = join(top, path);
  if (!existsSync(file)) return undefined;
  return readFileSync(file, 'utf8').split('\n').length - 1;
}

process.stdout.write(
  `plan ${fromTop(planFile)}\n` +
    `  original     ${short(original)}${planCommit ? ` (parent of ${short(planCommit)})` : ' (the plan is not committed yet)'}\n` +
    `  planned      ${notesCommit ? short(planned) : 'working tree (not implemented yet)'}\n` +
    `  implemented  ${notesCommit ? short(implemented) : '—'}\n\n`,
);

const planningTo = notesCommit ? planned : '';

if (documentArg) {
  const path = fromTop(documentArg);
  process.stdout.write(`== planning: ${path}\n`);
  const lines = untrackedLines(planningTo, path);
  process.stdout.write(
    `${tryGit('diff', ...range(original, planningTo), '--', path) || (lines === undefined ? '(no change)' : `(a new file of ${lines} lines, not tracked yet)`)}\n`,
  );
  if (notesCommit) {
    process.stdout.write(`\n== implementation: ${path}\n`);
    process.stdout.write(
      `${tryGit('diff', implementationBase, implemented, '--', path) || '(no change)'}\n`,
    );
  }
  process.exit(0);
}

// The documents the plan links, outside its own folder.
const linked = new Set();
const planText = readFileSync(planFile, 'utf8');
for (const match of planText.matchAll(/\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)) {
  const target = resolveLinkPath(planFile, decodeURI(match[1]), top);
  if (!target.startsWith(folder + '/')) linked.add(fromTop(target));
}

const rows = [];
for (const path of [...linked].sort()) {
  const planning = stat(original, planningTo, path);
  const implementation = notesCommit ? stat(implementationBase, implemented, path) : '—';
  if (planning !== 'unchanged' || (implementation !== 'unchanged' && implementation !== '—')) {
    rows.push([path, planning, implementation]);
  }
}
if (notesCommit) {
  const changed = tryGit('diff', '--name-only', implementationBase, implemented)
    .split('\n')
    .filter((path) => path && path.endsWith('.md') && !linked.has(path))
    .filter((path) => !path.startsWith(fromTop(folder) + '/'))
    .filter((path) => !path.startsWith(fromTop(oldFolder) + '/'));
  for (const path of changed)
    rows.push([path, '(not linked)', stat(implementationBase, implemented, path)]);
}

if (rows.length === 0) {
  process.stdout.write('No linked document changed.\n');
} else {
  const width = Math.max(8, ...rows.map(([path]) => path.length));
  process.stdout.write(`${'Document'.padEnd(width)}  ${'Planning'.padEnd(12)}  Implementation\n`);
  for (const [path, planning, implementation] of rows) {
    process.stdout.write(`${path.padEnd(width)}  ${planning.padEnd(12)}  ${implementation}\n`);
  }
}
if (notesCommit) {
  const code = tryGit('diff', '--name-only', implementationBase, implemented)
    .split('\n')
    .filter((path) => path && !path.endsWith('.md')).length;
  process.stdout.write(`\nThe implementation also changed ${code} other files.\n`);
}
