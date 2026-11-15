# File and declaration policy

The file/declaration policy is the architecture-source-organization skill's declarations
reference: one primary declaration per implementation file with its supporting cases
(primary profile), or the strict single-declaration profile when the project selects it.
Read it before creating files or changing declarations. This file lists only what this
architecture adds.

## Additions for this architecture

- Types are explicit: every function states its return type and every exported
  function its parameter types (enforced by ESLint; see [linting.md](linting.md)). A
  factory states the contract it returns, so the contract is written out rather than
  derived: `export type GetDirTree = (input: GetDirTreeInput, ctx?: { signal?: AbortSignal }) => Promise<GetDirTreeResult>`
  and `export const makeGetDirTree = ({ fs }: { fs: FileSystemPort }): GetDirTree => ...`.
  The contract type is a supporting co-export of the factory and stays in
  `get-dir-tree.use-case.ts`; under the strict profile it moves to its own file. The
  same applies to composition results (`FsToolsApp`) and adapter factories.
- tRPC is the exception: `.procedure.ts` and `.router.ts` blocks keep inferred types,
  because clients derive their types from them, and `AppRouter` stays
  `ReturnType<typeof makeAppRouter>`.
- The `router` and `procedure` builders taken from one tRPC instance
  (`trpc.middleware.ts`) are a coupled pair: they come from the same `initTRPC` call and are
  exported together.
- Entry files (`.main.ts`) contain top-level startup statements; keep them to a few lines
  that call testable functions. Register them as bootstrap files for the policy checker.
- Transport schemas (`.schema.ts`) live with their driving adapter in `adapters-driving/`;
  wire schemas (`.wire.ts`) live with their driven adapter in `adapters-driven/`. Neither
  crosses the hexagon boundary. Both follow the policy's schema/type pairs.

## Naming

File names follow the architecture-source-organization skill's rule (declarations reference,
"File name from declaration name"): the stem is the kebab-cased primary declaration, and a
trailing suffix word leaves the stem (`makeOrdersRouter` in `orders.router.ts`,
`GetPricesUseCase` would be `get-prices.use-case.ts`); otherwise the block suffix is appended
(`FileSystemPort` in `file-system.port.ts`, `nodeFileSystem` in
`node-file-system.gateway.ts`). This architecture documents **`make`** as the one factory
prefix its file names omit: `makeGetDirTree` lives in `get-dir-tree.use-case.ts` and
`makeFakeOrderStore` in `fake-order-store.fake.ts`; a checker strips `make` before comparing. No
other prefix is omitted. Every implementation file carries a block suffix; a
product-independent helper is a `.util.ts` block (`resolveWithinRoot` in
`resolve-within-root.util.ts`).
