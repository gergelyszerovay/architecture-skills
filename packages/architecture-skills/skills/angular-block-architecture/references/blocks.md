# Building blocks

Responsibility, library role, provider lifetime, and visibility are separate axes.

Which blocks each block may depend on, and which TSDoc tags and spec kinds it needs, are
listed in the profile's Blocks table ([angular-block-architecture.architecture-profile.md](../angular-block-architecture.architecture-profile.md)); this reference
explains the contracts behind them.

Composition is a library responsibility, not an additional block suffix. Pages, dialogs,
and other UI hosts can compose capability containers without owning a route or a flow.

Write components the way the project's Angular version prefers: standalone, with signal
inputs and outputs, native control flow and OnPush change detection
([linting.md](linting.md) checks these). Signals serve everything above the view-model
seam, and RxJS is converted at the lower-level owners (D12).

## Rendering and presentation

| Block         | Contract                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| .page.ts      | Route entry and composition; hosts capability containers and consumes at most one facade of its own.          |
| .container.ts | Connects an interaction area to at most one facade; passes inputs and forwards outputs.                       |
| .ui.ts        | Presentational inputs/outputs and local visual state. May be product-specific. No capability-state injection. |
| .layout.ts    | Arrangement and slots, not application workflow.                                                              |
| .dialog.ts    | Typed opening data and closing result; at most one facade for its interaction.                                |
| .adapter.ts   | Imperative rendering integration with input/output surface and widget cleanup.                                |
| .pipe.ts      | Pure presentation transform, with dependencies appropriate to its library role.                               |
| .facade.ts    | VM and commands for one cohesive interaction area; projection, formatting, and delegation.                    |
| .vm.ts        | Display contract, including immutable interaction identifiers; no wire objects or writable state.             |
| .format.ts    | Extracted presentation transformation; locale is an explicit input where relevant.                            |
| .loader.ts    | Lazy `import()` of a heavy module, vendor or component; returns it. No state, no decision.                    |

Rendering blocks may compose permitted components and use presentation types. They do not
consume APIs, resources, command blocks, stores, or flows. A rule and an event's payload
contract are not state (D11): a page, container or UI block may evaluate a `.rules.ts`
predicate or format (a key binding matches a press) and name an `.events.ts` payload type
(the detail of a command event it dispatches or handles), and still reaches operations and
state through its facade. UI/adapters do not consume facades. Smart rendering blocks may use
presentation services, but those must not hide capability state access. A container may also
consume an infrastructure library's token (the keymap's keys, a notice) beside its one facade
(D46).

A block is named for what it does, not for what it looks like (D7). A component that owns
an imperative widget (an editor, a terminal, a canvas, with its instance, listeners and
cleanup) is an `.adapter.ts`, whatever it renders around it; a component opened as a dialog
with typed data and a result is a `.dialog.ts`; typed links and query-parameter formats are
a `.paths.ts`, not a `.rules.ts`; a `.token.ts` declares a contract and never builds a
transport client or a socket (that is an `.api.ts` factory, provided by composition).
`.format.ts` returns presentation values (strings, VM fragments, anything locale-dependent), and a computation from presentation models to pixels over a vendor (a layout from node sizes to positions) is one too: the planning that needs no package stays in `.rules.ts`;
`.rules.ts` returns domain decisions. `.resource.ts` is any derived query owner: Angular's
`resource()` or `httpResource()`, a vendor query, or a store-and-command pair that reruns
from its inputs.

A `.loader.ts` is an async function that `import()`s a heavy module, a vendor or a component
and returns it (`loadMarkdownRenderer` returns the renderer built from two `.format.ts`
chunks, `loadGraphCanvas` the canvas container class), so the page that does not need it
never pays for it. It holds no state and makes no decision; it is presentation because what
it loads is rendered or edits text, and the `.token.ts` whose factory returns it (an
`InjectionToken` a spec replaces with a loader that rejects) is its one consumer (D52, D22).

Facades may consume resources, commands, stores, flows, domain functions, formatters, and
narrow environment/navigation services. They do not consume other facades, components,
transport APIs, HttpClient, or observable subscriptions. Commands are facade methods,
not callbacks stored in the VM. A facade owns presentation state only and starts no read
of its own (D49); a composition facade coordinates the capabilities a place hosts through
their stores, commands and flows (D45, D47), and a facade of an area with several instances is provided per
instance (D48); see [architecture.md](architecture.md).

Keep business decisions below templates. An empty list or expanded panel is an ordinary
visual condition. Simple label projection may stay in a facade. Immutable domain IDs or
enums may appear in a VM when suitable; avoid mechanical parallel type definitions.

## State and operations

| Block         | Owns/exposes                                                            |
| ------------- | ----------------------------------------------------------------------- |
| .store.ts     | Authoritative client state, read-only views, meaningful commands        |
| .flow.ts      | Use-case process, transitions, combined outcome; may own workflow state |
| .resource.ts  | Query identity, loading/error state, caching and reload behavior        |
| .command.ts   | Explicit operation, outcome, concurrency/failure policy                 |
| .connector.ts | External events translated into capability commands                     |
| .realtime.ts  | Optional specialized subscription connector                             |
| .events.ts    | Facts and payload types; not requests or a mandatory global bus         |
| .token.ts     | Narrow injectable configuration/integration contract                    |

