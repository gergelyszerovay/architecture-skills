# Entry points

Every entry point is a driving adapter on the primary side plus a small `.main.ts`; a
library's public exports are its entry point. Several binaries can share
one composition root and one set of use cases.

## Outcome mapping

Map outcomes only in the driving adapter:

| Outcome                | HTTP                        | MCP tool                                      | CLI            | Consumer                      | Library                                                   |
| ---------------------- | --------------------------- | --------------------------------------------- | -------------- | ----------------------------- | --------------------------------------------------------- |
| Success                | 2xx with formatted body     | `content` (and structured output if declared) | stdout, exit 0 | ack                           | return value                                              |
| Invalid input          | 400/422                     | `isError` with a message the model can act on | stderr, exit 2 | dead-letter                   | throw or return a typed validation error                  |
| Not found / forbidden  | 404/403                     | `isError`                                     | stderr, exit 1 | ack or dead-letter per policy | exported domain error                                     |
| Conflict / unavailable | 409/503                     | `isError`, retry hint                         | stderr, exit 1 | retry with backoff            | exported error with `retryable` flag                      |
| Unexpected             | 500, logged with request ID | `isError`, generic message, logged            | stderr, exit 1 | retry then dead-letter        | rethrow with `cause`; never log from a library by default |

GraphQL, tRPC, real-time, and serverless adapters follow the HTTP column in their own
vocabulary: GraphQL error codes, `TRPCError` codes, socket error messages, platform
response codes.

Domain errors carry meaning, not transport codes. Never leak stack traces or wire details
to clients.

## Transport references

Read only the file for the transport at hand:

| Transport                                          | Blocks                             | Reference                                  |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| HTTP, GraphQL, Next.js-style and Electron handlers | `.route` `.resolver` `.middleware` | [entry-http.md](entry-http.md)             |
| CLI (citty)                                        | `.cli`                             | [entry-cli.md](entry-cli.md)               |
| MCP servers                                        | `.tool` `.resource` `.prompt`      | [entry-mcp.md](entry-mcp.md)               |
| tRPC and tRPC streaming                            | `.procedure` `.router`             | [entry-trpc.md](entry-trpc.md)             |
| WebSocket, SSE, streaming responses                | `.socket`                          | [entry-realtime.md](entry-realtime.md)     |
| Queue consumers and scheduled jobs                 | `.consumer` `.job`                 | [entry-messaging.md](entry-messaging.md)   |
| Serverless functions                               | `.handler`                         | [entry-serverless.md](entry-serverless.md) |
| Libraries and SDKs                                 | public exports                     | [entry-library.md](entry-library.md)       |

## Adding an entry point

Adding a transport to an existing feature means adding driving adapters and a main file;
primary ports, secondary ports, and driven adapters do not change. If they must change,
the transport is leaking into the hexagon.
