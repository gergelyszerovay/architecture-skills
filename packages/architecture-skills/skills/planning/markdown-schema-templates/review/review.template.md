<!-- TEMPLATE-ONLY: guide
// What a review of one implemented plan found, written once by the reviewer. It sits beside
// the plan and its notes: `review.md` for `plan.md`, `<artifact>.review.md` for
// `<artifact>.plan.md`. Its existence is the plan's status: a plan with a review is
// reviewed. Workflow: references/plans.md of the planning skill.
//
// Title: "Review of plan <nnnn>" and the plan's title.
//
// The text before the first section links the plan and its notes and names the commits (or
// the pull request) reviewed. A review that drafts a fix links the draft or the fix plan.
//
// Verdict: one line, first word group exactly one of
//   - `no findings`
//   - `findings`
//   - `findings, fix drafted` (a draft or a fix plan with `fixes:` takes them)
//   - `legacy` (a plan reviewed before reviews were files; its findings, if any, went into
//     later plans)
// then, optionally, a sentence after a colon. `check-planning` checks the line.
//
// Findings: one `###` per finding, with its severity, the place it is found, the failure
// scenario and the evidence. "None." when the verdict is `no findings` or `legacy`.
//
// Checks run: what the reviewer ran, with the result.
//
// The template is open: a review may add a section of its own.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Review of plan.md and its implementation notes, commits `abc1234..def5678`.

## Verdict

<!-- TEMPLATE-ONLY: freetext; required -->

no findings

## Findings

<!-- TEMPLATE-ONLY: freetext; required -->

None.

## Checks run

<!-- TEMPLATE-ONLY: freetext; required -->

- `test` passes in `packages/loans`.

## Notes

<!-- TEMPLATE-ONLY: freetext; optional -->

Nothing else.
