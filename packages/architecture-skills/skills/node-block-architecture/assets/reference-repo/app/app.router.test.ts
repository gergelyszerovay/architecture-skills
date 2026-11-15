import { describe, expect, it } from 'vitest';
import { pino, type Logger } from 'pino';
import { createCallerFactory, type TrpcContext } from '#libs/shared/trpc';
import { composeShop } from './compose-shop.composition.ts';
import { makeAppRouter } from './app.router.ts';

type ShopCaller = ReturnType<
  typeof createCallerFactory<ReturnType<typeof makeAppRouter>['_def']['record']>
>;

/**
 * Composes the shop with one product and builds callers for its router.
 * @returns A caller factory over the shop's router, and the composition's disposer.
 */
const setUp = (): { caller: ShopCaller; dispose: () => Promise<void> } => {
  const { app, dispose } = composeShop({
    seedProducts: [{ sku: 'tea', name: 'Tea', listPrice: { amount: 450, currency: 'EUR' } }],
  });
  return { caller: createCallerFactory(makeAppRouter(app)), dispose };
};

/**
 * Builds a logger that keeps every entry it writes, parsed.
 * @returns The logger and the entries written so far.
 */
const captureLog = (): { log: Logger; lines: Record<string, unknown>[] } => {
  const lines: Record<string, unknown>[] = [];
  const log = pino(
    { base: null, timestamp: false },
    { write: (line: string) => void lines.push(JSON.parse(line) as Record<string, unknown>) },
  );
  return { log, lines };
};

describe('the shop router, composed with its real use cases', () => {
  it(
    'places an order through the bridge using catalog prices',
    {
      tags: ['scenario'],
      meta: {
        spec: 'shop-places-order-with-catalog-prices',
        arrange: 'the shop composed with `tea` at 450 EUR, and user `c1`',
        act: 'the user places an order for two `tea`',
        assert: 'the total is 900 EUR',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let result: { total: unknown };
      arrange: {
        shop = setUp();
      }
      act: {
        result = await shop.caller({ user: { id: 'c1' } }).orders.place({
          lines: [{ sku: 'tea', quantity: 2 }],
        });
      }
      assert: {
        expect(result.total).toEqual({ amount: 900, currency: 'EUR' });
        await shop.dispose();
      }
    },
  );

  it(
    'maps unknown products to BAD_REQUEST',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-unknown-product-bad-request',
        arrange: 'the shop composed with `tea` only, and user `c1`',
        act: 'the user places an order for `x`',
        assert: 'the call fails with BAD_REQUEST',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let outcome: Promise<unknown>;
      arrange: {
        shop = setUp();
      }
      act: {
        outcome = shop.caller({ user: { id: 'c1' } }).orders.place({
          lines: [{ sku: 'x', quantity: 1 }],
        });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await shop.dispose();
      }
    },
  );

  it(
    'maps a missing identity to UNAUTHORIZED',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-missing-identity-unauthorized',
        arrange: 'the shop composed with `tea`',
        act: 'a caller without a user places an order for `tea`',
        assert: 'the call fails with UNAUTHORIZED',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let outcome: Promise<unknown>;
      arrange: {
        shop = setUp();
      }
      act: {
        outcome = shop.caller({}).orders.place({ lines: [{ sku: 'tea', quantity: 1 }] });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await shop.dispose();
      }
    },
  );

  it(
    'streams the order status as tracked events to its owner',
    {
      tags: ['scenario'],
      meta: {
        spec: 'shop-streams-order-status',
        arrange: 'an order `o` placed by user `c1`',
        act: 'user `c1` watches the order and reads its first event',
        assert: 'the event is tracked with ID `1` and carries the order ID and status `placed`',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let orderId: string;
      let first: IteratorResult<unknown>;
      const ac = new AbortController();
      arrange: {
        shop = setUp();
        orderId = (
          await shop.caller({ user: { id: 'c1' } }).orders.place({
            lines: [{ sku: 'tea', quantity: 1 }],
          })
        ).orderId;
      }
      act: {
        const stream = await shop
          .caller({ user: { id: 'c1' } } satisfies TrpcContext, { signal: ac.signal })
          .orders.watch({ orderId });
        first = await stream[Symbol.asyncIterator]().next();
        ac.abort();
      }
      assert: {
        // the server-side caller yields tracked tuples [id, data]; HTTP serializes them as { id, data }; the third item is tRPC's own marker
        expect((first.value as unknown[]).slice(0, 2)).toEqual([
          '1',
          { orderId, status: 'placed' },
        ]);
        await shop.dispose();
      }
    },
  );

  it(
    "hides another customer's order",
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-hides-other-customers-order',
        arrange: 'an order placed by user `c1`',
        act: 'user `c2` watches it and reads its first event',
        assert: 'the stream fails with NOT_FOUND',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let outcome: Promise<IteratorResult<unknown>>;
      arrange: {
        shop = setUp();
      }
      act: {
        const { orderId } = await shop.caller({ user: { id: 'c1' } }).orders.place({
          lines: [{ sku: 'tea', quantity: 1 }],
        });
        const stream = await shop.caller({ user: { id: 'c2' } }).orders.watch({ orderId });
        outcome = stream[Symbol.asyncIterator]().next();
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await shop.dispose();
      }
    },
  );

  it(
    "logs each call's outcome with the request ID from the context",
    {
      tags: ['scenario'],
      meta: {
        spec: 'shop-logs-calls-with-request-id',
        arrange: 'the shop composed, and request loggers bound to `r1` and `r2`',
        act: 'user `c1` places an order under `r1`, and a caller without a user tries under `r2`',
        assert:
          'two entries carry the request IDs, the path and the outcomes `ok` and `UNAUTHORIZED`',
      },
    },
    async () => {
      let shop: ReturnType<typeof setUp>;
      let captured: ReturnType<typeof captureLog>;
      arrange: {
        shop = setUp();
        captured = captureLog();
      }
      act: {
        await shop
          .caller({ user: { id: 'c1' }, log: captured.log.child({ requestId: 'r1' }) })
          .orders.place({ lines: [{ sku: 'tea', quantity: 1 }] });
        await shop
          .caller({ log: captured.log.child({ requestId: 'r2' }) })
          .orders.place({ lines: [{ sku: 'tea', quantity: 1 }] })
          .catch(() => undefined);
      }
      assert: {
        expect(
          captured.lines.map(({ requestId, path, outcome }) => ({ requestId, path, outcome })),
        ).toEqual([
          { requestId: 'r1', path: 'orders.place', outcome: 'ok' },
          { requestId: 'r2', path: 'orders.place', outcome: 'UNAUTHORIZED' },
        ]);
        await shop.dispose();
      }
    },
  );
});