A store owns state; a flow owns a process. Neither implies root or route scope. Stores
must not launch hidden network workflows. A flow needs a separate store only when that
store has independent ownership. Commands cannot depend back on the coordinating flow;
return candidate results to it. Legacy .mutation.ts uses command restrictions.

Read [state-and-operations.md](state-and-operations.md) for lifetime and consistency.

## Data access and pure logic

| Block                  | Contract                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .api.ts                | Endpoint invocation, external validation, owned results, private transport.                                                                                                                                                                                           |
| .schema.ts             | Validation at a named boundary: wire schemas in data access, form/URL schemas with the input owner.                                                                                                                                                                   |
| .mapper.ts             | Substantive representation translation; a separate file is optional for trivial mappings.                                                                                                                                                                             |
| .interceptor.ts        | Transport concerns such as headers and transport errors.                                                                                                                                                                                                              |
| .model.ts              | Framework-independent domain concepts and values.                                                                                                                                                                                                                     |
| .rules.ts              | Pure business calculations and transitions.                                                                                                                                                                                                                           |
| .policy.ts             | Pure eligibility/permission decisions; server authorization remains authoritative.                                                                                                                                                                                    |
| .util.ts               | Product-independent pure helper: no product vocabulary, no framework, no I/O; dependencies arrive as arguments. Any block may use it; it uses only other helpers. Local to its only consumer until a second unrelated consumer promotes it to a utility library (D6). |
| .fixture.ts / .fake.ts | Test data/substitutes; local until shared use warrants extraction.                                                                                                                                                                                                    |

The framework boundary (D14) applies to `.model.ts`, `.rules.ts` and `.policy.ts`: domain
dependencies arrive as arguments. Every implementation file carries a block suffix;
product-independent pure helpers are `.util.ts` blocks, never unsuffixed files.

Wire isolation concerns ownership, not spelling. CamelCase does not prove isolation, and
snake_case does not prove a leak. Re-exporting generated DTOs under new names is not an
owned public contract.

## Routing

| Block         | Contract                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| .routes.ts    | Route composition; only route-owning libraries need one.                                        |
| .providers.ts | A library's wiring: a place's route providers, or a capability's provider consts; calling none. |
| .paths.ts     | Typed links without route/component implementation imports; pure ID types allowed.              |
| .guard.ts     | Functional access checks using identity/read contracts and domain policies.                     |
| .resolver.ts  | Functional preparation using the same query/cache owner consumed after navigation.              |

A route scopes the state of the place it hosts through its place's `.providers.ts` block (D51),
never by importing the stores, flows, commands, facades, connectors or realtime blocks
itself: the route imports the block, and the block allow-list proves it imports none of them
(a `.routes.ts` may depend on pages, guards, resolvers, paths, routes, its providers block,
tokens and utils). The providers block exports provider arrays or
`makeEnvironmentProviders([...])`; its only functions are expression-bodied factories
(`{ provide, useFactory: () => inject(X).view }`) and environment initializers
(`provideEnvironmentInitializer(() => inject(X))`, which starts a flow or a realtime block
with the route), and the profile's `providers-only` rule fails any other call, a function
body and any write (an assignment, `++`/`--` or `delete`), so it can resolve what it wires
but never run or change it. One providers block per
place that provides anything with its route.

A capability whose blocks are provided or started outside it (a flow the application starts
once, a transport factory, a socket and the commands a place provides with its route) has a
providers block of its own, which exports the consts its wiring needs (D51); the names only
the wiring uses leave the library's index, which exports the const instead. The composition
root and the places' providers blocks include it (`makeEnvironmentProviders` takes another
`EnvironmentProviders` among its elements), and `contract-only` keeps every peer from it, as
from any block the row does not list (D45). No `provideX()` function: the block holds no
function body.

```ts
// terminal-session.providers.ts (the terminal capability)
export const terminalSessionProviders = makeEnvironmentProviders([
  TerminalSessionStore,
  TerminalSessionRealtime,
  {
    provide: TERMINAL_CHANNEL,
    useFactory: (): TerminalChannel => inject(TerminalSessionRealtime).channel,
  },
]);

// browser.providers.ts (the place)
export const browserProviders = makeEnvironmentProviders([
  terminalSessionProviders,
  provideEnvironmentInitializer(() => inject(TerminalSessionRealtime)),
]);

// browser.routes.ts
export const browserRoutes: Routes = [
  { path: '', component: ManifestViewerPage, providers: [browserProviders] },
];
```

Resolvers must not create disposable duplicate resources and claim to warm a panel's cache.
Define whether preparation blocks navigation. Guards explicitly handle pending identity;
synchronous bootstrap hydration is one option.

One primary declaration per file (D8), with only the exceptions in the
architecture-source-organization skill's declarations reference; subjective cohesion alone
is not an exception.

Type/schema pairs follow that policy's file grouping. Wire types/schemas remain private to
data access; form and URL pairs stay with their input owner. Co-location does not permit
wire contracts to cross the view-model seam.
