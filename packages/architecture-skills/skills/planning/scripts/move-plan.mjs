#!/usr/bin/env node
// move-plan: moves plan folders (or any files and folders) with `git mv` and rewrites every
// relative Markdown link that the move would break, so no link in the repository's tracked
// `.md` files stops resolving (references/plans.md of the planning skill). No dependencies;
// Node 20+.
//
//   node move-plan.mjs <from> <to> [<from> <to> ...]
//
// Links into a moved path from outside, and links out of a moved Markdown file, are
// rewritten; a repository-root link (`/reviewer2/….md#D21`) into a moved path keeps the root
// form, and one out of a moved file needs no change. A TSDoc root link (`{@link /….md#D21 | D21}`)
// into a moved path in a tracked source file (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`,
// `.cjs`) is rewritten the same way. Links in Markdown code blocks and inline code are left alone,
// and so are `Plan:` trailers in the history. A tracked symbolic link that moved, or whose target
// moved, points at its target again; nothing under `archive/` (lab D6) or in a `.notes/` or
// `planning/notes/` folder (the person's notes) is read or rewritten.
// Several pairs in one run rewrite each file once.

import { movePaths } from './planning-lib.mjs';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  process.stderr.write('Usage: move-plan <from> <to> [<from> <to> ...]\n');
  process.exit(2);
}
const pairs = [];
for (let i = 0; i < args.length; i += 2) pairs.push([args[i], args[i + 1]]);
try {
  const { moved, rewritten, relinked } = movePaths(pairs);
  process.stdout.write(
    `move-plan: moved ${moved} paths, rewrote links in ${rewritten} files, pointed ${relinked} symbolic links again\n`,
  );
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
