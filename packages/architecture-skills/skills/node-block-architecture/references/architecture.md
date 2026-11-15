# The hexagon, roles, features, and public contracts

## The hexagon

An application is a hexagon (ports and adapters). Driving adapters (routes, CLI commands,
MCP tools, consumers, jobs) call the application; driven adapters (databases, file
systems, external APIs, clocks) are called by it. A composition root, the configurator,
decides which adapters are plugged in.

- **Primary ports** are what the application offers: the use-case contracts (constitution
  [D2](../node-block-architecture.constitution.md#D2)). A driving adapter translates a transport into one primary-port call and maps the
  result back, for example to an HTTP status or a CLI exit code (D17).
- **Secondary ports** are what the application needs: storage, file system, network,
  time, randomness, identity (D3). The application never imports a driven adapter.
- **The domain ring** is optional pure code inside the hexagon: models, rules, policies,
  errors and events (D4). It comes from DDD and Clean Architecture rather than from
  hexagonal architecture itself. Use it when business rules are substantial; a thin
  application may keep its logic in use cases.

### Beyond hexagonal

Hexagonal architecture defines the boundary, ports, adapters and configurator. This skill
adds compatible conventions of its own: the domain ring, feature libraries each a small
hexagon with shared kernel libraries under `libs/shared/`, flows, block suffixes, and the
source-organization skill's barrel layout. When a project follows hexagonal architecture
with different conventions, apply the boundary decisions and keep the project's own
naming and structure (D49).

### Fit

- **Full fit:** HTTP, GraphQL and tRPC APIs, CLIs, MCP servers, queue consumers,
  scheduled jobs, serverless functions, real-time servers, multi-entry packages, and
  libraries or SDKs.
- **Server-side logic only:** full-stack frameworks (Next.js, Nuxt, Remix, SvelteKit) and
  Electron main processes. The framework owns routing, rendering or IPC; its handlers,
  server actions and IPC handlers are driving adapters over a hexagon kept outside the
  framework's folders.
- **Weak fit:** plugins for a host (Vite, ESLint, Babel, webpack), where the host defines
  the contract and most code is adapter code; stream-heavy pipelines; thin CRUD and
  one-off scripts. Apply only the decisions that pay off, typically keeping I/O out of
  pure logic.

## Roles and permitted dependencies

| Role                       | Responsibility                                                               | Permitted dependencies                                            |
| -------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Entry                      | Process start, signal handling, exit codes                                   | Composition, config                                               |
| Composition (configurator) | Build adapters, bind them to secondary ports, return use cases               | Everything below; nothing depends on it except entry              |
| Driving adapter            | Translate a transport into primary-port calls and back                       | Application contracts, formats, schemas, shared transport helpers |
| Application                | Primary ports (use cases, flows, input/result contracts) and secondary ports | Domain, own ports                                                 |
| Domain                     | Concepts, rules, policies, domain errors and events                          | Explicit acyclic domain modules, approved pure libraries          |
| Driven adapter             | Implement secondary ports against real infrastructure                        | Ports, domain, infrastructure SDKs, mappers, wire schemas         |
| Shared                     | Blocks used by more than one feature, in the same roles                      | Same as their role; never features                                |
| Testing                    | Fakes and fixtures                                                           | Subjects and their dependencies; production never imports testing |

The table is an upper bound; block restrictions in [blocks.md](blocks.md) also apply.
Directory names alone do not establish a role.

## Features

A feature is a cohesive capability: a small hexagon with its own primary ports, secondary
ports, and adapters. The application is the set of feature hexagons wired together in
composition. A feature needs no HTTP route; it may be reachable only from a CLI, an MCP
tool, a job, or a library export.

### Finding boundaries

Draw boundaries where these signals agree; when they conflict, data ownership wins
(constitution [D6](../node-block-architecture.constitution.md#D6)).

- **Data ownership** (D11). If two candidates must write the same records, they are one
  feature.
- **Vocabulary.** Inside a feature, a term means one thing. When "order" means a cart in
  one place and an invoice in another, that is two features.
- **Change.** Code that changes together for the same reason belongs together. Code
  changed by different people, on different schedules, or for different stakeholders is
  a candidate for a split.
- **Ports.** Use cases that share secondary ports and domain types belong together. Use
  cases with disjoint ports are likely separate capabilities.

Do not split by entity (`users`, `products`), by technical layer, or by endpoint or
command. Name features after capabilities (`checkout`, `catalog`, `billing`,
`dir-browsing`), not after data or transports.

### Splitting and merging

Split a feature when it contains use cases that share no ports or domain types, when its
secondary ports serve disjoint groups of use cases, or when parts change for unrelated
reasons. Merge two features when they always change together, when one calls the other's
read contracts for most of its work, or when neither is meaningful without the other.
A feature with one use case is fine; a split is justified by these signals, not by size.

Start with one feature library and split when the signals appear.
Premature splits cost more than late ones: they create read contracts, events, and
shared blocks that exist only to cross a boundary that should not be there.

### Contexts

Features are grouped by bounded context once a package has several (D52): `libs/<context>/<feature>`,
with the package doc's Contexts table as the context map. The grouping is the one every block
architecture shares, explained in the architecture-profile skill's
[grouping reference](../../architecture-profile/references/grouping.md); here its unit is the
feature, its places are `app/`, and it has no contract entry, because features never import
features (D7). A context's features collaborate as below; the Contexts table decides which
contexts' features a bridge may connect (D53). A flat `libs/` is one implicit context, so a
package groups its features when its graph needs it, not before.

### Collaboration between features

Keep blocks feature-local until a second feature needs them, then promote them to a shared
library (D10): a library of the features' context named `shared` or `shared-<name>` when
both features are in one context, or a library under `libs/shared/` when they are in two
(D52). Do not create anticipated shared modules. Promote only blocks with
no owned data (models of neutral concepts, pure rules, infrastructure ports); a block
that reads or writes a feature's records stays in that feature.

If feature A needs something from feature B, choose one of the three ways D8 allows:

- **Own port, bridged in composition.** A declares a secondary port in its own terms
  (`PriceLookup`); a bridge in `app/` implements it by calling B's public use case
  (`app/catalog-price-lookup.bridge.ts`). A never imports B; the dependency lives only
  in composition and is visible there. The bridge only maps (D55): what the port also needs
  from the disk or the network is a gateway of A. This is the default for synchronous reads. The
  same bridge wraps another package's application when a feature needs it, so every
  edge between hexagons sits in `app/`. A bridge between two contexts needs the Contexts
  table's permission (D53).
- **Event.** A fact occurred in B and A reacts independently (see
  [operations.md](operations.md)). Use it when A does not need an answer.
- **Shared secondary port.** Both depend on an infrastructure port in `libs/shared/` that
  neither owns (a clock, a mailer, a file system).

Never read or write another feature's records directly, even when they share a
database. Events do not cure circular ownership; fix the ownership instead. A transaction never spans a bridge; if one must, the
features share ownership and should merge. Frequent
bridges in both directions are the merge signal above.

### Large features

Features do not nest. Split a large feature into sibling features of its context and move
code they both need, if it owns no records, to a shared library of that context (see
[layout.md](layout.md#large-features)); when the siblings form a context of their own, that is
a new row of the Contexts table ([grouping reference](../../architecture-profile/references/grouping.md)).

## Public contracts

The public entry is the only way into a library (D29). Each feature exposes its primary ports: use cases (or flows), their input/result types, and the domain types
those contracts need. Mappers, wire types, schemas, and formats stay private.
Composition also needs a few construction exports: the secondary-port types it implements
in bridges, the driven adapters it instantiates, and the driving adapters' registration
surface (router factories, `registerXTool(server, app)` functions, command factories).
Export these from the public entry for composition only; other features never consume
them.

Use named exports; no wildcard re-exports and no default exports. A barrel does not
authorize forbidden consumption: check the originating declaration, not only the import
path.

## Evolving public contracts

Some contracts leave the process: HTTP and GraphQL schemas, tRPC output types, MCP tool
names and schemas, message payloads, and library exports. They are versioned (D30):

- Additive changes (new optional fields, new tools or procedures, new result members
  that clients may ignore) are safe. Renaming, removing, narrowing, or changing meaning
  is breaking.
- Break by adding alongside: a new field, procedure, tool, or event version; mark the old
  one deprecated in its description or TSDoc; remove it after a stated period or major
  version.
- Keep contracts in owned `.input.ts`, `.result.ts`, and transport schemas so a change is
  a visible diff in one place. Snapshot-test externally visible schemas (OpenAPI,
  GraphQL SDL, MCP tool list, exported `.d.ts`) to catch accidental breaks.
- Message and event payloads carry a version; consumers accept the current and previous
  version during a migration.
- Libraries follow semver and record changes with Changesets or an equivalent.

## Packages

A block two packages of a repository need, and that owns no data, becomes a package of its
own, named in the group's package table, rather than a copy in each (the shared kernel of D10
at the scale of packages). Command helpers several CLIs share are the usual first one.

The wire contracts a server and its clients share are a contract package (D57): libraries of
`.dto.ts` files only, on which both sides depend, so neither side's hexagon owns them.

When code becomes an independently published package (a library, a CLI, an MCP server),
the package's `exports` field is its public surface. Keep the hexagon framework-free so the
same use cases can back several binaries. Put framework-specific integration (a NestJS
module, a Fastify plugin) in a separate entry point or package so consumers who do not
use that framework do not pay for it.
