# Entry points: HTTP, GraphQL, and framework-owned apps

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## HTTP

Routes validate input with a transport schema, call one use case, and format the result.
Authentication and request IDs are middleware; authorization decisions that depend on the
domain are policies invoked by the use case. Request-scoped data (user identity, request
ID) is passed explicitly into the use case input or a context argument, or through
`AsyncLocalStorage` owned by the transport layer; the application does not read it implicitly.

## GraphQL

A `.resolver.ts` block is a driving adapter. Field resolvers call one use case each;
DataLoader-style batching is a driving-side helper that calls a batch use case, never a
repository. Map domain errors to GraphQL errors with `extensions.code` (for example
`NOT_FOUND`, `BAD_USER_INPUT`, `FORBIDDEN`); unexpected errors get a generic message and
are logged. Schema-first SDL or code-first builders are transport schemas.

## Framework-owned apps

In Next.js, Nuxt, Remix, SvelteKit, and similar frameworks, route handlers, server
actions, loaders, and API routes are driving adapters. Keep the hexagon in `libs/`
or a workspace package outside the framework's routing folders, compose it in a
server-only module, and import use cases from handlers. Client components never import
the hexagon. In Electron, IPC handlers in the main process are driving adapters; the
renderer is a client.
