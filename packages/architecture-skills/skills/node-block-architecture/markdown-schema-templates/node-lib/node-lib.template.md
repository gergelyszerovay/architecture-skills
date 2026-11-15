<!-- TEMPLATE-ONLY: guide
// One authored doc per library (feature or shared) of a Node package, in the
// library's own layered-docs tree (constitution D37). It holds only what the
// code can't state: the library's responsibility, its boundaries, the records
// it owns, and local decisions. The library's role follows from its path
// (constitution D7); exports, blocks, dependencies, bridges and composition
// wiring are derivable and generated on demand; scenarios and invariants live
// in the specs. Don't repeat any of them here.
//
// Title: the library's directory name under libs/, e.g. `orders`,
// `shared/trpc` for a shared library, or `<context>/<feature>` once the
// package groups its features by context (constitution D52), e.g.
// `sales/orders` or `sales/shared-pricing`.
// Summary: the library's responsibility in one sentence.
//
// Cross-section rules enforced by node-lib.refine.ts:
//   - Boundaries.Concern values are unique.
//   - Owned Records.Record values are unique.
//   - Decisions.ID values are unique.
//   - Areas.Area values are unique.
-->

# <!-- TEMPLATE-ONLY: string; regex `^([a-z0-9][a-z0-9-]*/)?[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Boundaries

<!-- TEMPLATE-ONLY: guide
// What this library deliberately does NOT do, and who does it instead. List
// the concerns a reader would plausibly expect here but find elsewhere.
// Owner: a library id (`catalog`, `shared/trpc`), a symbol citation
// (the citations skill: `<package>:<lib>#Symbol`, or `<package>:<lib>#/Symbol` for a lib-private
// declaration), a package name, or `composition` for wiring done in `app/`.
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Pricing products | catalog |

## 2. Owned Records

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Records this library owns and is the only code to write (constitution D11)
// that code doesn't declare: tables, collections, files and external cache
// keys. In-process state is declared by its `.state.ts` block's `@owns`,
// `@lifetime` and `@cleanup` tags and appears in the library's dynamic view;
// don't list it here (one home per fact, constitution D35). Omit the section
// when there is nothing else, as in most shared libraries.
// Kind: table, collection, file, or cache (derived data kept outside the
// process for speed, with an invalidation rule).
// Writer: a symbol citation of the one block that writes it: a repository,
// gateway or state block.
// Notes: optional; for a cache, its key and invalidation rule.
-->

| Record | Kind | Writer | Notes |
| ------ | ---- | ------ | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Record: string; required
Kind: enum: table | collection | file | cache; required
Writer: string; regex `^[@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*$`; required
Notes: string; optional
-->

| Orders | table | `@scope/app:orders#makeOrderStoreRepository` | |

## 3. Decisions

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

| D1 | Orders are never deleted, only cancelled. | test | | Invoices reference them. |

## 4. Areas

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The area directories of a large feature (constitution D58): one row per
// `core/<area>/` directory, naming the use cases, flows and steps it holds and
// what it owns. An area is documentation inside one hexagon, not a boundary;
// no rule reads this table yet. Omit the section when `core/` has no areas.
// Area: the directory name under `core/`. Use cases and flows: their names,
// comma-separated, or a short description of the group. Owns: the state or
// records the area keeps, or `nothing`.
-->

| Area | Use cases and flows | Owns |
| ---- | ------------------- | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Area: string; key; regex `^[a-z0-9][a-z0-9-]*$`; required
Use cases and flows: string; required
Owns: string; required
-->

| checkout | place-order, price-order-lines | nothing |
