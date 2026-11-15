<!-- TEMPLATE-ONLY: guide
// One per region whose behaviour needs more than the one line the information
// architecture gives it (product-profile constitution D29): what the user sees
// and does there, and why it behaves that way. Named
// `2.<group>.<place>.<region>.region.md` in the group's layered-docs tree.
//
// The document is the region's single home for requirements. Code doesn't
// restate them: every declaration that implements part of the region carries
// `@region <place>/<region>` in its TSDoc, and a part of a component's template
// that is the region carries `data-region="<region>"`. Specs cite the rows they
// check (`<doc>#R2`) in their metadata.
//
// Every row is keyed, and the keys are unique across the document, so plans,
// issues, specs and code can cite a single row: S for structure, T for
// states, I for interactions, R for rules, L for limits, W for messages. A rule about structure can be
// checked by a journey's ARIA snapshot of the Structure rows.
//
// Title: the region's ID, `<place>/<region>`, as in the information
// architecture.
// Summary: what the user does in the region, in one sentence.
//
// A row of another document is cited by a link to the row, never in prose:
// `[I5](./2.<group>.<place>.<region>.region.md#I5)` for another region,
// `[N3](./2.<group>.information-architecture.md#N3)` for the navigation. The
// manifest's reference check then reports a renamed or removed row.
//
// The template is open: a region may add a section of its own, such as Open
// questions while its design is being settled.
-->

# <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$` -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: document; open -->

## Structure

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The region's element tree, one row per kind of element, parents before
// children. It is the accessibility tree: what a journey's ARIA snapshot
// (Playwright `toMatchAriaSnapshot`) can check.
// Element: what it is, in the product's vocabulary.
// Role: its ARIA role and accessible name as the user agent exposes them
// (`combobox "Revision"`, `treeitem`), or `none` for a purely visual element.
// Parent: the S key of the element it sits in (several, comma-separated, when
// it appears under more than one kind), or `—` at the top.
// Shows: its label or content.
// Layout: only constraints that are requirements (a fixed size, no reflow,
// truncation, an overlay), each naming the rule that gives its reason, or `—`.
// Styling that needs no reason (spacing, colours, fonts) stays in the code. A
// placement worth stating uses the words a derived wireframe reads: `in a row`
// (beside its siblings), `below`, `above`, `fills`, `over the …` (an overlay),
// `at the right edge`; `—` stacks the element under its parent in row order.
// Selecting it: what happens when the user picks it, or `—`.
// The order of children is a rule, not a column.
-->

| ID  | Element | Role | Parent | Shows | Layout | Selecting it |
| --- | ------- | ---- | ------ | ----- | ------ | ------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^S[1-9][0-9]*$`
Element: string; required
Role: string; required
Parent: string; required; regex `^(—|S[1-9][0-9]*(, S[1-9][0-9]*)*)$`
Shows: string; required
Layout: string; required
Selecting it: string; required
-->

| S1 | tool list | `list "Tools"` | — | the tools | — | — |

## States

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Every state the region can be in, such as first load, refreshing, empty,
// error and stale, and what it shows then, including whether its size may
// change.
// Shows cites, by S key, every element of the region the state changes, at
// least one (product-profile constitution D35): an in-page link (`[S4](#S4)`),
// a key in parentheses or a list (`the trigger (S2) keeps its size`,
// `(S2, S3)`) or a bare key (`S4`). A state that replaces or changes the whole
// region, such as first load, nothing picked or an error in place of the
// content, cites the region's root, the Structure row with Parent `—`. A state
// whose text comes from another document still cites its own element that
// shows it.
// A link to another document's row names that document's row, never an
// element of this region: a cross-region state cites both, the other row by
// its link and its own element by its key. A range (`S2 to S5`) names its two
// ends only, so list each element the state changes, or cite their common
// parent when the state changes the subtree as a whole. A key in a code span
// is quoted, not cited: don't write one there. A derived state matrix reads
// these keys, not words: an element named in words only has no row in it.
-->

| ID  | State | Shows |
| --- | ----- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^T[1-9][0-9]*$`
State: string; required
Shows: string; required; regex `(^|[\s(,])#?S[1-9][0-9]*\b`
-->

| T1 | first load | the list's frame (S1) with a spinner inside it |

## Interactions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Every input the region handles (pointer, keyboard, typing) and its effect.
-->

| ID  | Input | Effect |
| --- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^I[1-9][0-9]*$`
Input: string; required
Effect: string; required
-->

| I1 | Enter on a tool | opens the tool |

## Rules

<!-- TEMPLATE-ONLY: guide
// The requirements: ordering, limits, paging, sizes, anything a change must
// keep. Why: the reason, so a later change can tell whether it still holds.
// Checked by: `spec` (a unit spec citing the row), `journey`, `visual` (a
// screenshot in the implementation notes of the plan that built it) or
// `review`.
// Topic: optional; a short noun for what the rule governs (drawing,
// keyboard, selection, operations, read-only, paging), so a view can fold the
// rules by it; rules without one are listed last. Leave the column out, or a
// cell empty, when the rules need no folding.
-->

| ID  | Rule | Why | Checked by | Topic |
| --- | ---- | --- | ---------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^R[1-9][0-9]*$`
Rule: string; required
Why: string; required
Checked by: enum: spec | journey | visual | review; required
Topic: string; optional; regex `^([a-z][a-z -]{0,23})?$`
-->

| R1 | Tools are listed by name. | Members look tools up by name. | spec | order |

## Limits

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The numbers the region keeps, each the home of a constant in code. Limit:
// what is bounded. Value: the number with its unit, as the code declares it.
// Why: the reason. A rule that depends on the number cites the L row.
-->

| ID  | Limit | Value | Why |
| --- | ----- | ----- | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^L[1-9][0-9]*$`
Limit: string; required
Value: string; required
Why: string; required
-->

| L1 | tools per group, first page | 20 | Most groups fit; long ones stay scannable. |

## Messages

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The copy the region shows. When: the state or action the text belongs to.
// Text: the copy, exact. A Shows cell or a States row cites the W row instead
// of quoting the text.
-->

| ID  | When | Text |
| --- | ---- | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^W[1-9][0-9]*$`
When: string; required
Text: string; required
-->

| W1 | the list is empty | No tools on the shelf |

## Limitations

<!-- TEMPLATE-ONLY: freetext; optional -->

What the region deliberately doesn't do yet, with the roadmap item that will.

<!-- TEMPLATE-ONLY: guide
// A sketch, a picture, or screenshots once it is built. A region's view
// derives a wireframe from the Structure rows and shows the sketch beside it,
// so a sketch is kept only while it says more than the derived one. Its
// elements carry their Structure keys in brackets, `[S4]`, so the sketch and
// the table name the same thing.
-->

## Wireframes

<!-- TEMPLATE-ONLY: freetext; optional -->

A sketch, a picture, or screenshots once it is built.
