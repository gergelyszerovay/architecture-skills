<!-- TEMPLATE-ONLY: guide
// One authored doc per Angular application package, in the package's own
// layered-docs tree (constitution D27). It holds only what neither the code
// nor the lib docs state: the application's boundaries, why providers live at
// their scopes, exceptions to profile rules, and package-wide decisions. The
// route map, the lib graph and which containers each page composes are
// derivable and generated on demand; each lib's own doc covers the lib.
//
// Purpose, Origin, Run, Status, Structure and Open questions are optional here: they
// are the sections of a prototype doc (lab constitution D13), so a prototype doc
// rebinds to this template by gaining the sections that are required here.
//
// Title: the package name from package.json, e.g. `@scope/app-frontend`.
// Summary: what the application does, in one sentence.
//
// Cross-section rules enforced by angular-app.refine.ts:
//   - Boundaries.Concern values are unique.
//   - Provider Scopes.Provider values are unique.
//   - Decisions.ID values are unique.
//   - Approved Packages.Package values are unique.
//   - Contexts.Context values are unique.
//   - Vendor Roots.Directory and Vendor Roots.Package values are unique.
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
// What the application deliberately does NOT do, and who does instead: a
// backend, another package, the browser. Owner: a package name, `backend`,
// `browser`, or a symbol citation (the citations skill).
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Classifying file roles | backend |

## 2. Provider Scopes

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Providers whose scope isn't the obvious default, and why (constitution D16,
// D40). Provider: a symbol citation. Scope: where it is provided.
-->

| Provider | Scope | Why |
| -------- | ----- | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Provider: string; regex `^[@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*$`; required
Scope: enum: app | route | component | operation; required
Why: string; required
-->

| `@scope/app:data#DataRealtime` | app | The subscription lives as long as the one page that shows it. |

## 3. Rule Exceptions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Profile rules this package relaxes, each with its reason, so reviews can see
// them (constitution D25). Rule: a profile rule name. Where: the files or
// libraries the exception covers.
-->

| Rule | Where | Reason |
| ---- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Rule: string; regex `^[a-z][a-z-]*$`; required
Where: string; required
Reason: string; required
-->

| layer-packages | libs/shared/charts | Adopted gradually: the rule runs at warn severity for the chart wrappers until the charting package's Approved Packages row covers their layers. |

## 4. Decisions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Package-wide decisions a reader couldn't infer from the code, in the
// constitution's entry format. IDs are D1, D2, …, never renumbered or reused.
// Status: empty (active) or `pending` for a decision not yet built.
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

| D1 | One WebSocket carries every query, mutation and subscription. | review | | |

## 5. Approved Packages

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Packages that blocks may import beyond what the profile's layers allow, each
// with its reason (constitution D14, D22). The layer-packages rule reads this
// table with `approved=package-doc`.
// Package: a package pattern as in the profile's Allowed packages, e.g.
// `@scope/shared-kernel`.
// Layers: the profile layers the approval covers, comma-separated.
-->

| Package | Layers | Why |
| ------- | ------ | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Package: string; key; required
Layers: string; required
Why: string; required
-->

| `@scope/shared-kernel` | domain, state | The constants the backend and the browser share. |

## 6. Contexts

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The bounded contexts the libraries are grouped by (constitution D44): one row
// per `libs/<context>/` directory, naming the other contexts its libraries may
// import. The context-access rule reads this table. Shared and places
// directories are not contexts and have no row. Omit the section for a flat
// `libs/`.
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

| source | manifest, declarations | The editor marks declarations and reads the replica. |

## 7. Vendor Roots

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Vendored kits kept in their upstream layout inside the package, each a
// vendor root (constitution D50): a directory under the libs root that every
// tool treats as the package its imports name, never as libraries of this
// one. An import into it is judged by layer-packages against the Approved
// Packages table and by nothing else; its files are skipped by every rule;
// it imports packages, never a library of this package. The profile's
// library-roles row reads this table with `vendor-roots=package-doc`, and the
// checkers and ESLint skip the directory. A vendor root never
// appears in the Rule Exceptions table.
// Directory: the root, written from the package root (`libs/ui`).
// Package: the package name its imports use (`@spartan-ng/helm` for
// `@spartan-ng/helm/button`).
// Owner: the tool that writes its files.
-->

| Directory | Package | Owner | Why |
| --------- | ------- | ----- | --- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Directory: string; key; regex `^[a-z0-9._-]+(/[a-z0-9._-]+)*$`; required
Package: string; regex `^(@[a-z0-9_-]+/)?[a-z0-9._-]+$`; required
Owner: string; required
Why: string; required
-->

| libs/ui | @spartan-ng/helm | the spartan-ng CLI (`components.json`) | The helm components, generated in spartan's layout and imported as `@spartan-ng/helm/<component>`. |

## Open questions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Optional. What is still undecided.
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

- Does the water need refraction?
