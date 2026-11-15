# Capability architecture

## The two seams

Libraries encapsulate cohesive capabilities with public contracts and private interiors
(constitution [D1](../angular-block-architecture.constitution.md#D1)). They are app-local boundaries unless the project uses independent
packages. Inside them, two seams separate concerns:

- **The view-model seam** sits at each facade (D10–D13). The facade translates application
  state into presentation-ready values and exposes user commands; components render those
  values and forward intent. Resources, stores, flows, APIs and cross-capability
  coordination stay below the seam. Facades may do simple projections, and templates may
  handle ordinary visual conditions. A composed interface can hold several local facade
  seams without duplicating the shared state they observe.
- **The framework boundary** surrounds pure domain models, rules and policies (D14). They
  have no Angular, DI, transport, reactive-library or presentation dependencies. Blocks
  below the view-model seam may still depend on Angular: being below that seam doesn't
  make them framework-independent.

## Library roles and permitted dependencies

| Role           | Responsibility                                                                   | Permitted dependencies                                              |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Shell          | Bootstrap and global wiring                                                      | Composition, provider/configuration entry points, support libraries |
| Composition    | Assemble capabilities into a page, route subtree, dialog, or embedded UI host    | Capabilities, UI, domain, utilities                                 |
| Capability     | Own a cohesive interaction or application responsibility                         | Explicitly allowed capabilities, data access, domain, UI, utilities |
| Data access    | Isolate transport and interpret external contracts                               | Domain, utilities, explicitly allowed lower-level transport modules |
| Domain         | Model concepts and calculate outcomes                                            | Explicit acyclic domain dependencies and approved pure libraries    |
| UI             | Product-independent presentation                                                 | Approved UI and utilities                                           |
| Utility        | Product-independent pure computation                                             | Approved pure dependencies                                          |
| Infrastructure | A cross-cutting service every place needs: keys, notices, theme, clipboard (D46) | Domain, utilities; any role may depend on it                        |
| Testing        | Fixtures and fakes                                                               | Subjects and their dependencies; production cannot import testing   |

Register actual library roots and roles, including grouped and generated roots. The table
is an upper bound: block restrictions also apply. Keep type-only edges acyclic too.
Directory names alone do not establish a role.

Composition is the generic role; route composition is one case. A workflow coordinates
steps or operations toward an outcome and may justify a flow block. A workspace is a
particular interface pattern with cooperating tools or panels, not a required library role.
Not every composition or capability needs a workflow or a flow block.

Capabilities may have no rendering and no routes. Do not split every component or endpoint
into a library. Extract for cohesive responsibility, ownership, or independent change
patterns even with one consumer. Promote generic helpers and UI after actual unrelated
consumers demonstrate a common contract; do not create empty anticipated libraries.

## Contexts, contracts and places

A library's role is the horizontal axis; its **context** is the vertical one (D44). The
grouping is the same in every block architecture and is explained once in the
architecture-profile skill's [grouping reference](../../architecture-profile/references/grouping.md):
the context map, places, shared code and the infrastructure role. Here the unit is the
library, `libs/<context>/<lib>`, with two reserved groups: `libs/shared/` for domain, ui,
utility and infrastructure libraries two or more contexts use, and `libs/places/` for the
composition library of each place (a routed screen or a pane of one, as the product profile
names them). The `angular-app` doc's Contexts table is the context map. Roles come from the
lib docs: a library of a context without one is a `capability`, one under `places/` a
`composition` library, and a shared library must declare its role (the profile's
`library-roles` row).

A capability has one public surface, its `src/index.ts`, and the surface for its peers is a
rule over that index (D45): another capability imports from it only store read views,
commands, flows, models, rules, formats, tokens, events and utils, while the containers,
facades and routes it exports are for composition and shell libraries. The rule is judged by
symbol, by the block of the file that declares each imported name (the profile's
`contract-only` row), so no second entry lists the allowed exports. A library's fixtures and
fakes travel through a second entry, `src/testing.ts`, which only specs and testing blocks
import. A capability therefore exports a command for every operation another capability or a
place needs, and never reaches another capability's facade: the rule refuses it. The barrel
layout resolves `#libs/<lib>` to the index (source-organization skill, barrel guide).

A place's composition library holds its routes, its page, its URL connector, the stores only
that place needs (last focus, the workbench columns) and one **composition facade**
(D47) that coordinates the hosted capabilities through what they offer their peers: it reads their
stores, calls their commands and flows, and owns the place's presentation state. The page
consumes that facade alone, so D10 holds without exception, and nothing injects a capability
facade but the capability's own components.

A place the shell's routes load through `import()` (`loadChildren`, a **lazy place**) is
imported statically by no other library (D53), an `import type` and a spec included: its one
barrel serves the lazy import, so a single static import from the shell puts the place, its
page and everything it hosts in the initial bundle. State the shell and the place share (a
workbench's pane layout and sidebar mode, which the shell's pane switches read and the place
writes), with the flows that change it and the rules and formats that read it, lives in a
composition library under `libs/places/` that both import, never in the place. That library
is not a place: it has no route, page or facade, and the place's composition facade reads
its stores beside the place's own (D47). Which libraries are lazy places is read off the code: the
`import()` of a `.routes.ts` names the library and the file that loads it (the profile's
`lazy-places` row), so no document lists them.

Cross-cutting services (keys, notices, theme, clipboard) are `infrastructure` libraries under
`shared/` (D46): tokens, stores and commands without components of their own. A container
consumes one through a token beside its one facade; a ui block takes the values it needs as
inputs.

## Public contracts

Expose deliberate components, reads, intent-based commands, domain types, and scoped
provider functions; everything else stays private (D4). Check the originating declaration
as well as the library edge, since a barrel authorizes nothing. Public visibility also does not guarantee DI availability:
document the composition/provider owner and where consumers must be mounted.

Composition imports capabilities, never the reverse (D5). Place shared ownership in an appropriate capability or supply a narrow
contract through composition. Infrastructure needed below the shell belongs behind a
lower-level contract, not a reverse import of app configuration.

## Facade granularity and coordination

One component consumes at most one facade (D10); a screen may contain many. Each facade owns
one cohesive interaction area's VM and commands. Reuse is not a prerequisite, and each
child component does not automatically need a facade.

An interaction area that appears more than once (two editor groups, several panes of one
kind) gets one facade per instance, provided by its container with
`@Service({ autoProvided: false })` and told which instance it is through an input; the
instances share the stores below (D48). A facade with exactly one container declares its
scope the same way, since `@Service()` alone is app scope. A facade owns presentation
state only and starts no read of its own (D49): the reads that follow state changes are a
flow's, and state two components share is a store's.

For example, a code workspace can host selection, tree, source, and annotation containers. Their facades
observe shared applied analysis through lower-level contracts. They do not inject each
other or copy shared state. A workspace facade handles only workspace-level presentation.

Choose integration deliberately:

- Direct command: a known consumer requests an action and needs an outcome.
- Read contract: a consumer derives from the authoritative owner.
- Flow: a use case coordinates operations and owns their combined outcome.
- Event: a fact occurred and independent listeners may react.

Events do not cure circular ownership. Check runtime feedback loops as well as imports;
define delivery scope, ordering, and failure semantics where relevant.

Preserve existing contracts unless the task includes changing them. Update callers and
enforcement together. Do not perform a broader migration as an implicit architecture fix.
