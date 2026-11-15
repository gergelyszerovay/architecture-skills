import { describe, expect, it } from 'vitest';
import { createCallerFactory, router, type TrpcContext } from '#libs/shared/trpc';
import { OrderNotVisibleError } from '../core/order-not-visible.error.ts';
import type { OrderStatusChanged } from '../core/order-status-changed.events.ts';
import type { WatchOrder } from '../core/watch-order/watch-order.use-case.ts';
import type { WatchOrderInput } from '../core/watch-order/watch-order.input.ts';
import { makeWatchOrderProcedure } from './watch-order.procedure.ts';

/** No events: what the failing stub streams before it fails. */
const none: OrderStatusChanged[] = [];

type WatchCaller = {
  watch: (input: { orderId: string; lastEventId?: string }) => Promise<AsyncIterable<unknown>>;
};

/**
 * Builds a caller for the `watch` subscription over a stubbed use case.
 * @param stream - What the stubbed use case streams.
 * @param calls - Receives each input the use case is called with.
 * @param ctx - The request context, holding the identity.
 * @returns The caller.
 */
const setUp = (
  stream: () => AsyncGenerator<OrderStatusChanged>,
  calls: WatchOrderInput[],
  ctx: TrpcContext,
): WatchCaller => {
  const watchOrder: WatchOrder = (input) => {
    calls.push(input);
    return stream();
  };
  return createCallerFactory(router({ watch: makeWatchOrderProcedure({ watchOrder }) }))(ctx);
};

describe('makeWatchOrderProcedure', () => {
  it(
    'streams the changes as tracked events, resuming after the last event ID the client saw',
    {
      tags: ['scenario'],
      meta: {
        spec: 'watch-order-procedure-tracks-events',
        arrange: 'a stubbed use case streaming a `paid` change with event ID 2, and user `c1`',
        act: 'the `watch` subscription is opened for `o1` after event `1`',
        assert:
          'the use case got customer `c1` and the resume point, and the event comes back tracked as ID 2 with its order and status',
      },
    },
    async () => {
      const calls: WatchOrderInput[] = [];
      let caller: WatchCaller;
      let first: IteratorResult<unknown>;
      arrange: {
        caller = setUp(
          async function* () {
            await Promise.resolve();
            yield { eventId: '2', orderId: 'o1', status: 'paid' };
          },
          calls,
          { user: { id: 'c1' } },
        );
      }
      act: {
        const stream = await caller.watch({ orderId: 'o1', lastEventId: '1' });
        first = await stream[Symbol.asyncIterator]().next();
      }
      assert: {
        expect(calls).toEqual([{ orderId: 'o1', customerId: 'c1', since: '1' }]);
        // the server-side caller yields tracked tuples [id, data]; HTTP serializes them as { id, data }; the third item is tRPC's own marker
        expect((first.value as unknown[]).slice(0, 2)).toEqual([
          '2',
          { orderId: 'o1', status: 'paid' },
        ]);
      }
    },
  );

  it(
    'maps an order the caller cannot see to NOT_FOUND',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'watch-order-procedure-not-visible',
        arrange: 'a stubbed use case failing with OrderNotVisibleError, and user `c1`',
        act: 'the `watch` subscription is opened and its first event requested',
        assert: 'the stream fails with NOT_FOUND',
      },
    },
    async () => {
      let caller: WatchCaller;
      let outcome: Promise<IteratorResult<unknown>>;
      arrange: {
        caller = setUp(
          async function* (): AsyncGenerator<OrderStatusChanged> {
            yield* none;
            throw new OrderNotVisibleError();
          },
          [],
          { user: { id: 'c1' } },
        );
      }
      act: {
        const stream = await caller.watch({ orderId: 'o1' });
        outcome = stream[Symbol.asyncIterator]().next();
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'NOT_FOUND' });
      }
    },
  );

  it(
    'requires an identity and does not call the use case without one',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'watch-order-procedure-requires-identity',
        arrange: 'a stubbed use case that must not be called, and a context without a user',
        act: 'the `watch` subscription is opened',
        assert: 'the call fails with UNAUTHORIZED and the use case was not called',
      },
    },
    async () => {
      const calls: WatchOrderInput[] = [];
      let caller: WatchCaller;
      let outcome: Promise<AsyncIterable<unknown>>;
      arrange: {
        caller = setUp(
          async function* () {
            await Promise.resolve();
            yield { eventId: '1', orderId: 'o1', status: 'placed' as const };
          },
          calls,
          {},
        );
      }
      act: {
        outcome = caller.watch({ orderId: 'o1' });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(calls).toEqual([]);
      }
    },
  );
});
