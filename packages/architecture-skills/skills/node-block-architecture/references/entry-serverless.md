# Entry points: serverless

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## Serverless

A `.handler.ts` block decodes the platform event and maps the outcome to the platform
response. Compose once per cold start at module scope in the function's `.main.ts`
(or handler module), reuse the composed use cases across warm invocations, and keep
per-invocation data in the input. Pools and clients must tolerate freezing between
invocations; prefer lazy connection and short timeouts. Keep each function's import
graph to the features it serves so cold starts stay small.
