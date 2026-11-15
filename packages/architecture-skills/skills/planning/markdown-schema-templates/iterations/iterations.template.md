<!-- TEMPLATE-ONLY: guide
// One per product or package group: the plans grouped into iterations.
// Workflow: references/roadmap-and-direction.md of the planning skill.
//
// Title: the product's name and "iterations". The text between the title and
// the first section is the preamble: where plans and iteration folders live.
//
// The template is open: after the overview, each iteration has a `##` section
// of its own (`## Iteration <nnnn>: <theme>`), free text accepted as is.
//
// Iterations: one row per iteration.
//   Iteration: its four-digit ID, cited as `iterations.md#<id>`.
//   Status: done, current or planned; at most one iteration is current.
//   Theme: what the iteration is about. Plans: the plan numbers, `0006, 0007`
//   or `0008–0013`. Working documents: links to the iteration's folder and
//   documents, or "none".
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

## Iterations

<!-- TEMPLATE-ONLY: row; min-rows: 1
Iteration: string; key; regex `^[0-9]{4}$`
Status: enum: done | current | planned; required
Theme: string; required
Plans: string; required
Working documents: string; required
-->

| Iteration | Status  | Theme         | Plans     | Working documents |
| --------- | ------- | ------------- | --------- | ----------------- |
| 0001      | current | a first theme | 0001–0002 | none              |
