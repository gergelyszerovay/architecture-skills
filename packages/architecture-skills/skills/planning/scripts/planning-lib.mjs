// planning-lib: what the planning skill's scripts share. No dependencies; Node 20+.
//
//   - the layout of a planning folder (`plans/<nnnn>/`, `draft-plans/<slug>/`), its plans
//     and the status each one's files give it;
//   - the two-key frontmatter of a plan (`after:` and `fixes:`);
//   - `findPlanningRoots` and `resolveRoots`, which find the planning roots under a folder;
//   - `movePaths`, which moves files or folders with `git mv` and rewrites every relative or
//     repository-root Markdown link that the move would break;
//   - `resolveLinkPath`, which resolves a link's path, relative or from the repository root.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const PLAN = /^(?:(.+)\.)?plan\.md$/;
export const NOTES = /^(?:(.+)\.)?implementation-notes\.md$/;
export const REVIEW = /^(?:(.+)\.)?review\.md$/;
export const QUESTIONS = /^(?:(.+)\.)?questions\.md$/;
export const SCREENSHOTS = /^(?:(.+)\.)?implementation-notes-screenshots$/;

export const posixPath = (path) => path.split(sep).join('/');

/** The text without fenced code blocks. */
export function stripCode(text) {
  return text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
}

/** The first `# ` heading outside code, or ''. */
export function titleOf(text) {
  const line = stripCode(text)
    .split('\n')
    .find((candidate) => candidate.startsWith('# '));
  return line ? line.slice(2).trim() : '';
}

/**
 * The questions of a `questions.md`: one `### Q<n>` section each, answered when text follows
 * its `**Answer:**` line before the next heading. Headings and answers in fenced code do not
 * count.
 * @returns {{ total: number, unanswered: number, state: 'none' | 'open' | 'answered' }}
 *   `none` without a question, `open` with at least one unanswered, else `answered`
 */
