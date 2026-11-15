# Lifetimes, concurrency, and failures

## Lifetimes

| Lifetime             | Examples                                           | Owner                                  |
| -------------------- | -------------------------------------------------- | -------------------------------------- |
| Process              | DB pools, HTTP clients, config, servers            | Composition root; disposed on shutdown |
| Request / invocation | Identity, request ID, transaction, per-call caches | Driving adapter or use case            |
| Operation            | Flow state, in-flight deduplication                | Flow or use case                       |

Choose the narrowest lifetime covering actual consumers. Use cases and adapters built by
factories are usually process-lifetime and must therefore be stateless, or hold only
state that is safe to share across concurrent requests.

There is no mutable module-level state (constitution [D24](../node-block-architecture.constitution.md#D24)). Caches are explicit blocks with an owner, a key that
includes every input affecting validity, and an invalidation rule.

## Call context

A use case takes its input as the first argument and an optional call context as the
second: `(input, ctx?) => result`. The context carries per-call capabilities that are
not business data and are not known at composition time:

- `signal?: AbortSignal` for cancellation from any transport;
- `progress?: (done: number, total?: number, message?: string) => void` for long work.

Type the context per use case with only what it uses. The use case does not know which
transport filled it; a missing optional capability means "not available". Input a
person must provide mid-operation (a confirmation, a choice) is not a context
capability: the use case returns a result member asking for it and accepts the answer
in its input on the next call (see [entry-mcp.md](entry-mcp.md)). Composition stays
static; driving adapters build the context for each call. Identity and other data the
business logic depends on go in the input, not the context.

## Shutdown

`.main.ts` handles SIGINT and SIGTERM: stop accepting work, wait for in-flight work with a
timeout, then dispose resources in reverse creation order. The composition root returns
disposers for everything it created.

## Concurrency

Where calls can overlap, pick one of D21's policies and declare it in the block's
`@concurrency` tag: required on consumers and jobs, optional on a use case, flow or state
block with a policy of its own. The lock or conditional write for a read-modify-write
lives in the driven adapter that owns the records.

**First wins** fits two triggers racing to the same end state, such as a job and a
consumer both expiring one order: the port offers a conditional write
(`expireIfUnpaid(id, now)`), the adapter applies it atomically, and the call that loses
gets an expected result member (`{ kind: 'already-expired' }`).

## Transactions

The transaction boundary belongs to the use case (D22). Expose it through a secondary
port, for example a `UnitOfWork` or a `withTransaction(fn)` method, so the application
doesn't import the database client.

A batch use case (expire every overdue order) may run one transaction per item when each
item stands alone; one transaction for the whole batch is needed only when the items must
succeed or fail together. Its result lists the items that ended in an expected failure
(`{ expired: [...], skipped: [{ id, kind: 'already-paid' }] }`). An unexpected error still
throws and stops the batch; items already committed stay committed, so the batch must be
safe to rerun.

## Failures

Each side translates failures once (D23). Port failures are typically not found,
conflict, unavailable and invalid external data. The default style, unless the project
has one: driven adapters throw typed port errors; expected outcomes (not found, conflict,
forbidden, invalid, cancelled) are members of a discriminated-union result
(`{ kind: 'not-found' }`); unexpected failures reach the driving adapter's generic
handler. Use one style consistently on each side of the hexagon boundary.

Retries belong where the operation is known to be idempotent: usually in the driven
adapter for transient infrastructure errors, or in the consumer for message redelivery.

## Events

Use events for facts that independent listeners may react to, not as hidden requests.
Define delivery scope (in-process or broker), ordering, and failure semantics. When an
event must not be lost after a database commit, use an outbox owned by the repository and
published by a job or consumer.

## Observability

### Logging

pino is the default logger (see the default stack in [setup.md](setup.md)). The reference repository
shows every rule below; the files are named at the end of this section.

- **One logger, created in composition.** `.config.ts` reads the level (`LOG_LEVEL`); a
  composition function creates the process's single pino instance with its level,
  redaction, and destination. Nothing else calls `pino()`, and no module holds a logger.
  Composition passes the logger to the adapter factories that need it; a transport that
  builds a per-request context (tRPC, HTTP frameworks) carries a child logger there.
- **Who logs what.**

  | Where                                                               | What                                                      | Level                                                                                                                         |
  | ------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
  | Driving adapter, usually one `.middleware.ts` wrapper per transport | One entry per call: operation, outcome, duration, call ID | `info` for success and expected outcomes (not found, invalid, input required); `error` with the cause for unexpected failures |
  | Driven adapter                                                      | Infrastructure failures and retries                       | `warn` per retry, `error` when giving up                                                                                      |
  | `.main.ts`                                                          | Startup (non-secret config) and shutdown                  | `info`                                                                                                                        |
  | Use case, flow, domain                                              | Nothing; see the next rule                                | —                                                                                                                             |

  Log each call once, where the outcome is mapped. Do not also log it in the handler.

- **Use cases record facts through a port, never a logger.** When a use case must
  record a business-relevant fact (an audit trail, a compliance record), it declares a
  narrow `.port.ts` named after that fact (`FileDeletionAudit.recordDeleted(paths)`), not
  a generic `Logger`. A driven adapter implements it by writing a structured log entry,
  a database row, or an event; use-case tests assert against a fake. Wanting debug output
  from a use case is not a reason to add a port.
- **Adapters depend on pino directly; the hexagon never does.** Adapters type their
  logger as pino's `Logger` (`import type { Logger } from 'pino'`). The `core-no-packages`
  rule keeps pino out of `core/` (see [enforcement.md](enforcement.md)).
- **Call ID.** The driving adapter binds the call ID to a child logger
  (`log.child({ requestId })`). HTTP and tRPC take the incoming `x-request-id` header
  or generate a UUID in `createContext`. MCP tools use `ctx.mcpReq.id` (the JSON-RPC
  request ID) and `ctx.sessionId`. Consumers use the message ID.
- **Structured and redacted.** Log an object plus a short constant message
  (`log.info({ path, outcome, ms }, 'trpc call')`), not interpolated strings. Put errors
  under `err` so pino serializes the stack and `cause`. Never log secrets, tokens, or
  full payloads containing personal data; configure `redact` paths where the logger is
  created.
- **Destination.** Stdio binaries (MCP stdio servers, CLIs) log to stderr, because
  stdout carries the protocol or the command's output (see the stdio invariant).
  Long-running servers log to stdout for the platform's collector. Use a synchronous
  destination (`destination({ dest: 2, sync: true })`) in short-lived processes so
  entries are not lost on exit.
- **CLI output is not logging.** A command's result (stdout) and its user-facing error
  messages (stderr) are outcome mapping done by the `.cli.ts` block with `console.log`
  and `console.error`. The logger in a CLI carries only operational entries (audit
  records, debug traces); a normal run prints nothing extra.
- **Libraries** never create a logger. They accept an optional one from the consumer and
  log nothing without it.
- **Testing.** Tests that assert log entries build pino with an in-memory destination
  (`pino({ base: null, timestamp: false }, { write: (line) => lines.push(JSON.parse(line)) })`).
  The stdio binary test runs with `LOG_LEVEL=debug` and asserts that stdout still carries
  only protocol messages and that stderr carries the call's log entry.

Reference repository: `app/load-logging.config.ts` and `app/compose-logger.composition.ts` (creation),
`libs/shared/trpc/.../log-call.middleware.ts` and `libs/shared/mcp/.../with-tool-logging.middleware.ts`
(per-call logging), `libs/dir-browsing/.../file-deletion-audit.port.ts` with
`log-file-deletion-audit.gateway.ts` (audit port), and `app/mcp.main.test.ts` (stdio test).

### Tracing, metrics, and correlation

- **Tracing.** Span creation and context propagation (OpenTelemetry, `AsyncLocalStorage`)
  live in adapters and middleware. Instrumentation libraries hook transports and SDKs;
  domain and application code stay free of tracing APIs. When a use case needs a custom
  span, it goes through a small port.
- **Metrics.** Transport metrics (latency, status) come from middleware; business
  metrics (orders placed) come from events or an explicit metrics port.
- **Correlation.** The driving adapter creates or accepts the correlation ID and passes
  it in the call context when driven adapters need it for outbound calls.

## Configuration

`.config.ts` reads environment and arguments once, validates with a schema, and returns an
owned type. Composition passes relevant parts to adapters. The application receives only values
it needs, as ordinary inputs.

When settings come from several layers (flags, environment, a file, defaults) merged by rules,
the merge is a feature: its rules are `.rules.ts`, its use case returns the owned settings, and
composition calls it. `.config.ts` then only reads the raw sources and validates their shape;
it calls no feature (D26).
