# node-block-architecture reference repository

Two small apps that exercise the skill's rules:

- **fs-tools** (`libs/dir-browsing`): a CLI (citty) and an MCP stdio server over one
  feature with three use cases, a file-system port with a contract test run against the fake
  and the real adapter, and confirmation via MCP input-required results.
- **shop** (`libs/catalog`, `libs/orders`): a tRPC API with a query, a
  mutation, and an SSE subscription; two features joined by `app/catalog-price-lookup.bridge.ts`;
  `place-order` composes the private `price-order-lines.step.ts`; Awilix composition in
  `app/compose-shop.composition.ts`.

Specs run on Vitest with the spec kinds as tags (`vitest.config.ts`, `vitest-spec-kinds.d.ts`):
each spec has a kind, a `meta.spec` slug and arrange/act/assert phases, and every port has a
`.contract.ts` suite run against its fake and its adapters. Blocks carry the required TSDoc tags
(`tsdoc.json`). Each lib has a `node-lib` doc and the package a `node-package` doc, in
`layered-docs/` next to it. `package.json` binds the package to the `node-block-architecture`
profile, whose import rules `reviewer2-check` (the `@gergelyszerovay/reviewer2-architecture-check`
package) judges over the repository; it needs the skills installed under `.claude/skills/`
(`node-block-architecture` and `architecture-profile`). The checkers
(`lint:tsdoc`, `lint:placement`) are loaded from the sibling `architecture-profile` skill, and
need `markdown-schema` resolvable from this directory.

Build: the fs-tools binaries are bundled with tsdown (`tsdown.config.ts`) into `dist/`,
which `bin` points at, and checked with `publint --strict`. The shop server is not
published and runs from source. The stdio test runs against both the source and the built
MCP entry.

Explicit types: ESLint requires explicit return types (and parameter types on exports)
everywhere except tRPC procedures and routers. Use-case contracts are declared directly,
and the reference code passes `pnpm run lint` without inline disables.

Logging (pino): `app/compose-logger.composition.ts` creates the one logger per binary (stderr for
the stdio binaries, stdout for the HTTP server; level from `LOG_LEVEL`, default `info`).
tRPC calls are logged by the base-procedure middleware in `libs/shared/trpc` with the
`x-request-id` (or a generated ID); MCP tool calls by `withToolLogging` in `libs/shared/mcp`
with the JSON-RPC request ID. `delete-files` records deletions through its
`FileDeletionAudit` port, implemented by a log-backed gateway.

Verified with Node 24, TypeScript 6, citty 0.2,
@modelcontextprotocol/server 2.1, @trpc/server 11, Awilix 13, zod 4, pino 10, Vitest 4.1, ESLint 10,
typescript-eslint 8, eslint-plugin-n 18, eslint-plugin-jsdoc 64, Prettier 3,
eslint-config-prettier 10, tsdown 0.23, publint 0.3.

```sh
pnpm install --ignore-workspace
pnpm run build && pnpm run typecheck && pnpm test && pnpm run lint \
  && pnpm run lint:tsdoc && pnpm run lint:placement && pnpm run format:check && pnpm run publint
reviewer2-check --rule dependencies --rule facades --rule suffixes   # the import rules
node app/cli.main.ts tree libs --depth 2   # from source; after build: node dist/cli.main.mjs
FS_TOOLS_ROOT=. node app/mcp.main.ts        # MCP over stdio (JSON logs on stderr)
PORT=3000 node app/shop-http.main.ts         # tRPC over HTTP (x-user-id header = identity)
```
