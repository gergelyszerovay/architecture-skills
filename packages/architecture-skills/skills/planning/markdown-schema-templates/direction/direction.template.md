<!-- TEMPLATE-ONLY: guide
// The direction log of a product or package group: agreements reached in discussion that are
// not yet a plan, a constitution decision or a skill rule. It is `direction.md` in the
// planning folder and binds by that name. Workflow: references/roadmap-and-direction.md of
// the planning skill, "The direction log".
//
// Title: the product's name and "direction log".
//
// The text before the first section says what the log is: that each row is one agreement,
// keyed so plans and drafts can cite it (`direction.md#A4`), what each status means and that
// the normative homes (constitution, plans, skills) stay what they are.
//
// Agreements: one row per agreement. ID: `A<n>`, never reused. Date: when it was agreed
// (YYYY-MM-DD). Direction: the agreement in a few sentences. Status: `agreed` (settled,
// waiting for its plan), `ideation` (direction, details open), `agreed / ideation` (both),
// `in plan <nnnn>` or `in plans <nnnn>–<nnnn>` (a written plan carries it),
// `implemented in plan <nnnn>` (or `plans`, with a range) once built, or `superseded`. A plan
// of another planning root (another product's) names that root before its number:
// `in plan lab 0012`, `implemented in plan lab 0009`.
// Where it goes: the constitution decision, plan, skill or step that takes it up.
//
// The template is open: a row's notes are a free `## A<n> notes` section after the table.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Agreed direction that is not yet a plan, a constitution decision or a skill rule: each row is one agreement, keyed so plans and drafts can cite it (`direction.md#A1`).

## Agreements

<!-- TEMPLATE-ONLY: guide
// Rows are appended, never renumbered.
-->

| ID  | Date | Direction | Status | Where it goes |
| --- | ---- | --------- | ------ | ------------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^A[1-9][0-9]*$`
Date: string; required; regex `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`
Direction: string; required
Status: string; required; regex `^(agreed|ideation|agreed / ideation|superseded|(implemented )?in plans? ([a-z][a-z0-9-]* )?[0-9]{4}(–[0-9]{4})?)$`
Where it goes: string; required
-->

| A1 | 2026-01-01 | Members borrow tools for a week at a time. | agreed | the loans plan |
