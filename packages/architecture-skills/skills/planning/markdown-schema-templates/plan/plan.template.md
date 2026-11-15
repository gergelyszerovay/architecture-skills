<!-- TEMPLATE-ONLY: guide
// One plan: what a change delivers and how it is built, written before the
// change and closed by a separate `implementation-notes.md` beside it (the
// `implementation-notes` template); a plan with notes is implemented, so the plan
// states no status. Workflow: references/plans.md of the planning skill.
//
// The template is open and unordered: it declares the sections a plan usually
// has and accepts any other `##` section a plan needs (parsed as free text under
// its heading). A small plan stays small; the workflow asks more of a new plan
// than the template enforces, and `check-planning` and a review check it.
//
// Frontmatter (optional, before the title, written once by the plan's author): `after: [0082]`
// names the plans whose notes must exist before this one starts, and `fixes: 0084` the plan a
// review's fix draft repairs. No other key.
//
// Title: what the plan does, as a name.
//
// The first sentence, before any section, tells the implementer to follow the
// planning skill and names the closing duties: step 0 first, the implementation
// notes, and a link to the plan from every implementation commit. It also says
// that documents may have changed with the plan, and how to see those changes.
//
// Sections (all free text; bodies may hold tables, lists and code):
//   - Scope: what the plan delivers, the issues it fixes (links into its
//     `issues/` folder), whether it runs in fast-forward mode, what it depends
//     on, the approvals it needs, and its step 0 (reconcile the plan with the
//     current code before implementing).
//   - Architecture and skills: a table of the packages the plan changes, what
//     each is bound to and the skills to load, then the rules the plan touches.
//   - Context: why the plan exists, and the current state it starts from.
//   - Decisions: the choices the plan makes, numbered.
//   - Documentation: every document the plan changes, in two lists. Written with
//     this plan: the target documents already changed in place with the plan (a
//     region document, a pending decision, a use case), linked, so plan-history
//     finds them. Updated by the implementation: what only the implementer can
//     write (TSDoc, lib and package docs, decisions set active).
//   - Risks to check: what the change could get wrong that a review would
//     otherwise find late: every input that does not come from the person (a
//     file in the served repository, a report, an Origin, a branch name), every
//     walk or watch over a whole tree, every cost paid per tab or per request.
//     One item each, with what the implementation must show (a check, a bound,
//     a spec). The implementer handles each before the review; the reviewer
//     starts from the list.
//   - Out of scope: what the plan leaves alone on purpose.
//   - Verification: the checks that show the plan is done.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open; unordered -->

Implement this plan by the rules of the `planning` skill (`references/plans.md`): do step 0
first, close with `implementation-notes.md`, and link this plan from every implementation
commit. The documents under **Written with this plan** were changed together with the plan;
the skill's `plan-history` script shows each one's original and planned state.

## Scope

<!-- TEMPLATE-ONLY: freetext; optional -->

This plan builds one thing.

## Architecture and skills

<!-- TEMPLATE-ONLY: freetext; optional -->

| Package or area | Binding | Skills              |
| --------------- | ------- | ------------------- |
| `packages/core` | none    | source-organization |

## Context

<!-- TEMPLATE-ONLY: freetext; optional -->

Why the plan exists.

## Decisions

<!-- TEMPLATE-ONLY: freetext; optional -->

1. A decision.

## Documentation

<!-- TEMPLATE-ONLY: freetext; optional -->

**Written with this plan:**

- the region document gains R3.

**Updated by the implementation:**

- TSDoc on the new blocks, and the package doc.

## Risks to check

<!-- TEMPLATE-ONLY: freetext; optional -->

- A file the plan reads from the served repository: read only inside its root, by real path.

## Out of scope

<!-- TEMPLATE-ONLY: freetext; optional -->

- What the plan leaves alone.

## Verification

<!-- TEMPLATE-ONLY: freetext; optional -->

- The checks pass.