export function readQuestions(text) {
  let total = 0;
  let unanswered = 0;
  for (const section of stripCode(text).split(/^(?=#{1,6} )/m)) {
    if (!/^### Q\d+\b/.test(section)) continue;
    total += 1;
    const answer = section.match(/^\*\*Answer:\*\*(.*)$/m);
    const given = answer ? `${answer[1]}${section.slice(answer.index + answer[0].length)}` : '';
    if (given.trim() === '') unanswered += 1;
  }
  return { total, unanswered, state: total === 0 ? 'none' : unanswered > 0 ? 'open' : 'answered' };
}

/**
 * Splits a leading `---` block off a plan. The block holds two optional keys:
 * `after: [0082, 0083]` and `fixes: 0084`; a trailing `# comment` is ignored.
 * @returns {{ after: string[], fixes: string | undefined, body: string, keys: string[] }}
 */
export function readFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const result = { after: [], fixes: undefined, body: text, keys: [] };
  if (!match) return result;
  result.body = text.slice(match[0].length);
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.replace(/\s+#.*$/, '').match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!entry) continue;
    const [, key, value] = entry;
    result.keys.push(key);
    const numbers = value.match(/\d{4}/g) ?? [];
    if (key === 'after') result.after = numbers;
    if (key === 'fixes') result.fixes = numbers[0];
  }
  return result;
}

function dirs(path) {
  return existsSync(path)
    ? readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory())
    : [];
}

/**
 * Every plan of a planning folder: the numbered ones under `plans/` and the drafts under
 * `draft-plans/`. A plan is one `plan.md` or `<artifact>.plan.md`; the notes and the review
 * beside it are the plan's status.
 * @returns {Array<{
 *   id: string, number: string | undefined, slug: string | undefined, draft: boolean,
 *   folder: string, file: string, name: string, artifact: string | undefined,
 *   notesFile: string, reviewFile: string, questionsFile: string, hasNotes: boolean,
 *   hasReview: boolean, hasQuestions: boolean, questions: 'none' | 'open' | 'answered',
 *   title: string, after: string[], fixes: string | undefined, text: string
 * }>}
 */
export function readPlans(root) {
  const plans = [];
  const kinds = [
    ['plans', (name) => /^\d{4}$/.test(name), false],
    ['draft-plans', () => true, true],
  ];
  for (const [parent, accepts, draft] of kinds) {
    for (const name of dirs(join(root, parent)).filter(accepts).sort()) {
      const folder = join(root, parent, name);
      for (const file of readdirSync(folder).filter((entry) => PLAN.test(entry))) {
        const artifact = file.match(PLAN)[1];
        const prefix = artifact ? `${artifact}.` : '';
        const text = readFileSync(join(folder, file), 'utf8');
        const frontmatter = readFrontmatter(text);
        const questionsFile = join(folder, `${prefix}questions.md`);
        const hasQuestions = existsSync(questionsFile);
        plans.push({
          id: `${name}${artifact ? `/${artifact}` : ''}`,
          number: draft ? undefined : name,
          slug: draft ? name : undefined,
          draft,
          folder,
          file: join(folder, file),
          name: file,
          artifact,
          notesFile: join(folder, `${prefix}implementation-notes.md`),
          reviewFile: join(folder, `${prefix}review.md`),
          questionsFile,
          hasNotes: existsSync(join(folder, `${prefix}implementation-notes.md`)),
          hasReview: existsSync(join(folder, `${prefix}review.md`)),
          hasQuestions,
          questions: hasQuestions
            ? readQuestions(readFileSync(questionsFile, 'utf8')).state
            : 'none',
          title: titleOf(frontmatter.body),
          after: frontmatter.after,
          fixes: frontmatter.fixes,
          text,
        });
      }
    }
  }
  return plans;
}

/**
 * The status of a numbered plan from its files: `draft`, `waiting` (open, and a plan it is
 * `after` has no notes), `open`, `implemented` (notes), `questions` (notes, a `questions.md`
 * with an unanswered question, no review), `answered` (notes, every question answered, no
 * review: the review is due again) or `reviewed` (a review).
 */
export function statusOf(plan, plans) {
  if (plan.draft) return 'draft';
  if (plan.hasReview) return 'reviewed';
  if (plan.hasNotes) {
    if (plan.questions === 'open') return 'questions';
    return plan.questions === 'answered' ? 'answered' : 'implemented';
  }
  const waiting = plan.after.some((number) =>
    plans.some((other) => other.number === number && !other.artifact && !other.hasNotes),
  );
  return waiting ? 'waiting' : 'open';
}

/** The next free plan number: one after the highest folder under `plans/`, `notes/archive/` or `archive/`. */
export function nextNumber(root) {
  const used = [
    ...dirs(join(root, 'plans')),
    ...dirs(join(root, 'notes', 'archive')),
    ...dirs(join(root, 'archive')),
  ]
    .filter((name) => /^\d{4}$/.test(name))
    .map(Number);
  return String(Math.max(0, ...used) + 1).padStart(4, '0');
}

/** Tells whether a folder is a planning root: it holds `plans/` or `draft-plans/`. */
export function isPlanningRoot(dir) {
  return existsSync(join(dir, 'plans')) || existsSync(join(dir, 'draft-plans'));
}

/** The files under a folder as paths relative to it, from Git when it can, else a walk. */
function filesUnder(dir) {
  try {
    return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: dir,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\0')
      .filter(Boolean);
  } catch {
    const found = [];
    const walk = (folder, prefix) => {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        if (entry.isDirectory()) walk(join(folder, entry.name), `${prefix}${entry.name}/`);
        else found.push(`${prefix}${entry.name}`);
      }
    };
    walk(dir, '');
    return found;
  }
}

/**
 * The planning roots under a folder (D15 of the lab constitution): every folder that holds
 * `plans/` or `draft-plans/` with a file in it, found among the tracked and untracked files.
 * `node_modules` and dot-folders (the person's `.notes/` among them) are skipped, and a root's own
 * subfolders are not searched, so its `notes/` is never read.
 * @returns {string[]} absolute folders, sorted
 */
