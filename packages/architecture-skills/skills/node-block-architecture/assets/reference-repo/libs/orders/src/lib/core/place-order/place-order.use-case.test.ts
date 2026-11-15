import { describe, expect, it } from 'vitest';
import { makeFakeIdGenerator } from '../../testing/fake-id-generator.fake.ts';
import { makeFakeOrderEvents } from '../../testing/fake-order-events.fake.ts';
import { makeFakeOrderStore } from '../../testing/fake-order-store.fake.ts';
import { makeFakePriceLookup } from '../../testing/fake-price-lookup.fake.ts';
import type { OrderEvents } from '../order-events.port.ts';
import type { OrderStore } from '../order-store.port.ts';
import { makePlaceOrder } from './place-order.use-case.ts';
import type { PlaceOrderResult } from './place-order.result.ts';

const prices = makeFakePriceLookup({ tea: { amount: 450, currency: 'EUR' } });

describe('makePlaceOrder', () => {
  it(
    'freezes current prices on the order and totals them',
    {
      tags: ['scenario'],
      meta: {
        spec: 'place-order-freezes-prices',
        arrange: 'a price lookup pricing `tea` at 450 EUR, and empty order and event stores',
        act: 'customer `c1` places an order for two `tea`',
        assert:
          'the result names order `o1` with a total of 900 EUR, the saved line keeps the 450 price, and one `placed` event is published',
      },
    },
    async () => {
      let orders: ReturnType<typeof makeFakeOrderStore>;
      let events: ReturnType<typeof makeFakeOrderEvents>;
      let result: PlaceOrderResult;
      arrange: {
        orders = makeFakeOrderStore();
        events = makeFakeOrderEvents();
      }
      act: {
        result = await makePlaceOrder({
          orders: orders.store,
          prices,
          events: events.events,
          ids: makeFakeIdGenerator(),
        })({ customerId: 'c1', lines: [{ sku: 'tea', quantity: 2 }] });
      }
      assert: {
        expect(result).toEqual({
          kind: 'placed',
          orderId: 'o1',
          total: { amount: 900, currency: 'EUR' },
        });
        expect(orders.saved.get('o1')?.lines[0]?.unitPrice.amount).toBe(450);
        expect(events.published.map((e) => e.status)).toEqual(['placed']);
      }
    },
  );

  it(
    'rejects unknown products without saving or publishing anything',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-unknown-products',
        arrange: 'a price lookup that does not know `nope`, and empty order and event stores',
        act: 'customer `c1` places an order for `nope`',
        assert: 'the result is `unknown-products` naming `nope`, and nothing is saved or published',
      },
    },
    async () => {
      let orders: ReturnType<typeof makeFakeOrderStore>;
      let events: ReturnType<typeof makeFakeOrderEvents>;
      let result: PlaceOrderResult;
      arrange: {
        orders = makeFakeOrderStore();
        events = makeFakeOrderEvents();
      }
      act: {
        result = await makePlaceOrder({
          orders: orders.store,
          prices,
          events: events.events,
          ids: makeFakeIdGenerator(),
        })({
          customerId: 'c1',
          lines: [{ sku: 'nope', quantity: 1 }],
        });
      }
      assert: {
        expect(result).toEqual({ kind: 'unknown-products', skus: ['nope'] });
        expect(orders.saved.size).toBe(0);
        expect(events.published).toEqual([]);
      }
    },
  );

  it(
    'throws a store failure to the caller and publishes no event',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-save-failure-thrown',
        arrange: 'an order store whose saves fail with a database error',
        act: 'customer `c1` places an order for `tea`',
        assert: 'the database error is thrown and no event is published',
      },
    },
    async () => {
      let orders: OrderStore;
      let events: ReturnType<typeof makeFakeOrderEvents>;
      let outcome: Promise<PlaceOrderResult>;
      arrange: {
        orders = {
          ...makeFakeOrderStore().store,
          save: (): Promise<never> => Promise.reject(new Error('db down')),
        };
        events = makeFakeOrderEvents();
      }
      act: {
        outcome = makePlaceOrder({
          orders,
          prices,
          events: events.events,
          ids: makeFakeIdGenerator(),
        })({
          customerId: 'c1',
          lines: [{ sku: 'tea', quantity: 1 }],
        });
      }
      assert: {
        await expect(outcome).rejects.toThrow('db down');
        expect(events.published).toEqual([]);
      }
    },
  );

  it(
    'leaves the saved order in place when publishing its event fails',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-publish-failure-keeps-order',
        arrange: 'an event port whose publishing fails, and an empty order store',
        act: 'customer `c1` places an order for `tea`',
        assert: 'the publishing error is thrown and order `o1` is still saved',
      },
    },
    async () => {
      let orders: ReturnType<typeof makeFakeOrderStore>;
      let events: OrderEvents;
      let outcome: Promise<PlaceOrderResult>;
      arrange: {
        orders = makeFakeOrderStore();
        events = {
          ...makeFakeOrderEvents().events,
          publish: (): Promise<never> => Promise.reject(new Error('bus down')),
        };
      }
      act: {
        outcome = makePlaceOrder({
          orders: orders.store,
          prices,
          events,
          ids: makeFakeIdGenerator(),
        })({
          customerId: 'c1',
          lines: [{ sku: 'tea', quantity: 1 }],
        });
      }
      assert: {
        await expect(outcome).rejects.toThrow('bus down');
        expect(orders.saved.has('o1')).toBe(true);
      }
    },
  );
});
