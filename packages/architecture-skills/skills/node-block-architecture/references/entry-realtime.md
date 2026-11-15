# Entry points: real-time

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## Real-time (WebSocket, SSE, streaming)

A `.socket.ts` block owns one channel. Authenticate on connect as middleware, validate
each inbound message with a transport schema, call one use case per message, and push
results. Server-initiated pushes come from domain events or a publishing port whose
driven adapter fans out to connections; use cases never hold socket references. Room,
presence, and session data that lives only in this process is a `.state.ts` block; when
several instances serve clients, move it behind a secondary port (Redis, a pub/sub
service). Streaming HTTP responses and LLM token streams follow the same rule: the use
case returns an `AsyncIterable` of owned types, and the adapter writes it to the wire.