export function findPlanningRoots(dir) {
  const base = resolve(dir);
  const roots = new Set();
  for (const file of filesUnder(base)) {
    const segments = file.split('/');
    if (segments.slice(0, -1).some((s) => s === 'node_modules' || s.startsWith('.'))) continue;
    segments.slice(0, -1).forEach((segment, index) => {
      if (segment === 'plans' || segment === 'draft-plans') {
        roots.add(segments.slice(0, index).join('/'));
      }
    });
  }
  const sorted = [...roots].sort();
  return sorted
    .filter(
      (root) =>
        !sorted.some((other) => other !== root && (other === '' || root.startsWith(`${other}/`))),
    )
    .map((root) => (root === '' ? base : join(base, root)));
}

/**
 * The roots a script works on for a folder it was given: the folder itself when it is a root
 * (as before), else the roots found under it, else the folder.
 * @returns {string[]} absolute folders
 */
export function resolveRoots(dir) {
  const base = resolve(dir);
  if (isPlanningRoot(base)) return [base];
  const found = findPlanningRoots(base);
  return found.length > 0 ? found : [base];
}

/**
 * The one root among those under a folder that satisfies a test, for the scripts that act on one
 * plan; refuses naming the candidates when several do.
 * @param {string} dir the folder given
 * @param {(root: string) => boolean} has whether a root holds the plan
 * @param {string} what what is looked for, for the messages
 * @returns {string | undefined} the root, or undefined when none holds it
 */
export function resolveOneRoot(dir, has, what) {
  const matching = resolveRoots(dir).filter(has);
  if (matching.length > 1) {
    throw new Error(`${what} exists in several planning roots: ${matching.join(', ')}; pass one`);
  }
  return matching[0];
}

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();

// Inline links and images, and reference definitions (`[id]: target`).
const INLINE = /(!?\[[^\]]*\]\()(<?)([^)\s>]+)(>?)((?:\s+"[^"]*")?\))/g;
const DEFINITION = /^(\[[^\]]+\]:\s*)(<?)(\S+?)(>?)(\s*)$/gm;

