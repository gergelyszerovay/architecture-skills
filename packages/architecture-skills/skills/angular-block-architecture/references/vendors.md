# Vendor integration

Preserve the installed stack unless the task includes changing it. Verify installed
versions and official APIs before implementation. Containment limits coupling; it does
not guarantee that replacing a vendor is mechanical.

| Integration                   | Owning blocks                                                                |
| ----------------------------- | ---------------------------------------------------------------------------- |
| HTTP, tRPC, generated clients | Data-access APIs and private transport/configuration                         |
| RxJS                          | APIs, resource/command interop, connectors, lower-level ambient integration  |
| Signal-store implementations  | Stores and flows                                                             |
| Router                        | Routes, guards, resolvers, composition, navigation facades/connectors        |
| Schema validation             | Boundary schemas and their validation owners                                 |
| Imperative editors/charts     | Rendering adapters                                                           |
| Forms                         | Interaction owners and presentational controls appropriate to their contract |

Components/facades use signals rather than observable subscriptions. Convert at the actual
owner. Keep raw vendor clients out of public capability contracts. Configuration wiring
may import provider APIs.

## Vendor roots

A kit vendored into the package in its upstream layout, such as spartan-ng's helm
components that its CLI generates into `libs/ui` (`components.json`) and the code imports as
`@spartan-ng/helm/<component>` through tsconfig path mappings, is a **vendor root** (D50).
It is a package that happens to live in the tree, not libraries of the application:

- the package doc's Vendor Roots table names it once: the directory, the package name its
  imports use, the tool that owns its files, and why; the profile's `library-roles` row
  (`vendor-roots=package-doc`) makes every tool read it;
- an import into it is a dependency on that package: `layer-packages` judges it against the
  Approved Packages table, and no library, context, contract or block rule sees it;
- the edges inside it are not judged, and its files are skipped by the file rules
  (declarations, facades, citations, required tags, placement), by ESLint's and Prettier's
  ignores, which come from the table;
- it imports packages only, never a library of the application (`vendor-root`, an
  `error`): a fix to the kit goes into the kit, and application code never leaks into it.

The Rule Exceptions table never names a vendor root. Regenerating the kit with its CLI keeps
the row true; moving it changes the row and the path mappings together.

## Queries and commands

Resources delegate transport and wire interpretation to data access. A direct HTTP resource
handling raw responses belongs inside that boundary and exposes owned results upward.

Resolvers and facades share a cache/resource owner if they intend to share a load.
Calling the same resource factory twice does not itself share results.

Vendor mutation primitives implement command semantics. Use .command.ts for new blocks
even if the vendor calls its API a mutation. Choose overlap/retry behavior per operation;
do not wrap independent actions in a single pending flag.

Forward cancellation where supported and separately check result validity before publication.
See [state-and-operations.md](state-and-operations.md).

## State and subscriptions

Plain signal services and the existing store library are valid implementations. Scope
follows ownership, not vendor defaults. Avoid mirroring a resource cache into another
writable store; applied results and optimistic overlays need explicit distinct contracts.

Keep subscription clients and raw payload interpretation inside data access. Scoped
connectors consume owned events and invalidate or command the relevant capability.
Dispose on scope exit and identity changes.

Authentication requires explicit pending-identity behavior. Bootstrap hydration or async
guards can implement it; guards are not inherently synchronous.

## Validation

Generated TypeScript types do not validate runtime responses. Choose validation according
to actual external contract/trust guarantees. JSON and untyped integrations need explicit
interpretation. Mapping is required when semantics differ; a separate mapper file is
optional for trivial translations. Never re-export generated DTOs merely because their
fields appear suitable.

Client policies govern UX. Backend/database authorization remains authoritative; verify
agreement where behavior matters.
