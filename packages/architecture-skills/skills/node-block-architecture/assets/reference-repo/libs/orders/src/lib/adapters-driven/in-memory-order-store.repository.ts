import type { OrderStore } from '../core/order-store.port.ts';
import type { Order } from '../core/order.model.ts';

/**
 * Builds an in-memory `OrderStore` that clones orders on save and read.
 * @returns An in-memory `OrderStore` implementation.
 * @failure None: `save` overwrites, and `get` answers `undefined` for an unknown ID.
 */
export const makeInMemoryOrderStore = (): OrderStore => {
  const byId = new Map<string, Order>();
  return {
    async save(order): Promise<void> {
      byId.set(order.id, structuredClone(order));
    },
    async get(id): Promise<Order | undefined> {
      const o = byId.get(id);
      return o && structuredClone(o);
    },
  };
};
