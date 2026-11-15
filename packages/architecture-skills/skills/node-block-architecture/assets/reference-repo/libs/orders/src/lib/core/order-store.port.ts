import type { Order } from './order.model.ts';

/**
 * The port for persisting and retrieving orders.
 * @failure An unknown ID is not a failure (`get` answers `undefined`); infrastructure failures are thrown unchanged.
 */
export interface OrderStore {
  /**
   * Saves an order, creating or overwriting it.
   * @param order - The order to save.
   * @returns Resolves once saved.
   */
  save(order: Order): Promise<void>;
  /**
   * Retrieves an order by ID.
   * @param id - The order's ID.
   * @returns The order, or `undefined` when not found.
   */
  get(id: string): Promise<Order | undefined>;
}
