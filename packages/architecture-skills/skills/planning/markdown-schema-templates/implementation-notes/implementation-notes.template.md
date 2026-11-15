<!-- TEMPLATE-ONLY: guide
// What one implemented plan changed, written by the implementer when the work is done.
// It sits beside its plan: `implementation-notes.md` for `plan.md`, and
// `<artifact>.implementation-notes.md` for `<artifact>.plan.md`. Its existence is the
// plan's status: a plan with notes is implemented. Workflow: references/plans.md of the
// planning skill.
//
// Title: the plan's title. The text before the first section links the plan and names the
// commits or the pull request that implemented it.
//
// Evidence lives beside the notes, in `implementation-notes-screenshots/` (or
// `<artifact>.implementation-notes-screenshots/`), linked by relative path. Short CLI
// outputs and benchmarks go inline in fenced code blocks.
//
// The template is open: a plan may add a section of its own.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Notes for plan.md, implemented in pull request #1.

<!-- TEMPLATE-ONLY: guide
// What a user or a caller of the product sees now, one `###` per change. Each change shows
// its evidence: a screenshot, a CLI output, a benchmark. A change without visible effect
// (a refactor, an internal API) belongs under Technical changes.
-->

## Functional changes

<!-- TEMPLATE-ONLY: freetext; required -->

### The lender sees the due date

The loan page shows the due date under the borrower's name.

![The loan page with a due date](implementation-notes-screenshots/1-loan-page.png)

<!-- TEMPLATE-ONLY: guide
// How the code changed, by kind, one `###` per kind that applies. The usual kinds:
//   - API: new, changed or removed exports, endpoints, events, CLI commands and flags,
//     with the breaking ones marked;
//   - data: schemas, stored or exchanged formats, migrations;
//   - structure: packages, libraries and blocks added, moved or removed;
//   - dependencies: added, removed or upgraded, with the approval that allowed it;
//   - performance: optimizations and their measurements, before and after;
//   - configuration and tooling: build, lint, test and CI changes;
//   - decisions: constitution decisions added, changed or set active.
// Name declarations by package and symbol, not by file path.
-->

## Technical changes

<!-- TEMPLATE-ONLY: freetext; required -->

### API

`loans#Loan` gains `dueDate`; `loans#createLoan` requires it.

### Performance

None.

<!-- TEMPLATE-ONLY: guide
// The step 0 results and everything that turned out differently from the plan, each with
// why. The plan itself is corrected in place; this section keeps the record. Write "None."
// when the plan held.
-->

## Differences from the plan

<!-- TEMPLATE-ONLY: freetext; required -->

Step 0 found no loans without a lender, so decision 2 was not needed.

<!-- TEMPLATE-ONLY: guide
// What ran and with what result: the package checks, the journeys, the `validate-md` runs.
// A failure is reported with its output; a known baseline failure is named, not hidden.
-->

## Verification

<!-- TEMPLATE-ONLY: freetext; required -->

- `typecheck`, `lint` and `test` pass in `packages/loans`.

<!-- TEMPLATE-ONLY: guide
// Anything else worth keeping: findings, risks, follow-ups, candidates for the roadmap.
-->

## Additional notes

<!-- TEMPLATE-ONLY: freetext; optional -->

Overdue loans could be highlighted; added to the roadmap as deferred.
