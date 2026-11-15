---
name: planning
description: Write, promote, implement, review and close numbered plans, and print the roadmap from them. Use when writing a plan or a draft (`planning/plans/<nnnn>/plan.md`, `planning/draft-plans/<slug>/plan.md`), implementing or closing one (`implementation-notes.md`), reviewing one (`review.md`), promoting a draft, moving a plan, or printing the roadmap; provides the `plan`, `implementation-notes`, `review`, `questions` and `roadmap` templates and the `check-planning`, `roadmap`, `promote-plan`, `move-plan` and `plan-history` scripts.
metadata:
  version: '0.1.4'
---

# Skill: planning

How a product or package group plans its work: numbered plans in `plans/<nnnn>/`, drafts
beside them in `draft-plans/`, each plan closed by implementation notes and a review, and a
roadmap printed on demand from the plans. The documents are markdown-schema documents: each binds by
its name (`plan.md`, `implementation-notes.md`, `review.md`, and a local `roadmap.md` written
with `--write`) to the template of that name, so `validate-md <path>` checks them like any
other document.

| You need                                                            | Read                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| To write, reconcile, implement, review or close a plan              | [plans.md](references/plans.md)                                                                                                 |
| To see how a plan changed its documents                             | `scripts/plan-history.mjs`, see [plans.md](references/plans.md)                                                                 |
| To check a planning folder                                          | `scripts/check-planning.mjs`, see [plans.md](references/plans.md)                                                               |
| To run plans with agents: implement, merge, review                  | the `plan-orchestrator` package, see "Running plans with the orchestrator" in [plans.md](references/plans.md)                   |
| To promote a draft, move a plan, or print the roadmap               | `scripts/promote-plan.mjs`, `move-plan.mjs`, `roadmap.mjs`, see [roadmap-and-direction.md](references/roadmap-and-direction.md) |
| To record agreed direction before its plan exists, or deferred work | [roadmap-and-direction.md](references/roadmap-and-direction.md)                                                                 |
| The shape a document must have                                      | the templates below                                                                                                             |

## Templates

Each template folder is `markdown-schema-templates/<name>/` and holds `<name>.template.md`
and valid `examples/`. A product makes them visible to its planning documents by linking
`markdown-schema-templates/<name>` from the folder above them (markdown-schema skill, "Binding").

| Template               | Binds to                  | Shape                                                                                                                                                                                             |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan`                 | `plan.md`                 | Open and unordered; a first sentence naming this skill, then the usual sections as optional free text.                                                                                            |
| `implementation-notes` | `implementation-notes.md` | Open; requires **Functional changes**, **Technical changes**, **Differences from the plan** and **Verification**; **Additional notes** optional.                                                  |
| `review`               | `review.md`               | Open; requires **Verdict**, **Findings** and **Checks run**; **Notes** optional.                                                                                                                  |
| `questions`            | `questions.md`            | Open; requires **Questions**: one `### Q<n>` per question with its context, what depends on the answer and an `**Answer:**` line.                                                                 |
| `roadmap`              | `roadmap.md`              | Printed by `roadmap.mjs` (`--write` makes a local copy, never committed): **Open**, **Questions for you**, **Implemented, not reviewed**, **Done** and **Drafts**, each free text (tables); open. |
| `direction`            | `direction.md`            | Open; requires **Agreements**: a table keyed `A<n>` (ID, Date, Direction, Status, Where it goes); a row's `## A<n> notes` stay free text.                                                         |
| `iterations`           | `iterations.md`           | Retired: an **Iterations** table keyed by **Iteration**, then one free `##` section per iteration; kept for an archived `iterations.md`.                                                          |

A plan in a folder with a second plan is named `<artifact>.plan.md`, so it still binds; its
notes are `<artifact>.implementation-notes.md`, its questions `<artifact>.questions.md`.

## When a change needs a plan

A plan is for work that adds something or needs its steps agreed first; a minor change is one
commit without a plan.

| One commit, no plan                                                               | A plan                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A bug fix, a test fix, a correction of a document                                 | A new command, flag, file format, package or public API                        |
| A change inside one package that its existing decisions already allow             | A new decision, or a change to how packages or products work together          |
| An existing decision amended in place, its reason in the commit and the changelog | Work in ordered steps, work that needs a review, or the person's choices first |

The person decides when in doubt, and their word wins either way. A change without a plan keeps
every other duty of a commit: the changelog entry, the documents it makes wrong changed in the
same commit, the hooks and the checks of the folder it changes; its commit carries no `Plan:`
trailer.

## Conventions

- The planning folder's root keeps `deferred.md`, `direction.md`,
  `plans/`, `draft-plans/`, `issues/` (issues no plan has taken yet) and the optional
  `orchestrator.json` (the commands the plan orchestrator runs; `references/plans.md`,
  "Running plans with the orchestrator").
- The person's notes (design documents, ideas, the archive, working notes) live in a `.notes/`
  folder at any level (the repository's root, a product beside its `planning/`, a package),
  never inside a planning folder; `planning/notes/` was their earlier place. An agent does not read, search
  or change them unless the person asks, and then only what they named; a plan restates what
  it takes from a note ([roadmap-and-direction.md](references/roadmap-and-direction.md), "Notes").
- A plan lives in `planning/plans/<nnnn>/plan.md`; numbers are never reused. A draft is
  `planning/draft-plans/<slug>/plan.md`. The implementation notes (with their
  `implementation-notes-screenshots/`) and the review live beside the plan, and the files
  are the plan's status; each has one writer. An implementation never edits its `plan.md`.
- A review that cannot judge a finding without the person writes `questions.md` beside the
  notes, asks the same questions in its chat and waits; the answers end up in the file, so
  the plan's folder holds the record (`references/plans.md`, "The review"). Only reviews ask
  questions for now; an implementation does not.
- A plan's optional frontmatter has two keys: `after:` (plans whose notes must exist before it
  starts) and `fixes:` (the plan a review's fix draft fixes).
- The roadmap is generated on demand (`scripts/roadmap.mjs <planning-dir>` prints it) and
  never committed: a planning root keeps no `roadmap.md`, and `.gitignore` ignores one that
  `--write` leaves locally.
- An issue a plan fixes moves from `issues/` into the plan's optional `issues/` folder, and
  the plan links it.
- Move a plan folder or a planning document with `scripts/move-plan.mjs`, which rewrites the
  links to it; promote a draft with `scripts/promote-plan.mjs`, on `main`, before its
  implementation starts. An implementer handed a draft stops and asks for it to be promoted.
- Every implementation commit carries a `Plan: <path to the plan>` trailer.
- A plan is cited by its number, linked to its folder; roadmap item numbers are retired (an
  old `roadmap.md#<order>` link points into the notes' `archive/`). Links to a decision use the
  row-key form from the repository root (`[D26](/products/reviewer2/layered-docs/2.reviewer2.constitution.md#D26)`;
  the citations skill, **Rows**).
- Write in the style of the layered-documentation-authoring skill; link decisions as the
  constitution skill describes.
