# Entry points: tRPC

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## tRPC

A `.procedure.ts` block is a driving adapter; a `.router.ts` block is a feature's router
factory; the app router is merged in `app/`.

```ts
// libs/orders/src/lib/adapters-driving/place-order.procedure.ts
export const makePlaceOrderProcedure = (app: { placeOrder: PlaceOrder }) =>
  authedProcedure
    .input(PlaceOrderRpcInputSchema) // transport .schema.ts
    .mutation(async ({ input, ctx }) => {
      const result = await app.placeOrder({ ...input, customerId: ctx.user.id });
      return toTrpcResult(result); // owned result, or TRPCError
    });

// libs/orders/src/lib/adapters-driving/orders.router.ts
export const makeOrdersRouter = (app: { placeOrder: PlaceOrder; watchOrder: WatchOrder }) =>
  router({
    place: makePlaceOrderProcedure(app),
    watch: makeWatchOrderProcedure(app),
  });

// app/app.router.ts
export const makeAppRouter = (app: ShopApp) =>
  router({ orders: makeOrdersRouter(app), catalog: makeCatalogRouter(app) });
export type AppRouter = ReturnType<typeof makeAppRouter>;
```

- **Output types are public contracts.** Clients infer types from what procedures
  return. Return owned `.result.ts` contracts, never entities, ORM rows, or SDK objects;
  map in the procedure when they differ.
- **Context carries transport data only.** `createContext` authenticates and exposes
  identity, request ID, and a child logger bound to that ID. Never put a database client, repository, or use case on the
  context; procedures receive use cases through their factory. `ctx.db` in a handler
  bypasses the hexagon.
- **Pass identity explicitly.** Copy what the use case needs from `ctx` into its input
  or context argument; use cases never receive `ctx`.
- **Errors.** Map domain outcomes to `TRPCError` codes in one shared `.format.ts` helper: invalid input
  `BAD_REQUEST`, not found `NOT_FOUND`, forbidden `FORBIDDEN`, conflict `CONFLICT`,
  unavailable `SERVICE_UNAVAILABLE` or `TOO_MANY_REQUESTS`, unexpected
  `INTERNAL_SERVER_ERROR` with a generic message. Use `errorFormatter` only for shaping,
  not for business decisions.
- **Middleware.** `t.middleware` and base procedures (`publicProcedure`,
  `authedProcedure`) are `.middleware.ts` responsibilities. The shared tRPC instance is
  `trpc.middleware.ts`; when one file exports both `router` and `procedure` from it, they are
  a coupled pair ([declarations.md](declarations.md)). One logging middleware on
  the base procedure logs every call's path, outcome (`ok` or the `TRPCError` code), and
  duration through `ctx.log`; procedures do not log. See the logging rules in
  [operations.md](operations.md).
- **Sharing the router type.** Export `AppRouter` as a type from the package's public
  entry; clients use `import type` only and never import server runtime code. Set a data
  transformer (for example superjson) when contracts contain dates or maps.

### tRPC streaming

- **Subscriptions** are async generator procedures over SSE or WebSocket. The use case
  returns an `AsyncIterable` of owned types; the procedure maps and yields each item and
  holds no emitters or listeners.
- **Streamed queries and mutations** (async iterables over the streaming batch link)
  follow the same rule.
- **Cancellation.** Pass the procedure's `signal` into the use case as a context
  argument. The use case stops iterating on abort and releases listeners, cursors, and
  subscriptions in `finally`.
- **Server-initiated events** come through a secondary port (`OrderEvents.watch(id)`)
  whose adapter is in-memory for one instance and Redis or another pub/sub for several.
- **Testing.** Test procedures through `createCallerFactory` with the composed app. A
  server-side caller yields tracked items as `[id, data]` tuples; the HTTP transport
  serializes them as `{ id, data }` (SSE `id:` lines).
- **Resumption.** `tracked(id, data)` and `lastEventId` are transport mechanics, but the
  ids must come from domain events or the event store so a reconnecting client resumes
  from a real position. The use case accepts a `since` position in its input.

```ts
// libs/orders/src/lib/adapters-driving/watch-order.procedure.ts
export const makeWatchOrderProcedure = (app: { watchOrder: WatchOrder }) =>
  authedProcedure.input(WatchOrderRpcInputSchema).subscription(async function* ({
    input,
    ctx,
    signal,
  }) {
    const updates = app.watchOrder(
      { orderId: input.orderId, customerId: ctx.user.id, since: input.lastEventId ?? undefined },
      { signal: signal ?? new AbortController().signal }, // signal is optional in the type
    );
    for await (const update of updates) yield tracked(update.eventId, toOrderStatusView(update));
  });
```
