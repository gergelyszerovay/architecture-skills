<!-- TEMPLATE-ONLY: guide
// One authored doc per Angular library, in the library's own layered-docs tree
// (constitution D28). It holds only what the code can't state: the library's
// responsibility, its boundaries, who owns which state, and local decisions.
// Exports, blocks, dependencies and provider scopes are derivable and are
// generated on demand; scenarios and invariants live in the specs. Don't
// repeat any of them here.
//
// Title: the library's directory name, e.g. `file-browser`.
// Summary: the library's responsibility in one sentence.
//
// Cross-section rules enforced by angular-lib.refine.ts:
//   - Boundaries.Concern values are unique.
//   - State Ownership.State values are unique.
//   - Decisions.ID values are unique.
-->

# <!-- TEMPLATE-ONLY: string; regex `^[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Identity

<!-- TEMPLATE-ONLY: guide
// Role: the library's role in the architecture. A directory name alone doesn't
// establish a role (constitution D2).
-->

- Role: <!-- TEMPLATE-ONLY: enum: shell | composition | capability | data-access | domain | ui | utility | infrastructure | testing; required -->

## 2. Boundaries

<!-- TEMPLATE-ONLY: guide
// What this library deliberately does NOT do, and who does it instead. List the
// concerns a reader would plausibly expect here but find elsewhere.
// Owner: a library id, a symbol citation (the citations skill: `<package>:<lib>#Symbol`, or
// `<package>:<lib>#/Symbol` for a lib-private declaration), or
// `backend` / `browser` for concerns outside the frontend.
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Fetching file content | `@scope/app:data-lib#ReadContentCommand` |

## 3. State Ownership

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// State this library holds that no TSDoc tag declares, and its single owner
// (constitution D15): typically a facade's presentation or derived state and
// a UI block's local state. A store's state is declared by its `@owns` tag
// and appears in the library's dynamic view; don't list it here (one home
// per fact, constitution D26). Omit the section when every piece of state is
// tagged.
// Kind: authoritative (the one source), derived (computed from another row),
// draft, cache, or presentation (local visual state such as expanded rows).
// Owner: a symbol citation: `<package>:<lib>#Symbol` for an exported
// declaration, `<package>:<lib>#/Symbol` for a lib-private one.
// Notes: optional; for derived state, what it derives from.
-->

| State | Kind | Owner | Notes |
| ----- | ---- | ----- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
State: string; required
Kind: enum: authoritative | derived | draft | cache | presentation; required
Owner: string; regex `^[@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*$`; required
Notes: string; optional
-->

| Selected path | presentation | `@scope/app:feature#FeatureFacade` | |

## 4. Decisions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Local decisions a reader couldn't infer from the code, in the constitution's
// entry format. IDs are D1, D2, …, never renumbered or reused.
// Checked by: `tool:<rule>`, `test`, or `review`, comma-separated.
// Status: empty (active) or `pending` for a decision not yet built.
// Why: the reason, when it isn't obvious from the decision; for a pending
// decision, the plan that builds it.
-->

| ID  | Decision | Checked by | Status | Why |
| --- | -------- | ---------- | ------ | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^D[1-9][0-9]*$`; required
Decision: string; required
Checked by: string; regex `^(review|test|tool:[a-z0-9-]+)(, (review|test|tool:[a-z0-9-]+))*$`; required
Status: enum: active | pending; default=active
Why: string; optional
-->

| D1 | The tree scrolls natively instead of through a scroll-area component. | review | | |
