<!-- TEMPLATE-ONLY: guide
// One authored doc per lib of a three.js package, in the lib's own
// layered-docs tree (constitution D48). It holds only what the code can't
// state: the lib's role, its responsibility, its boundaries, the resources it
// owns that no TSDoc tag declares, and local decisions. Exports, blocks and
// dependencies are derivable and generated on demand; `@owns` and `@cleanup`
// tags declare what one block creates; scenarios and invariants live in the
// specs. Don't repeat any of them here.
//
// Title: the lib's directory name under libs/, e.g. `plasma-effect`.
// Summary: the lib's responsibility in one sentence.
//
// Cross-section rules enforced by three-lib.refine.ts:
//   - Boundaries.Concern values are unique.
//   - Owned Resources.Resource values are unique.
//   - Decisions.ID values are unique.
-->

# <!-- TEMPLATE-ONLY: string; regex `^[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Identity

<!-- TEMPLATE-ONLY: guide
// Role: the lib's role in the architecture (constitution D12); the
// library-roles rule reads it. A directory name alone doesn't establish a role.
-->

- Role: <!-- TEMPLATE-ONLY: enum: domain | render-kit | runtime | engine | utility | testing; required -->

## 2. Boundaries

<!-- TEMPLATE-ONLY: guide
// What this lib deliberately does NOT do, and who does it instead. List the
// concerns a reader would plausibly expect here but find elsewhere.
// Owner: a lib id (`plasma-domain`), a symbol citation (the citations skill: `<package>:<lib>#Symbol`,
// or `<package>:<lib>#/Symbol` for a lib-private declaration), a package
// name, or `host` for what the hosting app does.
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Clamping params | plasma-domain |

## 3. Owned Resources

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Resources this lib owns that no single block's `@owns` declares
// (constitution D18): shared GPU resources and caches several blocks use, with
// the block that creates them and the one that disposes them. What one block
// creates and releases is in its `@owns` and `@cleanup` tags; don't list it
// here (one home per fact, constitution D46). Omit the section when there is
// nothing else, as in most libs.
// Owner and Disposer: symbol citations of the creating and the disposing
// block (often the same).
// Notes: optional; for a cache, its key and when an entry is evicted.
-->

| Resource | Owner | Disposer | Notes |
| -------- | ----- | -------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Resource: string; required
Owner: string; regex `^[@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*$`; required
Disposer: string; regex `^[@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*$`; required
Notes: string; optional
-->

| Toon materials by colour | `@scope/game:toon-kit#ToonMaterialCache` | `@scope/game:toon-kit#ToonMaterialCache` | |

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

| D1 | The palette texture is rebuilt only when the palette param changes. | test | | |
