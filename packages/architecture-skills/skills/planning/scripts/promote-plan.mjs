#!/usr/bin/env node
// promote-plan: promotes a draft to a numbered plan. It takes the next number after the
// highest folder under `plans/` (and `notes/archive/`), moves `draft-plans/<slug>/` to
// `plans/<nnnn>/` with move-plan, rewriting the links to it, and prints the number
// (references/plans.md of the planning skill). Run by the planner or the orchestrator, on
// `main`; a race between two promoters shows as a rejected push, and the second promotes
// again. No dependencies; Node 20+.
//
//   node promote-plan.mjs <planning-dir> <slug>
//
// A folder that is not a planning root is searched for the one root whose `draft-plans/<slug>/`
// exists; several are refused, named.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { movePaths, nextNumber, resolveOneRoot } from './planning-lib.mjs';

const [dirArg, slug] = process.argv.slice(2);
if (!dirArg || !slug) {
  process.stderr.write('Usage: promote-plan <planning-dir> <slug>\n');
  process.exit(2);
}
let root = resolve(dirArg);
try {
  // A folder that is not a planning root: the one root under it that holds the draft (D15).
  root =
    resolveOneRoot(
      dirArg,
      (each) => existsSync(join(each, 'draft-plans', slug, 'plan.md')),
      `draft ${slug}`,
    ) ?? root;
} catch (error) {
  process.stderr.write(`promote-plan: ${error.message}\n`);
  process.exit(1);
}
const draft = join(root, 'draft-plans', slug);
if (!existsSync(join(draft, 'plan.md'))) {
  process.stderr.write(`promote-plan: ${draft}/plan.md does not exist\n`);
  process.exit(1);
}
const number = nextNumber(root);
try {
  movePaths([[draft, join(root, 'plans', number)]]);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
process.stdout.write(`${number}\n`);