/** Index ranges of fenced code blocks and inline code spans: links starting in them are not links. */
function codeRanges(text) {
  const ranges = [];
  for (const match of text.matchAll(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  for (const match of text.matchAll(/`[^`\n]*`/g)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/**
 * Applies `change(target)` to every link target outside code. A code span inside a link's
 * text (``[`a.md`](a.md)``) does not hide the link; a link written inside a code span is not
 * one.
 */
export function mapLinks(text, change) {
  const ranges = codeRanges(text);
  const hidden = (index) => ranges.some(([start, end]) => index >= start && index < end);
  const replace = (all, open, lt, target, gt, close, offset) => {
    if (hidden(offset)) return all;
    const next = change(target);
    return next === target ? all : `${open}${lt}${next}${gt}${close}`;
  };
  return text.replace(INLINE, replace).replace(DEFINITION, replace);
}

/** The non-code folder of a lab (lab D6) whose files `movePaths` never rewrites: `archive/`, a predecessor kept frozen. */
const UNTOUCHED = ['archive'];

/**
 * Tells whether a repository path lies in the person's notes: a `.notes/` folder at any depth, or
 * a `planning/notes/` folder (the notes' earlier place). No script reads, rewrites or enters them.
 * @param {string} path a `/`-separated path
 * @returns {boolean} true inside such a folder
 */
export function isInNotesFolder(path) {
  const folders = path.split('/').slice(0, -1);
  return folders.some(
    (segment, at) =>
      segment === '.notes' || (segment === 'notes' && folders[at - 1] === 'planning'),
  );
}

/** The source files whose TSDoc root links `movePaths` rewrites. */
export const SOURCE_FILES = ['*.ts', '*.tsx', '*.mts', '*.cts', '*.js', '*.mjs', '*.cjs'];

// A TSDoc link from the repository root: `{@link /a/b.md#D1 | D1}`, `{@link /a/b.md#D1}`.
// A link wrapped after `{@link` continues on the next comment line, after its ` * `.
const TSDOC_ROOT_LINK = /(\{@link(?:\s*\n\s*\*)?\s+)(\/(?!\/)[^\s|}]+)/g;

/**
 * Applies `change(target)` to the target of every TSDoc link from the repository root
 * (`{@link /a/b.md#D1 | D1}`) in a source file; the link text and any other link stay.
 * @param {string} text the file's text
 * @param {(target: string) => string} change the new target for a target
 * @returns {string} the text with the targets changed
 */
export function mapTsdocLinks(text, change) {
  return text.replace(TSDOC_ROOT_LINK, (all, open, target) => {
    const next = change(target);
    return next === target ? all : `${open}${next}`;
  });
}

/** The relative-looking link targets of a text, outside code. */
export function linkTargets(text) {
  const targets = [];
  mapLinks(text, (target) => {
    targets.push(target);
    return target;
  });
  return targets;
}

/**
 * Resolves a link's path (no fragment, decoded) written in `file`: a path starting with one `/`
 * from the repository root `top` (a row citation, `/reviewer2/layered-docs/….md#D21`, the
 * citations skill's "Rows"), any other from the file's folder.
 * @param {string} file the absolute path of the file holding the link
 * @param {string} path the link's path
 * @param {string | undefined} top the repository root; without it a root link resolves as a
 *   filesystem path
 * @returns {string} the absolute path the link names
 */
export function resolveLinkPath(file, path, top) {
  if (top !== undefined && path.startsWith('/') && !path.startsWith('//')) {
    return join(top, path.slice(1));
  }
  return resolve(dirname(file), path);
}

/**
 * The root of the Git repository holding a folder, or `undefined` outside one.
 * @param {string} dir a folder
 * @returns {string | undefined} the repository root
 */
export function repositoryTop(dir) {
  try {
    return git(dir, 'rev-parse', '--show-toplevel');
  } catch {
    return undefined;
  }
}

/**
 * Moves files or folders with `git mv` and rewrites every relative link in the repository's
 * tracked Markdown files whose target lies under a moved path, and every relative link
 * inside a moved Markdown file that points out of it. A repository-root link (`/a/b.md#D1`)
 * whose target lies under a moved path is rewritten in the root form; one out of a moved file
 * needs no change. A TSDoc root link (`{@link /a/b.md#D1 | D1}`) in a tracked source file
 * (`SOURCE_FILES`) is rewritten the same way. Links in code are left alone (in Markdown), and so
 * are links whose target does not exist. Several pairs are moved in one run, so each file
 * is rewritten once.
 * @param {Array<[string, string]>} pairs `[from, to]`, each a path; `to` is the new path
 * A tracked symbolic link with a relative target that moved, or whose target moved, points at
 * its target again. Nothing under the non-code folder `archive/` (lab D6) or in the person's
 * notes (a `.notes/` or `planning/notes/` folder at any depth) is read or rewritten; a moved path in
 * them is moved by `git mv` alone.
 * @returns {{ moved: number, rewritten: number, relinked: number }} paths moved, files written and links pointed again
 */
export function movePaths(pairs) {
  const absolute = pairs.map(([from, to]) => [resolve(from), resolve(to)]);
  const top = git(dirname(absolute[0][0]), 'rev-parse', '--show-toplevel');
  const mapPath = (path) => {
    for (const [from, to] of absolute) {
      if (path === from) return to;
      if (path.startsWith(from + sep)) return join(to, path.slice(from.length + 1));
    }
    return path;
  };
  for (const [from, to] of absolute) {
    if (!existsSync(from)) throw new Error(`move-plan: ${from} does not exist`);
    if (existsSync(to)) throw new Error(`move-plan: ${to} exists already`);
  }

  const listed = (...patterns) =>
    git(top, 'ls-files', '-z', '--', ...patterns)
      .split('\0')
      .filter(Boolean)
      // the non-code folder `archive/` (lab D6) is history
      .filter((path) => !UNTOUCHED.some((folder) => path.startsWith(`${folder}/`)))
      // `.notes/` (and `planning/notes/`) is the person's own: never read, its links never rewritten.
      .filter((path) => !isInNotesFolder(path))
      .map((path) => join(top, path))
      // a tracked link is not followed: its target is rewritten where it is tracked
      .filter((path) => existsSync(path) && !lstatSync(path).isSymbolicLink());
  const tracked = listed('*.md');
  const edits = [];
  // TSDoc root links in source files: the root form stays, so a link out of a moved file needs no change
  for (const file of listed(...SOURCE_FILES)) {
    const text = readFileSync(file, 'utf8');
    const next = mapTsdocLinks(text, (target) => {
      const [path, fragment] = splitFragment(target);
      const resolved = resolveLinkPath(file, path, top);
      if (!existsSync(resolved)) return target;
      const newTarget = mapPath(resolved);
      if (newTarget === resolved) return target;
      let rootPath = `/${posixPath(relative(top, newTarget))}`;
      if (path.endsWith('/') && !rootPath.endsWith('/')) rootPath += '/';
      return rootPath + fragment;
    });
    if (next !== text) edits.push([file, next]);
  }
  for (const file of tracked) {
    const newFile = mapPath(file);
    const text = readFileSync(file, 'utf8');
    const next = mapLinks(text, (target) => {
      const [path, fragment] = splitFragment(target);
      if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return target;
      let decoded = path;
      try {
        decoded = decodeURI(path);
      } catch {
        return target;
      }
      const resolved = resolveLinkPath(file, decoded, top);
      if (!existsSync(resolved)) return target;
      const newTarget = mapPath(resolved);
      if (path.startsWith('/')) {
        if (newTarget === resolved) return target;
        let rootPath = `/${posixPath(relative(top, newTarget))}`;
        if (path.endsWith('/') && !rootPath.endsWith('/')) rootPath += '/';
        return rootPath + fragment;
      }
      if (newFile === file && newTarget === resolved) return target;
      let relativePath = posixPath(relative(dirname(newFile), newTarget)) || '.';
      if (path.endsWith('/') && !relativePath.endsWith('/')) relativePath += '/';
      if (!relativePath.startsWith('.') && path.startsWith('./'))
        relativePath = `./${relativePath}`;
      return relativePath + fragment;
    });
    if (next !== text) edits.push([file, next]);
  }

  // Tracked symbolic links with a relative target: where each points before the move.
  const links = git(top, 'ls-files', '-s', '-z')
    .split('\0')
    .filter((entry) => entry.startsWith('120000 '))
    .map((entry) => entry.slice(entry.indexOf('\t') + 1))
    .filter((path) => !UNTOUCHED.some((folder) => path.startsWith(`${folder}/`)))
    .filter((path) => !isInNotesFolder(path))
    .map((path) => join(top, path))
    .flatMap((path) => {
      const target = readlinkSync(path);
      return target.startsWith('/') ? [] : [{ path, target: resolve(dirname(path), target) }];
    });

  // Edit the files where they are now, then move: git mv keeps the edited content.
  for (const [file, next] of edits) writeFileSync(file, next);
  for (const [from, to] of absolute) {
    mkdirSync(dirname(to), { recursive: true });
    git(top, 'mv', from, to);
  }
  // Point each link that moved, or whose target moved, at its target again.
  let relinked = 0;
  for (const link of links) {
    const at = mapPath(link.path);
    const target = mapPath(link.target);
    if (at === link.path && target === link.target) continue;
    const text = relative(dirname(at), target);
    if (readlinkSync(at) === text) continue;
    unlinkSync(at);
    symlinkSync(text, at);
    git(top, 'add', '--', at);
    relinked += 1;
  }
  return { moved: absolute.length, rewritten: edits.length, relinked };
}

function splitFragment(target) {
  const at = target.indexOf('#');
  return at < 0 ? [target, ''] : [target.slice(0, at), target.slice(at)];
}
