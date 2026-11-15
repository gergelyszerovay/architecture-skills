#!/usr/bin/env node
// check-planning: checks how a planning folder fits together, the part `validate-md` cannot
// see, prints a status table, then runs `validate-md` over the folder. No dependencies; Node 20+.
//
//   node check-planning.mjs <planning-dir> [--no-validate]
//
// A folder that holds `plans/` or `draft-plans/` is a planning root and is checked as such; any
// other folder is searched for roots (never entering a root's `notes/` or any dot-folder, the
// person's `.notes/` among them), and each is checked in
// turn, with its own status table. The exit code is 1 when any fails.
//
// Checks (references/plans.md of the planning skill):
//   - plans live in `plans/<nnnn>/` and drafts in `draft-plans/<slug>/`; a `<nnnn>/` folder
//     left at the root is reported when it holds a file (a dot-folder such as an agent's
//     `.claude/` does not count);
//   - every folder holds at least one plan (`plan.md` or `<artifact>.plan.md`);
//   - every implementation-notes file has its plan, every review its notes, and every
//     `implementation-notes-screenshots/` folder its notes; a draft has neither notes nor
//     a review;
//   - the frontmatter of a plan holds only `after:` and `fixes:`, which name existing
//     numbered plans, and `after:` has no cycle;
//   - a plan in the current form (a `Scope` section, no `Status and scope`) opens with the
//     sentence that names the planning skill, and keeps no `Implementation notes` section;
//   - an optional `issues/` folder holds only Markdown files, each linked from a plan of
//     the same folder;
//   - a `questions.md` has its implementation notes and at least one question, and no
//     `review.md` sits beside one that still has an unanswered question;
//   - a review's Verdict is `no findings`, `findings`, `findings, fix drafted` or `legacy`;
//   - relative links and images in implementation notes, reviews and current-form plans
//     resolve, and so do repository-root links (`/reviewer2/….md#D21`), from the repository's
//     root;
// A plan is implemented when its notes file exists, and reviewed when its review does.
//
// `validate-md` is looked up on PATH; run the script through `pnpm exec` in a package
// that depends on the markdown-schema package, or pass --no-validate and run it yourself.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import {
  isPlanningRoot,
  linkTargets,
  NOTES,
  PLAN,
  posixPath,
  readFrontmatter,
  resolveRoots,
  readPlans,
  QUESTIONS,
  readQuestions,
  repositoryTop,
  resolveLinkPath,
  REVIEW,
  SCREENSHOTS,
  statusOf,
  stripCode,
} from './planning-lib.mjs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const validate = !args.includes('--no-validate');
if (args.includes('--roadmap')) {
  process.stderr.write(
    'check-planning: --roadmap is gone; the roadmap is printed, not committed\n',
  );
  process.exit(2);
}
const dirArg = args.find((arg) => !arg.startsWith('--'));
if (!dirArg) {
  process.stderr.write('Usage: check-planning <planning-dir> [--no-validate]\n');
  process.exit(2);
}
const root = resolve(dirArg);
// Given a folder that is not a planning root, check each root found under it (D15), one run each.
const found = isPlanningRoot(root) ? [root] : resolveRoots(root);
if (found.length !== 1 || found[0] !== root) {
  let failed = false;
  for (const each of found) {
    process.stdout.write(`check-planning: ${relative(process.cwd(), each) || '.'}\n`);
    const run = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), each, ...args.filter((arg) => arg.startsWith('--'))],
      { stdio: 'inherit' },
    );
    failed ||= run.status !== 0;
  }
  process.exit(failed ? 1 : 0);
}
const errors = [];
const report = (file, message) => errors.push(`${relative(process.cwd(), file)}: ${message}`);

const headings = (text) =>
  stripCode(text)
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim());

function verdictOf(text) {
  const lines = stripCode(text).split('\n');
  const start = lines.findIndex((line) => line.trim() === '## Verdict');
  if (start < 0) return '';
  return (
    lines
      .slice(start + 1)
      .find((line) => line.trim() !== '')
      ?.trim() ?? ''
  );
}

