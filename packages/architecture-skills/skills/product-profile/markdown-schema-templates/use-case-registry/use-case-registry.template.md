<!-- TEMPLATE-ONLY: guide
// One per product (product-profile constitution D8, D19): every use case as
// a story-style header, the journey that is its main success scenario, and
// its extensions with the spec that covers each. The steps live only in the
// journey (`test.step` titles); walkthroughs are generated from it.
//
// Read a row as: "As <Actor>, I want to <Goal>, so that <Benefit>."
//
// Title: the product's name.
// Summary: the product's use cases at a glance, in one sentence.
//
// Cross-section rules enforced by use-case-registry.refine.ts:
//   - Use Cases.ID and Use Cases.Journey values are unique.
//   - Extensions.Use case names a row of Use Cases.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Use Cases

<!-- TEMPLATE-ONLY: guide
// ID: UC1, UC2, …, never renumbered or reused.
// Actor: a role from the permission matrix, or the audience from the brief.
// Goal: what the actor wants to do, starting with a verb.
// Benefit: why it matters to them.
// Journey: the slug of the journey spec that is the main success scenario.
-->

| ID  | Actor | Goal | Benefit | Journey |
| --- | ----- | ---- | ------- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^UC[1-9][0-9]*$`; required
Actor: string; required
Goal: string; required
Benefit: string; required
Journey: string; regex `^[a-z0-9][a-z0-9-]*$`; required
-->

| UC1 | member | borrow a drill | I can hang shelves without buying one | borrow-a-tool |

## 2. Extensions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Alternative and failure paths of a use case.
// Condition: when it happens. Outcome: what the actor experiences.
// Covered by: the slug of the spec that covers it (an end-to-end spec, or a
// unit spec cited as `<package>:<lib>#<slug>`), or `review`.
-->

| Use case | Condition | Outcome | Covered by |
| -------- | --------- | ------- | ---------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Use case: string; required
Condition: string; required
Outcome: string; required
Covered by: string; regex `^(review|[a-z0-9][a-z0-9-]*|(@[a-z0-9_-]+/)?[a-z0-9._-]+:[a-z0-9/._-]+#[a-z0-9][a-z0-9-]*)$`; required
-->

| UC1 | The tool is already lent out | The member is offered the next free date | tool-unavailable |
