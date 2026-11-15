<!-- TEMPLATE-ONLY: guide
// One authored doc per three.js package, in the package's own layered-docs
// tree (constitution D49). It holds only what neither the code nor the lib
// docs state: the package's boundaries, the packages it approves per layer
// beyond the profile's, exceptions to profile rules, and package-wide
// decisions. Exports, libs, blocks and the dependency graph are derivable and
// generated on demand; each lib's own doc covers the lib.
//
// Purpose, Origin, Run, Status, Structure and Open questions are optional here: they
// are the sections of a prototype doc (lab constitution D13), so a prototype doc
// rebinds to this template by gaining the sections that are required here.
//
// Title: the package name from package.json, e.g. `@scope/plasma`.
// Summary: what the package renders or simulates, in one sentence.
//
// Cross-section rules enforced by three-package.refine.ts:
//   - Boundaries.Concern values are unique.
//   - Approved Packages.Package values are unique.
//   - Rule Exceptions rows are unique by Rule and Where.
//   - Decisions.ID values are unique.
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
// What the package deliberately does NOT do, and who does instead: the host,
// another package, the browser. Owner: a package name, a symbol citation
// (the citations skill), or
// a short name such as `host` or `browser`.
-->

| Concern | Owner |
| ------- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Concern: string; required
Owner: string; required
-->

| Param panels, menus and command buttons | host |

## 2. Approved Packages

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Packages the package's blocks may import beyond what the profile's layers
// allow, each with its reason (constitution D8). The layer-packages rule
// reads this table.
// Package: a package pattern as in the profile's Allowed packages, e.g.
// `@scope/engine` or `@dimforge/rapier3d-compat`.
// Layers: the profile layers the approval covers, comma-separated.
-->

| Package | Layers | Reason |
| ------- | ------ | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Package: string; regex `^[@a-z0-9*][@a-z0-9*/._:-]*$`; required
Layers: string; regex `^(domain|shader|gpu|scene|runtime|utility|testing)(, (domain|shader|gpu|scene|runtime|utility|testing))*$`; required
Reason: string; required
-->

| @dimforge/rapier3d-compat | runtime | The physics vendor behind the physics gateway; its types stay out of public signatures. |

## 3. Rule Exceptions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Profile rules this package relaxes, each with its reason, so reviews can see
// them (constitution D59). The tool's own mechanism (an exclude) sits next to
// the row. Rule: a profile rule name. Where: the files or libs it covers.
-->

| Rule | Where | Reason |
| ---- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Rule: string; regex `^[a-z][a-z-]*$`; required
Where: string; required
Reason: string; required
-->

| block-allow-list | libs/legacy-effect | Kept as it was ported until its split into blocks. |

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

| D1 | The engine renders with WebGL only. | review | | |

## Open questions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Optional. What is still undecided.
-->

<!-- TEMPLATE-ONLY: freetext; optional -->

- Does the water need refraction?