function preamble(text) {
  const lines = stripCode(text).split('\n');
  const title = lines.findIndex((line) => line.startsWith('# '));
  const first = lines.findIndex((line) => line.startsWith('## '));
  return lines.slice(title + 1, first < 0 ? undefined : first).join('\n');
}

/** The repository root of each folder checked, read once. */
const tops = new Map();
function topOf(dir) {
  if (!tops.has(dir)) tops.set(dir, repositoryTop(dir));
  return tops.get(dir);
}

function checkLinks(file, text) {
  for (const link of linkTargets(text)) {
    const target = link.split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (!existsSync(resolveLinkPath(file, decodeURI(target), topOf(dirname(file))))) {
      report(file, `link target not found: ${link}`);
    }
  }
}

/**
 * @type {Map<string, {
 *   file: string,
 *   notesFile: string,
 *   hasNotes: boolean,
 *   hasReview: boolean,
 *   status: string,
 *   notesValidity?: string
 * }>} keyed by path from root
 */
const plans = new Map();

/**
 * Whether a folder holds a file, outside dot-folders. Git moves files, not folders, so a move
 * can leave a folder behind that holds only an agent's empty `.claude/`; it is not a plan.
 * @param {string} dir
 * @returns {boolean}
 */
function holdsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.name.startsWith('.')
      ? false
      : entry.isDirectory()
        ? holdsFiles(join(dir, entry.name))
        : true,
  );
}

for (const stale of readdirSync(root).filter(
  (name) =>
    /^\d{4}$/.test(name) &&
    statSync(join(root, name)).isDirectory() &&
    holdsFiles(join(root, name)),
)) {
  report(join(root, stale), 'a plan folder at the root; plans live in plans/<nnnn>/');
}

const all = readPlans(root);
const folders = [];
for (const parent of ['plans', 'draft-plans']) {
  const parentDir = join(root, parent);
  if (!existsSync(parentDir)) continue;
  for (const name of readdirSync(parentDir)) {
    const dir = join(parentDir, name);
    if (name.startsWith('.') || !statSync(dir).isDirectory()) continue;
    if (parent === 'plans' && !/^\d{4}$/.test(name)) {
      report(dir, 'a folder under plans/ that is not named by a four-digit number');
      continue;
    }
    folders.push([dir, parent === 'draft-plans']);
  }
}

