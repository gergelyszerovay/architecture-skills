import { describe, expect, it } from 'vitest';
import type { OrderStore } from '../core/order-store.port.ts';
import type { Order } from '../core/order.model.ts';

/** Builds a fresh, empty `OrderStore`. */
export type OrderStoreContractSetup = () => Promise<OrderStore>;

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const orderStoreContract = (name: string, setup: OrderStoreContractSetup): void => {
  describe(`OrderStore contract: ${name}`, () => {
    /**
     * Builds a one-line order `o1` of customer `c1`.
     * @param status - The order's status.
     * @returns The order.
     */
    const order = (status: Order['status']): Order => ({
      id: 'o1',
      customerId: 'c1',
      lines: [{ sku: 'tea', quantity: 2, unitPrice: { amount: 450, currency: 'EUR' } }],
      status,
    });

    it(
      'reads back an order it saved',
      {
        tags: ['scenario'],
        meta: {
          spec: 'order-store-round-trip',
          arrange: 'an empty store',
          act: 'order `o1` is saved and read back',
          assert: 'the read order equals the saved one',
        },
      },
      async () => {
        let store: OrderStore;
        let read: Order | undefined;
        arrange: {
          store = await setup();
        }
        act: {
          await store.save(order('placed'));
          read = await store.get('o1');
        }
        assert: {
          expect(read).toEqual(order('placed'));
        }
      },
    );

    it(
      'overwrites an order saved again under the same ID',
      {
        tags: ['scenario'],
        meta: {
          spec: 'order-store-overwrites',
          arrange: 'a store holding `o1` as placed',
          act: '`o1` is saved again as paid, then read',
          assert: 'the read order is paid',
        },
      },
      async () => {
        let store: OrderStore;
        let read: Order | undefined;
        arrange: {
          store = await setup();
          await store.save(order('placed'));
        }
        act: {
          await store.save(order('paid'));
          read = await store.get('o1');
        }
        assert: {
          expect(read?.status).toBe('paid');
        }
      },
    );

    it(
      'answers undefined for an unknown ID instead of failing',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'order-store-unknown-id',
          arrange: 'an empty store',
          act: '`nope` is read',
          assert: 'the answer is undefined',
        },
      },
      async () => {
        let store: OrderStore;
        let read: Order | undefined;
        arrange: {
          store = await setup();
        }
        act: {
          read = await store.get('nope');
        }
        assert: {
          expect(read).toBeUndefined();
        }
      },
    );

    it(
      'keeps the stored order apart from the copies callers hold',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'order-store-isolates-copies',
          arrange: 'a store holding `o1` as placed',
          act: 'the order read back is changed to shipped, then `o1` is read again',
          assert: 'the second read is still placed',
        },
      },
      async () => {
        let store: OrderStore;
        let again: Order | undefined;
        arrange: {
          store = await setup();
          await store.save(order('placed'));
        }
        act: {
          const first = await store.get('o1');
          if (first) first.status = 'shipped';
          again = await store.get('o1');
        }
        assert: {
          expect(again?.status).toBe('placed');
        }
      },
    );
  });
};
