# Examples

Both examples exist as a runnable reference repository in `assets/reference-repo`
(type-checked, tested, and passing `reviewer2-check`). Read its files for complete code.

## fs-tools: one feature, two use cases, two binaries

A package that returns a directory tree and a file list, exposed as both a CLI
(`fs-tools tree`, `fs-tools ls`) and an MCP stdio server (`dir_tree`, `list_files`).

Both operations read the same file system through the same port, use the same
vocabulary (entry, visibility, depth), and change together. By the boundary signals in
[architecture.md](architecture.md) they are one feature, `dir-browsing`, with two use
cases. Even with one capability the app has a feature library; a second capability is
added beside it under `libs/`.

```
libs/
  dir-browsing/
    src/
      index.ts                         # public entry: use-case factories and types, register functions
      lib/
        core/
          dir-entry.model.ts
          tree-node.model.ts
          file-info.model.ts
          is-visible.rules.ts          # hidden and ignored entry filtering
          file-system.port.ts          # readDir, stat, remove
          file-deletion-audit.port.ts  # recordDeleted: a business fact, not a logger
          get-dir-tree/
            get-dir-tree.input.ts
            get-dir-tree.use-case.ts
            get-dir-tree.use-case.test.ts
          list-files/
            list-files.input.ts
            list-files.use-case.ts
            list-files.use-case.test.ts
          delete-files/                # confirmation as a result member; audits deletions
        adapters-driving/
          render-tree.format.ts           # renderTree
          render-file-list.format.ts
          dir-tree-command.cli.ts
          list-files-command.cli.ts
          register-dir-tree.tool.ts
          register-list-files.tool.ts
          register-delete-files.tool.ts
          dir-tree-tool-input.schema.ts  # one schema per file, with list-files-, delete-files-tool-input, confirm
          text.util.ts
          resolve-within-root.util.ts  # MCP path sandbox helper
        adapters-driven/
          node-file-system.gateway.ts
          log-file-deletion-audit.gateway.ts  # FileDeletionAudit as a structured log entry
          translate-not-found.mapper.ts
        testing/
          fake-file-system.fake.ts
          fake-file-deletion-audit.fake.ts
          file-system.contract.ts      # run against the fake and node-file-system
  shared/
    mcp/src/lib/adapters-driving/
      with-tool-logging.middleware.ts       # withToolLogging: one entry per tool call
app/
  compose-fs-tools.composition.ts
  load-fs-tools.config.ts
  load-logging.config.ts                    # LOG_LEVEL
  compose-logger.composition.ts                # the only place that creates pino
  compose-fs-tools-cli.composition.ts          # the CLI's root command and subcommands
  compose-fs-tools-mcp.composition.ts          # binds the feature's tools to the use cases
  create-fs-tools-mcp.server.ts                        # creates McpServer, registers the tools it is given
  cli.main.ts                          # bin: fs-tools
  mcp.main.ts                          # bin: fs-tools-mcp
```

### Key files

```ts
// libs/dir-browsing/src/lib/core/file-system.port.ts
export interface FileSystemPort {
  readDir(path: string): Promise<DirEntry[]>;
  stat(path: string): Promise<{ size: number; modifiedAt: Date }>;
}

// libs/dir-browsing/src/lib/core/get-dir-tree/get-dir-tree.use-case.ts
export const makeGetDirTree =
  (deps: { fs: FileSystemPort }) =>
  async (input: GetDirTreeInput): Promise<TreeNode> => {
    // recurse via deps.fs.readDir, filter with visibility rules, sort, respect maxDepth
  };

// app/compose-fs-tools.composition.ts
export const composeFsTools = (deps: { log: Logger; fs?: FileSystemPort }) => {
  const fs = deps.fs ?? nodeFileSystem;
  return {
    getDirTree: makeGetDirTree({ fs }),
    listFiles: makeListFiles({ fs }),
    deleteFiles: makeDeleteFiles({ fs, audit: makeLogFileDeletionAudit({ log: deps.log }) }),
  };
};

// libs/dir-browsing/src/lib/adapters-driving/register-dir-tree.tool.ts
export const registerDirTreeTool = (
  server: McpServer,
  app: { getDirTree: GetDirTree },
  root: string,
  log: Logger,
) =>
  server.registerTool(
    'dir_tree',
    {
      description: 'Show the directory tree of a folder inside the configured root',
      inputSchema: DirTreeToolInputSchema,
    },
    withToolLogging(log, 'dir_tree', async ({ path, maxDepth }, ctx) => {
      // logs outcome with ctx.mcpReq.id
      const target = resolveWithinRoot(root, path);
      if (!target)
        return {
          isError: true,
          content: [{ type: 'text', text: 'Path is outside the allowed root.' }],
        };
      const result = await app.getDirTree(
        { path: target, maxDepth },
        { signal: ctx.mcpReq.signal },
      );
      if (result.kind === 'not-found')
        return { isError: true, content: [{ type: 'text', text: `No folder at "${path}".` }] };
      return { content: [{ type: 'text', text: renderTree(result.tree) }] };
    }),
  );

// app/mcp.main.ts
const config = loadFsToolsConfig();
const log = composeLogger(loadLoggingConfig(), 'stderr', 'fs-tools-mcp'); // stdout carries JSON-RPC
const server = composeFsToolsMcpServer({ log, root: config.root }); // the composition registers the tools
await server.connect(new StdioServerTransport());
log.info({ root: config.root }, 'fs-tools MCP server running');
```