for (const [dir, draft] of folders) {
  const names = readdirSync(dir);
  const planNames = names.filter((name) => PLAN.test(name));
  if (planNames.length === 0) report(dir, 'no plan.md or <artifact>.plan.md');
  if (draft && !names.includes('plan.md')) report(dir, 'a draft folder holds no plan.md');

  for (const name of names) {
    const own = (artifact) => names.includes(artifact ? `${artifact}.plan.md` : 'plan.md');
    const notes = name.match(NOTES);
    if (notes && !own(notes[1])) report(join(dir, name), 'implementation notes without their plan');
    if (notes && draft) report(join(dir, name), 'a draft has no implementation notes');
    const questions = name.match(QUESTIONS);
    if (questions && !own(questions[1])) report(join(dir, name), 'questions without their plan');
    if (questions && draft) report(join(dir, name), 'a draft has no questions');
    if (
      questions &&
      !names.includes(`${questions[1] ? `${questions[1]}.` : ''}implementation-notes.md`)
    ) {
      report(join(dir, name), 'questions without implementation notes');
    }
    const review = name.match(REVIEW);
    if (review && !own(review[1])) report(join(dir, name), 'a review without its plan');
    if (review && draft) report(join(dir, name), 'a draft has no review');
    if (review && !names.includes(`${review[1] ? `${review[1]}.` : ''}implementation-notes.md`)) {
      report(join(dir, name), 'a review without implementation notes');
    }
    const shots = name.match(SCREENSHOTS);
    if (shots && !names.includes(`${shots[1] ? `${shots[1]}.` : ''}implementation-notes.md`)) {
      report(join(dir, name), 'screenshots folder without implementation notes');
    }
  }

  const planTexts = planNames.map((name) => readFileSync(join(dir, name), 'utf8'));
  const issuesDir = join(dir, 'issues');
  if (existsSync(issuesDir)) {
    if (!statSync(issuesDir).isDirectory()) report(issuesDir, 'issues is not a folder');
    else
      for (const issue of readdirSync(issuesDir)) {
        const issueFile = join(issuesDir, issue);
        if (!issue.endsWith('.md') || !statSync(issueFile).isFile()) {
          report(issueFile, 'an issues folder holds only Markdown files');
        } else if (!planTexts.some((text) => text.includes(`issues/${issue}`))) {
          report(issueFile, 'issue not linked from a plan of its folder');
        }
      }
  }

  for (const name of planNames) {
    const file = join(dir, name);
    const artifact = name.match(PLAN)[1];
    const prefix = artifact ? `${artifact}.` : '';
    const notesName = `${prefix}implementation-notes.md`;
    const notesFile = join(dir, notesName);
    const reviewFile = join(dir, `${prefix}review.md`);
    const text = readFileSync(file, 'utf8');
    const { body } = readFrontmatter(text);
    const sections = headings(body);
    const legacy = sections.includes('Status and scope');
    const hasNotes = existsSync(notesFile);
    const hasReview = existsSync(reviewFile);

    if (!legacy) {
      if (!sections.includes('Scope')) report(file, 'no Scope section');
      if (!/`planning` skill/.test(preamble(body))) {
        report(file, 'the first sentence does not name the `planning` skill');
      }
      if (sections.includes('Implementation notes')) {
        report(file, `an Implementation notes section; notes go in ${notesName}`);
      }
      checkLinks(file, body);
    }
    if (hasNotes) checkLinks(notesFile, readFileSync(notesFile, 'utf8'));
    const questionsFile = join(dir, `${prefix}questions.md`);
    if (existsSync(questionsFile)) {
      const questionsText = readFileSync(questionsFile, 'utf8');
      checkLinks(questionsFile, questionsText);
      const { total, unanswered } = readQuestions(questionsText);
      if (total === 0) report(questionsFile, 'no `### Q<n>` question section');
      if (hasReview && unanswered > 0) {
        report(reviewFile, 'a review beside a questions file with an unanswered question');
      }
    }
    if (hasReview) {
      const reviewText = readFileSync(reviewFile, 'utf8');
      checkLinks(reviewFile, reviewText);
      const verdict = verdictOf(reviewText);
      if (!/^(no findings|findings, fix drafted|findings|legacy)(?:\s*[:.].*)?$/i.test(verdict)) {
        report(
          reviewFile,
          'the Verdict is one line: no findings, findings, findings, fix drafted, or legacy',
        );
      }
    }

    const plan = all.find((candidate) => candidate.file === file);
    plans.set(posixPath(relative(root, file)), {
      file,
      notesFile,
      hasNotes,
      hasReview,
      status: draft ? 'draft' : statusOf(plan, all),
    });
  }
}

// Frontmatter: only `after:` and `fixes:`, naming numbered plans, with no cycle.
const numbers = new Set(all.filter((plan) => !plan.draft).map((plan) => plan.number));
for (const plan of all) {
  const { keys } = readFrontmatter(plan.text);
  for (const key of keys) {
    if (key !== 'after' && key !== 'fixes')
      report(plan.file, `frontmatter key ${key}: only after and fixes`);
  }
  for (const number of [...plan.after, ...(plan.fixes ? [plan.fixes] : [])]) {
    if (!numbers.has(number)) report(plan.file, `frontmatter names ${number}, which is not a plan`);
  }
}
const graph = new Map();
for (const plan of all.filter((candidate) => !candidate.draft && !candidate.artifact)) {
  graph.set(plan.number, plan.after);
}
const visiting = new Set();
const finished = new Set();
function visit(number, trail) {
  if (finished.has(number)) return;
  if (visiting.has(number)) {
    report(root, `after: has a cycle: ${[...trail, number].join(' -> ')}`);
    return;
  }
  visiting.add(number);
  for (const next of graph.get(number) ?? []) visit(next, [...trail, number]);
  visiting.delete(number);
  finished.add(number);
}
for (const number of graph.keys()) visit(number, []);

