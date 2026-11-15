# Building blocks

Suffixes express responsibility. Lifetime (process, request, invocation) and visibility
(public, feature-private) are separate decisions. Each block's layer, required TSDoc tags,
spec kinds and permitted dependencies are rows of the [profile](../node-block-architecture.architecture-profile.md); this
reference explains the blocks.

Use cases and adapters are factories taking one dependency object typed with exactly the
ports they use (`makeX({ deps })`, constitution [D27](../node-block-architecture.constitution.md#D27)); never inject a whole app or config
object. Classes are fine where the project prefers them.

## Domain ring

| Block      | Contract                                                                     |
| ---------- | ---------------------------------------------------------------------------- |
| .model.ts  | Framework-independent concepts and values.                                   |
| .rules.ts  | Pure business calculations and state transitions.                            |
| .policy.ts | Pure eligibility and permission decisions; transport auth stays in adapters. |
| .error.ts  | Typed domain failure; no HTTP status, exit code, or transport vocabulary.    |
| .events.ts | Facts and payload types; not requests and not a mandatory bus.               |

No framework, transport, SDK, or I/O imports. Time, randomness, and identity come in as
arguments or through ports. Pure standard-library helpers without I/O are allowed.

A `.events.ts` earns its place when a fact has a listener its producer doesn't know: an
outbox a job publishes from, or a second feature reacting through a publishing port. A
change pushed to one client through state and a flow is a `.model.ts` type, not an event.

## Helpers

| Block    | Contract                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .util.ts | Product-independent pure helper: no product vocabulary, no I/O, no framework or SDK; only the allowed `node:*` built-ins. Any block may use it; it uses only other helpers. |

A helper sits beside its only consumer, in whichever layer folder that is, and moves to a
shared library once a second feature needs it (D10). Every implementation file carries a
suffix, so there are no unsuffixed helpers. A helper that holds listeners (an `EventEmitter`
from `node:events`) or anything else that outlives one call is not a helper: it is owned
state, a `.state.ts` block (D15).

## Application (inside the hexagon)

| Block        | Contract                                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .use-case.ts | Primary port and its implementation: one operation: input to result. Orchestrates ports and domain; owns validation of business preconditions, failure policy, and transaction boundary.                                                                                                                |
| .flow.ts     | A multi-step process coordinating use cases or ports toward one combined outcome; may own process state.                                                                                                                                                                                                |
| .step.ts     | An internal operation of the feature that use cases and flows compose: calls ports and the domain like a use case, but is not a primary port and stays out of the library's entry (D54).                                                                                                                |
| .state.ts    | Owned in-process state that outlives one call (sessions, rooms, game state, caches of domain data): typed structure plus the only functions allowed to change it. Created at composition, mutated only through use cases or flows. May read from a port that feeds it, such as a live stream it caches. |
| .port.ts     | Secondary port: interface the application needs from outside, named and typed in domain terms.                                                                                                                                                                                                          |
| .input.ts    | Primary port input contract; already transport-validated, no wire types; may carry a port instance the caller passes per call.                                                                                                                                                                          |
| .result.ts   | Primary port result contract when it is more than a domain type.                                                                                                                                                                                                                                        |

What each block may import is its profile row's "May depend on". Use cases and flows are
constitution [D14](../node-block-architecture.constitution.md#D14), steps D54, state blocks D15: a use case returns results to a flow and never
calls back into it, and state that must survive a restart goes behind a port.

A step is what several use cases or flows start with, or a stage of a loader chain: "load the
session's layers", "resolve the branch facts", "price the order's lines". The use case or flow
builds it from the ports it already receives (`const priceLines = makePriceOrderLines({ prices })`),
so composition never sees it and no driving adapter can call it. A step may call another step;
when a step would need to call a use case, the operation is a flow.

Name secondary ports after what the application needs (`OrderRepository`, `PaymentGateway`, `Clock`,
`DirectoryReader`), not after the technology. Split a port when its consumers need
unrelated subsets.

## Driven adapters (secondary side)

| Block          | Contract                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .repository.ts | Persistence implementing one secondary port: queries, transactions it is asked to join, mapping.                                                                                                                                            |
| .gateway.ts    | External API, SDK, OS, or file-system integration implementing one secondary port; private transport, owned results. Unrelated to NestJS WebSocket gateways, which are `.socket.ts` driving adapters.                                       |
| .publisher.ts  | Outbound events or messages implementing a publishing port.                                                                                                                                                                                 |
| .mapper.ts     | Substantive translation between wire or row shapes and domain types; optional for trivial mappings. Also used on the driving side, where it maps owned results to transport DTOs (see below).                                               |
| .wire.ts       | Type and schema of external data where it enters (API responses, rows, files, messages a driven adapter reads from other systems); validated before mapping. Messages a consumer receives are driving-side and decoded with a `.schema.ts`. |

Driven adapters make no business decisions, and translate infrastructure failures into
port failures instead of leaking SDK exceptions (D23).

## Driving adapters (primary side)

| Block          | Contract                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .route.ts      | One HTTP endpoint or a cohesive set for one resource: parse, call one use case, map outcome to status and body.                                                                                                   |
| .tool.ts       | One MCP tool: input and output schemas, annotations, call one use case or flow, map outcome to a tool result.                                                                                                     |
| .resource.ts   | One MCP resource or resource template: resolve the URI, call one query use case, map the result to resource contents.                                                                                             |
| .prompt.ts     | One MCP prompt: argument schema, optionally call a query use case for context, render messages through a format.                                                                                                  |
| .cli.ts        | One CLI command: parse arguments, call one use case, map outcome to output and exit code.                                                                                                                         |
| .resolver.ts   | GraphQL resolvers for one type or operation group: map arguments, call one use case per field, map outcome to data or GraphQL errors. Batching loaders are driving-side helpers.                                  |
| .procedure.ts  | tRPC procedure (query, mutation, or subscription), or a small group for one operation: input schema, call one use case, map outcome to data or `TRPCError`; subscriptions map and yield an owned `AsyncIterable`. |
| .router.ts     | A feature's tRPC router factory (`makeOrdersRouter(app)`): combines the feature's procedures and receives only the use cases they call. Registration surface, not business logic.                                 |
| .socket.ts     | WebSocket, SSE, or streaming handler for one channel: authenticate on connect, decode messages, call one use case per message, push results or events to clients.                                                 |
| .handler.ts    | Serverless function handler (Lambda, Cloud Functions, Workers, Vercel/Netlify functions): decode the platform event, call one use case, map the outcome to the platform response.                                 |
| .consumer.ts   | Queue or event subscriber: decode, call one use case, acknowledge or retry.                                                                                                                                       |
| .job.ts        | Scheduled trigger calling one use case or flow with explicit concurrency rules.                                                                                                                                   |
| .middleware.ts | Transport cross-cutting concerns: auth tokens, request IDs, logging, rate limits.                                                                                                                                 |
| .format.ts     | Pure output presentation (text, table, JSON shape) from result types.                                                                                                                                             |
| .schema.ts     | Transport input validation for this boundary. Driving side only; wire formats of driven adapters are `.wire.ts`.                                                                                                  |

On the driving side, a `.mapper.ts` maps owned results to transport DTOs a procedure or
route returns, such as types from a shared API-types package (D16). Driving adapters never
consume ports, driven adapters, state or each other (D18); formats are pure and may be
shared by several driving adapters of one feature.

## Composition and runtime

| Block           | Contract                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .composition.ts | Composition root (configurator): create adapters, bind them to ports, return the app's use cases and disposers.                                                                                                                                                                                   |
| .bridge.ts      | Lives only in `app/`. Implements one feature's secondary port by calling another hexagon's public use cases: a sibling feature's, or another package's application (such as a workspace package exposing `createX()` use cases); mapping only, no business decisions and no I/O of its own (D55). |
| .config.ts      | Parse and validate environment, arguments, and files once; returns an owned config type.                                                                                                                                                                                                          |
| .server.ts      | Transport host: create the HTTP or MCP server, register a feature's routes or tools; no business logic.                                                                                                                                                                                           |
| .main.ts        | Process entry for one binary: load config, compose, start, handle signals and exit.                                                                                                                                                                                                               |
| .entry.ts       | Published entry of a package, built from a library by the build config: named re-exports of the published names, no declaration or logic (D59).                                                                                                                                                   |

A bridge only joins hexagons, so what it may import is what joining needs: the other
hexagon's package and path handling, and nothing that reaches the disk, a process or the
network (the profile's `bridging` row, D55). I/O in a bridge would sit where no contract suite
covers it. When the port a bridge would implement needs the file system, a process or the network, that part is a
`.gateway.ts` of the feature that owns the port, with its contract suite (D46); the bridge
keeps the calls into the other hexagon, and composition passes the gateway to both.

The profile keeps these apart: a `.main.ts` imports composition, config, servers and
models, never a router or a use case; a `.server.ts` or `.router.ts` never imports
composition, so it types what it needs from composition as an inline shape (`{ placeOrder:
PlaceOrder }`) or through the library's exported types.

A `.entry.ts` sits at the library's `src/` root beside `index.ts`, and a tsdown (or tsup)
entry names it: `export { … } from './lib/…'` and `export type { … } from './lib/…'`, so
the package's `exports` reach exactly the names listed there and nothing `index.ts` carries
for composition only (the CLI, the file adapters). It declares nothing and has no
statement; the declarations it names are judged where they live (D59). `entry-only`
(ESLint) fails any statement that is not an `export … from`, and `block-placement` any
`.entry.ts` that is not directly in a `src/` folder. A package whose
`exports` is the library's `index.ts` needs none.

## Contracts between processes

| Block   | Contract                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .dto.ts | A contract that crosses a process boundary (a request, a response, a message both sides read): a schema and its type, owned by the package both sides depend on (D56). |

A `.dto.ts` sits in `core/` of its library and imports only other contracts and helpers. Both
sides of a process boundary load it, so it carries nothing but its shape: the profile's
`contracts` row keeps it as pure as the domain (D56), and the schema library it is written
with is a choice the package doc approves with its reason (D5). Inside a hexagon nothing depends on it: on the driving side a
`.mapper.ts` or `.format.ts` maps an owned result to it. A package whose libraries hold only
`.dto.ts` files is a contract package (D57), versioned as [architecture.md](architecture.md)
describes under "Evolving public contracts".

## Testing

| Block        | Contract                                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| .fake.ts     | In-memory implementation of a port with observable state.                       |
| .fixture.ts  | Test data builders.                                                             |
| .contract.ts | Test suite for one secondary port, run against its fake and every real adapter. |

Keep fakes local to the feature until a second feature needs them (D46). See
[testing.md](testing.md).

## Choosing a block

- Is it a decision about the business with no I/O? `.rules.ts` or `.policy.ts`.
- Is it one thing a caller can ask the app to do? A primary port: `.use-case.ts`.
- Does it coordinate several operations and own their combined outcome? `.flow.ts`.
- Is it an operation that use cases or flows share, which no caller asks for directly?
  `.step.ts`.
- Is it the shape two processes exchange, owned by neither's hexagon? `.dto.ts`.
- Does the application need it from the outside world? A secondary `.port.ts`, implemented by a driven adapter.
- Does it translate a transport into a use-case call? A driving adapter.
- Must it remember something between calls within the process? `.state.ts`; across
  restarts or processes? A secondary port.
- Does it shape output for humans or clients? `.format.ts`.
- Does it select the names a published entry of the package exports? `.entry.ts`.

Use one primary declaration per file with only the supporting cases of the
architecture-source-organization skill's declarations reference and the additions in
[declarations.md](declarations.md).
