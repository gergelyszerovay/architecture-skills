import type { OrderStore } from '../core/order-store.port.ts';
import type { Order } from '../core/order.model.ts';

/**
 * Builds a fake `OrderStore` that clones orders on save and read.
 * @returns The fake `OrderStore` and the backing map, for assertions.
 */
export const makeFakeOrderStore = (): { store: OrderStore; saved: Map<string, Order> } => {
  const saved = new Map<string, Order>();
  const store: OrderStore = {
    async save(order): Promise<void> {
      saved.set(order.id, structuredClone(order));
    },
    async get(id): Promise<Order | undefined> {
      const o = saved.get(id);
      return o && structuredClone(o);
    },
  };
  return { store, saved };
};