function validationOutput(result) {
  if (result.kind !== 'validated') return [result.message];

  const lines = result.templateErrors.map(
    (error) => `Error: invalid template ${error.templatePath}: ${error.message}`,
  );
  for (const { outcome } of result.documents) {
    if (outcome.kind === 'valid') continue;
    if (outcome.kind === 'schema-invalid') {
      lines.push(`${outcome.path}: schema validation failed`);
      lines.push(...outcome.issues.map((issue) => `  - ${issue.path}: ${issue.message}`));
    } else {
      lines.push(`${outcome.path}: ${outcome.message}`);
    }
  }
  lines.push(
    ...result.ambiguous.map(
      (document) => `${document.path}: ambiguous template: ${document.candidates.join(', ')}`,
    ),
  );
  lines.push(
    `validate-md: ${result.summary.documents} documents: ${result.summary.ok} OK, ${result.summary.failed} failed; ${result.summary.ambiguous} ambiguous; ${result.summary.unbound} unbound${result.summary.templateErrors === 0 ? '' : `; ${result.summary.templateErrors} template ${result.summary.templateErrors === 1 ? 'error' : 'errors'}`}`,
  );
  return lines;
}

function validateFolder() {
  const run = spawnSync('validate-md', ['--json', root], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (run.error?.code === 'ENOENT') {
    return {
      failed: true,
      messages: ['check-planning: validate-md not found on PATH; run it yourself'],
    };
  }
  if (run.error) {
    return {
      failed: true,
      messages: [`check-planning: could not run validate-md: ${run.error.message}`],
    };
  }

  let result;
  try {
    result = JSON.parse(run.stdout);
  } catch {
    return {
      failed: true,
      messages: [
        ...(run.stderr ? [run.stderr.trimEnd()] : []),
        'check-planning: could not read validate-md output',
      ],
    };
  }

  const documents = new Map(
    result.kind === 'validated'
      ? result.documents.map((document) => [document.path, document.outcome])
      : [],
  );
  if (result.kind === 'validated') {
    for (const plan of plans.values()) {
      if (!plan.hasNotes) continue;
      const path = posixPath(relative(result.root, plan.notesFile));
      const outcome = documents.get(path);
      plan.notesValidity =
        outcome?.kind === 'valid'
          ? 'Valid'
          : outcome?.kind === 'schema-invalid' || outcome?.kind === 'failed'
            ? 'Invalid'
            : 'Not validated';
    }
  }

  const messages = [
    ...validationOutput(result),
    ...(result.kind === 'validated' && run.stderr ? [run.stderr.trimEnd()] : []),
  ].filter(Boolean);
  return { failed: run.status !== 0, messages };
}

function printPlanTable() {
  const rows = [['Plan', 'Implemented?', 'Reviewed?', 'Waiting?', 'Implementation notes valid?']];
  const orderedPlans = [...plans].sort(([left], [right]) => left.localeCompare(right));
  for (const [path, plan] of orderedPlans) {
    const notesValidity = !plan.hasNotes ? 'Missing' : (plan.notesValidity ?? 'Not checked');
    rows.push([
      path,
      plan.hasNotes ? 'Yes' : 'No',
      plan.hasReview ? 'Yes' : 'No',
      plan.status === 'waiting' ? 'Yes' : 'No',
      notesValidity,
    ]);
  }
  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)));
  const border = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
  const formatRow = (row) =>
    `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`;
  const lines = [border, formatRow(rows[0]), border];
  lines.push(...rows.slice(1).map(formatRow), border);
  process.stdout.write(`${lines.join('\n')}\n\n`);
}

const validation = validate ? validateFolder() : { failed: false, messages: [] };
printPlanTable();
for (const message of validation.messages) process.stderr.write(`${message}\n`);
for (const error of errors) process.stdout.write(`${error}\n`);
process.stdout.write(`check-planning: ${plans.size} plans, ${errors.length} problems\n`);
const failed = errors.length > 0 || validation.failed;
process.exitCode = failed ? 1 : 0;
