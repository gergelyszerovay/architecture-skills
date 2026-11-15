# Grouping: contexts, contracts, places and shared code

The block architectures share one way of grouping code on top of their block suffixes. This
page explains it once. It decides nothing: each architecture's constitution states the
rules it adopts, in its own words and with its own IDs, and its profile selects the rules
below with its own role names. Cite the constitution, not this page, when a rule is broken.

## Two axes

- **Horizontal: what a piece of code is.** Block suffixes, layers and library roles
  (`.store.ts`, `domain`, `capability`, `feature`). The profile's block, layer and role
  tables, checked by `block-allow-list`, `layer-packages` and `library-roles`.
- **Vertical: which part of the product it serves.** A **context** is a bounded context:
  one vocabulary and one set of owned records, changed for one set of reasons. Code of one
  context imports another context's code only where the context map allows it.

The horizontal axis alone lets any capability import any other; the vertical axis alone
lets a component reach a database. Together they keep a growing package readable: a
reader finds the part of the product first, then the kind of code.

## The unit at each scale

The axis is the same everywhere; what it groups differs.

| Scale           | Unit grouped            | Where the context lives | Context map                                             | Rule                 |
| --------------- | ----------------------- | ----------------------- | ------------------------------------------------------- | -------------------- |
| Inside package  | libraries (or features) | `libs/<context>/<lib>`  | the package doc's Contexts table                        | `context-access`     |
| Across packages | packages                | the package itself      | the product group's package table (`product-group` doc) | `package-allow-list` |

A package uses the inside scale when its own library graph needs grouping. A package that
is itself one context (a kit of a few libraries, a tool with one capability) leaves `libs/`
flat: a flat `libs/` is one implicit context and passes `context-access` unchanged, and its
place in the product is a row of the group's package table.

The Contexts table names, per context, the other contexts its code may depend on, with a
reason. Every context directory has a row; `shared/` and the places directory have none.

## The contract surface

A context offers other contexts less than it offers the code that assembles it. Each
architecture draws that line its own way:

- a **rule over the one public entry**, checked by `contract-only` by symbol: a library of
  the contract roles offers its peers only the declarations of the listed blocks from its
  `src/index.ts`, and libraries of the index roles import anything it exports (a separate
  contract entry, `contract=`, is the file-level form of the same rule);
- **no direct imports at all**: the units never import each other, and code outside them
  connects them (a bridge in the composition root implementing one unit's port with
  another's use case); the context map then constrains the connections, not the imports;
- **tiered package entries**: a host tier with plain data and a kit tier with the
  framework's types; another package depends on the tier it needs.

## Places

A **place** is where several contexts meet for one purpose (a routed screen, a pane, a
binary). Its code assembles the contexts and may import any of them; nothing imports it
back. A place is the only code that sees more than one context's full surface. An
architecture may keep beside its places a composition unit that two places share and that
is not a place itself: the Angular architecture's `libs/places/` also holds the composition
library the shell and a lazily loaded place both import, with no route, page or facade
(angular-block-architecture D53).

## Shared code

- `libs/shared/` is where the architectures put what two or more contexts use and no
  context owns (neutral models, pure rules, presentation primitives, infrastructure ports);
  `context-access` keeps shared code to shared imports.
- An architecture may also let a context hold its own shared libraries for what only its
  units use (node-block-architecture D52).
- When code moves to shared, and what may never move there, is each architecture's decision:
  node-block-architecture D10 (promoted once a second feature needs it, no owned data), and
  the Angular `references/architecture.md` ("Library roles and permitted dependencies").

## Infrastructure

An **infrastructure** unit provides a cross-cutting service every place needs (keys,
notices, theme, clipboard, a clock, a file system) behind tokens or ports. Where it lives and
what it may depend on are the architecture's decisions: angular-block-architecture D46 (the
`infrastructure` role under `shared/`), node-block-architecture D8 and D10 (shared
infrastructure ports).

## Vendor roots

A **vendor root** is a kit vendored into the package in its upstream layout (spartan-ng's
helm components in an Angular `libs/ui`, generated by its CLI and imported as
`@spartan-ng/helm/<component>`). It is a package that sits in the tree, not part of the
grouping: no context, no library, no role. Every tool treats it as the package its imports
name, so an import into it is judged only as a dependency on that package, the edges inside
it are not judged, and it imports packages, never a library of the package that hosts it.
The package doc's Vendor Roots table names it once, and the `library-roles` row's
`vendor-roots=package-doc` makes every tool read the table (angular-block-architecture D50;
the Node and three.js architectures have none yet).

## What each architecture maps them to

| Concept          | angular-block-architecture                                                                                        | node-block-architecture                                                                                 | three-block-architecture                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Scale            | libraries inside the app package                                                                                  | features inside a package                                                                               | packages across the product group                    |
| Context          | `libs/<context>/` (D44)                                                                                           | `libs/<context>/` (D52)                                                                                 | the package (D62)                                    |
| Context map      | Contexts table of the `angular-app` doc                                                                           | Contexts table of the `node-package` doc                                                                | the product group's package table                    |
| Contract surface | the listed blocks of `src/index.ts`, judged by symbol (D45)                                                       | none: features never import features (D7); bridges in `app/` connect them (D9, D53)                     | host tier `.` and kit tier `./kit` (D2, D6)          |
| Places           | `libs/places/`, composition libraries with one facade (D47), and the one a lazy place shares with the shell (D53) | `app/`, the composition root with its bridges and binaries (D26)                                        | a composition engine over other packages' kits (D6)  |
| Shared           | `libs/shared/`; roles from lib docs                                                                               | `libs/shared/` and a context's `shared` or `shared-<name>` libraries; role from the path (D7, D10, D52) | a shared kit package (an engine package of your own) |
| Infrastructure   | the `infrastructure` role (D46)                                                                                   | shared infrastructure ports (D8, D10)                                                                   | none                                                 |

The IDs are each skill's own constitution decisions.

## Profile rows

The tools know no role names: a profile row names every role a rule needs
([rules.md](rules.md)).

- `library-roles` with `role-source=context-path` gives each library a role from its path:
  `default-role` for a library of a context (or a flat `libs/`), `places-role` under
  `places-dir`, and `shared-role` under `shared-dir` or for a context's `shared` or
  `shared-<name>` library; a role a lib doc declares wins over all three.
- `context-access` reads the Contexts table (`contexts=package-doc`).
- `contract-only` names the roles whose peers see only the listed blocks (`contract-roles`)
  and the roles that may import everything an index exports (`index-roles`).
- `package-allow-list` reads the product group's package table (`source=product-group`).

Each architecture's profile holds its own values: see the `library-roles`, `context-access`
and `contract-only` rows of
[angular-block-architecture's profile](../../angular-block-architecture/angular-block-architecture.architecture-profile.md)
and the `library-roles` and `context-access` rows of
[node-block-architecture's profile](../../node-block-architecture/node-block-architecture.architecture-profile.md)
(which selects no `contract-only`). The parameters say which role each path gives and which
roles the contract surface separates; this page doesn't repeat their values.
