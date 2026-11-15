# Frameworks as adapter hosts

A framework hosts driving adapters and may provide wiring. It stays outside the hexagon.

## NestJS

- Controllers, resolvers, WebSocket gateways, and MCP-Nest tool classes are driving
  adapters. Keep them thin: validate, call one use case, map the outcome. Name Nest
  WebSocket gateways `.socket.ts` (class name may keep the `Gateway` suffix Nest uses);
  in this skill `.gateway.ts` is always a driven adapter.
- Nest modules are composition. Bind ports to adapters with injection tokens:
  `{ provide: ORDER_REPOSITORY, useClass: PgOrderRepository }`, and build use cases with
  `useFactory`, so use-case files need no decorators.
- Guards, pipes, interceptors, and exception filters are transport concerns
  (`.middleware.ts` responsibilities). Exception filters perform outcome mapping.
- Keep domain and application code free of `@nestjs/*` imports and decorators. Test them
  without `Test.createTestingModule`.
- Nest suits long-running servers. For short-lived CLIs and small stdio MCP servers,
  prefer plain composition; use `nest-commander` or MCP-Nest when the binary is a
  companion to an existing Nest application.

## Fastify

Register each feature's routes as an encapsulated plugin created by a `.server.ts` block
that receives the feature's use cases. Use Fastify schemas or a type provider for
transport validation. Decorate the instance only with transport concerns, not use cases
as global state.

## Hono and Express

Create routers per feature in driving adapters and mount them in `.server.ts`. Keep
`req`/`res`/`Context` inside driving adapters.

## DI containers

Use plain composition by default: the composition root calls factories by hand, and the
compiler checks the whole graph. When it grows, split it first by context: one
`compose-<context>.composition.ts` per row of the package doc's Contexts table, each returning
that context's use cases, called by the root composition with the shared resources and the
bridges between contexts. Move to Awilix when that still grows past what is comfortable to
read. Its PROXY injection mode calls each factory with one dependency
object, which matches the `makeX({ deps })` convention, so use cases and adapters do not
change.

```ts
// app/compose-shop.composition.ts: the only file that imports awilix
const container = createContainer<ShopCradle>({ injectionMode: InjectionMode.PROXY, strict: true });
container.register({
  db: asFunction(() => createPool(config.db))
    .singleton()
    .disposer((p) => p.end()),
  orders: asFunction(pgOrderRepository).singleton(),
  getPrices: asFunction(makeGetPrices).singleton(),
  prices: asFunction(makeCatalogPriceLookup).singleton(),
  placeOrder: asFunction(makePlaceOrder).singleton(),
});
// shutdown: await container.dispose();
```

Rules:

- The container lives only in composition files. Nothing inside the hexagon imports it,
  uses decorators for it, or calls `inject()`.
- Nothing resolves from the container at call time, and the container or its cradle never
  appears in a use-case or adapter signature. Resolve the composed use cases once and hand
  them to driving adapters.
- Register process resources as singletons with disposers and dispose the container on
  shutdown. Do not use request scopes; pass request data in the input or a context
  argument.
- Split registration per feature (`registerOrders(container)`), keeping bridges in
  `app/`.
- The cradle type is declared by hand, so a missing registration fails only at runtime.
  Add a startup or test check that resolves every registration.
- Tests call factories directly with fakes; they do not build the container.

Other containers: typed-inject checks the graph at compile time but uses positional
arguments, so factories adapt to its `tokens(...)` convention. Class- and
decorator-centric containers (InversifyJS, tsyringe, Needle DI) fit only if the
project's adapters are classes, and then only outside the hexagon. When NestJS hosts the
app, its DI is the container; the same rules apply.
