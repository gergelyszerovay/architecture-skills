import { describe, expect, it } from 'vitest';
import { collect } from '../../testing/collect.fixture.ts';
import { makeFakeOrderEvents } from '../../testing/fake-order-events.fake.ts';
import { makeFakeOrderStore } from '../../testing/fake-order-store.fake.ts';
import { OrderNotVisibleError } from '../order-not-visible.error.ts';
import type { Order } from '../order.model.ts';
import type { OrderStatusChanged } from '../order-status-changed.events.ts';
import { makeWatchOrder } from './watch-order.use-case.ts';

const order: Order = { id: 'o1', customerId: 'c1', lines: [], status: 'placed' };
const signal = new AbortController().signal;

describe('makeWatchOrder', () => {
  it(
    "streams the status changes of the customer's own order",
    {
      tags: ['scenario'],
      meta: {
        spec: 'watch-order-streams-own-events',
        arrange: 'order `o1` of customer `c1`, with `placed` and `paid` events published',
        act: 'customer `c1` watches `o1`',
        assert: 'the `placed` and `paid` changes are streamed in order',
      },
    },
    async () => {
      let watchOrder: ReturnType<typeof makeWatchOrder>;
      let seen: OrderStatusChanged[];
      arrange: {
        const orders = makeFakeOrderStore();
        const events = makeFakeOrderEvents();
        await orders.store.save(order);
        await events.events.publish({ orderId: 'o1', status: 'placed' });
        await events.events.publish({ orderId: 'o1', status: 'paid' });
        watchOrder = makeWatchOrder({ orders: orders.store, events: events.events });
      }
      act: {
        seen = await collect(watchOrder({ orderId: 'o1', customerId: 'c1' }, { signal }));
      }
      assert: {
        expect(seen.map((e) => e.status)).toEqual(['placed', 'paid']);
      }
    },
  );

  it(
    "hides another customer's order as if it did not exist",
    {
      tags: ['edge-case'],
      meta: {
        spec: 'watch-order-other-customer',
        arrange: 'order `o1` of customer `c1`',
        act: 'customer `c2` watches `o1`',
        assert: 'the stream fails with OrderNotVisibleError',
      },
    },
    async () => {
      let watchOrder: ReturnType<typeof makeWatchOrder>;
      let outcome: Promise<OrderStatusChanged[]>;
      arrange: {
        const orders = makeFakeOrderStore();
        await orders.store.save(order);
        watchOrder = makeWatchOrder({ orders: orders.store, events: makeFakeOrderEvents().events });
      }
      act: {
        outcome = collect(watchOrder({ orderId: 'o1', customerId: 'c2' }, { signal }));
      }
      assert: {
        await expect(outcome).rejects.toBeInstanceOf(OrderNotVisibleError);
      }
    },
  );

  it(
    'fails the same way for an order that does not exist',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'watch-order-unknown-order',
        arrange: 'an empty order store',
        act: 'customer `c1` watches `nope`',
        assert: 'the stream fails with OrderNotVisibleError',
      },
    },
    async () => {
      let watchOrder: ReturnType<typeof makeWatchOrder>;
      let outcome: Promise<OrderStatusChanged[]>;
      arrange: {
        watchOrder = makeWatchOrder({
          orders: makeFakeOrderStore().store,
          events: makeFakeOrderEvents().events,
        });
      }
      act: {
        outcome = collect(watchOrder({ orderId: 'nope', customerId: 'c1' }, { signal }));
      }
      assert: {
        await expect(outcome).rejects.toBeInstanceOf(OrderNotVisibleError);
      }
    },
  );
});