### Decisions illustrated

- Two use cases, one feature: shared port, shared vocabulary, shared change. Splitting
  them would force `is-visible.rules.ts` and the port into `libs/shared/` with nothing gained.
- `renderTree` is presentation, so it is a `.format.ts` block, not a core rule.
- The root sandbox exists because a model is the caller; it lives in the MCP adapter. The
  CLI user may browse anywhere.
- `stat` was added to the port for `list-files`. If the port keeps growing for unrelated
  needs, split it into `DirectoryReader` and `FileStat` ports; if the use cases then share
  nothing, that is the signal to consider two features.
- Use cases are tested with `fake-file-system.fake.ts`; no disk access in unit tests.
- Logging stays outside the hexagon: `withToolLogging` logs each tool call, and the MCP
  binary's logger writes to stderr. `delete-files` records deletions through its own
  `FileDeletionAudit` port instead of taking a logger, so its tests use a fake.
- Adding an HTTP API later means `.route.ts` blocks, an `http.server.ts`, and an
  `http.main.ts`. Nothing in `src/lib/core/` changes.

## shop: a justified split with a bridge

An HTTP API where staff manage products and prices, and customers place orders.

- `catalog` owns products and prices. It changes when merchandising changes; "price"
  means the current list price.
- `orders` owns orders and order lines. It changes when checkout rules change; "price"
  means the amount charged, frozen at order time.

Different records, different vocabulary, different reasons to change: two features.
`orders` needs current prices when placing an order.

```
libs/
  catalog/
    src/
      index.ts                         # exports GetPrices, makeGetPrices, makeCatalogRouter
      lib/
        core/ ...                      # product.model, get-prices.use-case, product-store.port
        adapters-driving/ ...          # get-prices.procedure, catalog.router
        adapters-driven/ ...           # in-memory-product-store.repository
  orders/
    src/
      index.ts                         # exports PlaceOrder, PriceLookup, makeOrdersRouter
      lib/
        core/
          price-lookup.port.ts         # orders' own port, in orders' terms
          place-order/place-order.use-case.ts
          place-order/price-order-lines.step.ts  # the private step place-order composes
        adapters-driving/ ...
        adapters-driven/ ...
  shared/
    trpc/
      src/
        index.ts                       # router, publicProcedure, authedProcedure
        lib/adapters-driving/          # one .middleware.ts per export: trpc, router, public-procedure, ...
app/
  catalog-price-lookup.bridge.ts       # implements PriceLookup via catalog's GetPrices
  compose-shop.composition.ts
  app.router.ts
  shop-http.main.ts
```

```ts
// libs/orders/src/lib/core/price-lookup.port.ts
export interface PriceLookup {
  currentPrices(skus: string[]): Promise<Map<string, Money>>;
}

// app/catalog-price-lookup.bridge.ts
import type { GetPrices } from '#libs/catalog';
import type { PriceLookup } from '#libs/orders';

export const makeCatalogPriceLookup = (deps: { getPrices: GetPrices }): PriceLookup => ({
  async currentPrices(skus) {
    const prices = await deps.getPrices({ skus });
    return new Map(prices.map((p) => [p.sku, p.listPrice]));
  },
});

// app/compose-shop.composition.ts (with Postgres adapters; the reference repository wires
// in-memory stores with Awilix)
const getPrices = makeGetPrices({ products: pgProductRepository(db) });
const placeOrder = makePlaceOrder({
  orders: pgOrderRepository(db),
  prices: makeCatalogPriceLookup({ getPrices }),
});
```

### Decisions illustrated

- `orders` never imports `catalog`; the dependency is visible in one place, composition.
- `place-order` builds its `price-order-lines` step from the `PriceLookup` it receives; the
  step is not exported, so a second use case of `orders` can compose it and no procedure can
  call it.
- `orders` does not query the products table even though both features share a database.
- The order line stores the charged price; later catalog changes do not rewrite history.
- If `catalog` later moves to a separate service, the bridge is replaced by an HTTP
  `.gateway.ts` in `orders`; nothing else in `orders` changes.
- If most `orders` use cases needed catalog data, and catalog rarely changed without
  orders changing too, that would be the signal to merge them.
