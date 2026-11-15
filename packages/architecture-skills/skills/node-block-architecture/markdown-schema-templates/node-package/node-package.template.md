<!-- TEMPLATE-ONLY: guide
// One authored doc per Node package, in the package's own layered-docs tree
// (constitution D38). It holds only what neither the code nor the lib docs
// state: the package's boundaries, the packages approved inside the hexagon,
// exceptions to profile rules, package-wide decisions, and the context map of
// its features. Binaries, the
// library graph, composition wiring and bridges are derivable and generated
// on demand; each library's own doc covers the library.
//
// Purpose, Origin, Run, Status, Structure and Open questions are optional here: they
// are the sections of a prototype doc (lab constitution D13), so a prototype doc
// rebinds to this template by gaining the sections that are required here.
//
// Title: the package name from package.json, e.g. `@scope/app-backend`.
// Summary: what the package does, in one sentence.
//
// Cross-section rules enforced by node-package.refine.ts:
//   - Boundaries.Concern values are unique.
//   - Approved Packages.Package values are unique.
//   - Decisions.ID values are unique.
//   - Contexts.Context values are unique.
-->

# <!-- TEMPLATE-ONLY: string; regex `^(@[a-z0-9_-]+/)?[a-z0-9._-]+$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## Purpose

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// What the prototype tries out and for whom, in a short paragraph.
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

A page that tries a shader water surface on the block terrain.

## Origin

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Where the idea came from: the artifact it was made from, as a relative link to its page
// (`../../../artifacts/<artifact>/index.html`), or the word "None".
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

[blockland](../../../artifacts/blockland/index.html)

## Run

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The `pnpm` commands that run the prototype and its URL, `https://<name>.<lab>.localhost`
// for an app. Never a port number: portless names the URL (lab constitution D30).
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

`pnpm --filter blockland dev` serves https://blockland.lab.localhost.

## Status

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// State: exploring (trying an idea), working (it does what the Purpose says) or parked
// (left as it is). Note: one sentence on where it stands.
-->

- State: <!-- TEMPLATE-ONLY: enum: exploring | working | parked; optional -->
- Note: <!-- TEMPLATE-ONLY: string; optional; regex `^[^\n]{10,300}$` -->

## Structure

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Optional. The libs and what each holds, once there is more than one.
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

`libs/terrain` generates the island; `libs/water` holds the shader.

## 1. Boundaries

<!-- TEMPLATE-ONLY: guide
// What the package deliberately does NOT do, and who does instead: another
// package, a client, the platform. Owner: a package name, a symbol citation
// (the citations skill),
// or a short name such as `client` or `platform`.
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Rendering the UI | `@scope/app-frontend` |

## 2. Approved Packages

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Packages that code inside the hexagon may import beyond what the profile's
// layers allow, each with its reason (constitution D5). The layer-packages
// rule reads this table.
// Package: a package pattern as in the profile's Allowed packages, e.g.
// `@scope/shared-types` or `node:crypto`.
// Layers: the profile layers the approval covers, comma-separated.
-->

| Package | Layers | Reason |
| ------- | ------ | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Package: string; regex `^[@a-z0-9*][@a-z0-9*/._:-]*$`; required
Layers: string; regex `^[a-z][a-z-]*(, [a-z][a-z-]*)*$`; required
Reason: string; required
-->

| @scope/shared-types | domain, application | Types-only vocabulary shared with the client. |

## 3. Rule Exceptions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Profile rules this package relaxes, each with its reason, so reviews can see
// them (constitution D34). Rule: a profile rule name. Where: the files or
// libraries the exception covers.
-->

| Rule | Where | Reason |
| ---- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Rule: string; regex `^[a-z][a-z-]*$`; required
Where: string; required
Reason: string; required
-->

| block-placement | libs/legacy | Kept in its pre-migration layout until the scoped move. |

## 4. Decisions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Package-wide decisions a reader couldn't infer from the code, in the
// constitution's entry format. IDs are D1, D2, …, never renumbered or reused.
// Status: empty (active) or `pending` for a decision not yet built.
// A dependency rule of the package is no config of its own: it is a profile row,
// or an Approved Packages row read by `layer-packages` (a decision checked by
// `tool:layer-packages`).
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

| D1 | One process serves one tenant. | review | | |

## 5. Contexts

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The bounded contexts the features are grouped by (constitution D52): one row
// per `libs/<context>/` directory, naming the other contexts its libraries may
// import and its bridges may connect to (D53). The context-access rule reads
// this table. `libs/shared/` is not a context and has no row. Omit the section
// for a flat `libs/`.
// Context: the directory name. May depend on: context names, comma-separated,
// or `none`.
-->

| Context | May depend on | Why |
| ------- | ------------- | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Context: string; key; regex `^[a-z0-9][a-z0-9-]*$`; required
May depend on: string; regex `^(none|[a-z0-9][a-z0-9-]*(, [a-z0-9][a-z0-9-]*)*)$`; required
Why: string; required
-->

| sales | catalog | Checkout prices its lines through a bridge to a catalog use case. |

## Open questions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Optional. What is still undecided.
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

- Does the water need refraction?
