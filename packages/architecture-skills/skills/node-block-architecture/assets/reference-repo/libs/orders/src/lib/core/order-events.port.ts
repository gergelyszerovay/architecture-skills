import type { OrderStatusChanged } from './order-status-changed.events.ts';

/**
 * The port for publishing and watching order status changes.
 * @failure Publishing failures are thrown to the caller; `watch` ends without an error when its signal aborts.
 */
export interface OrderEvents {
  /**
   * Publishes a status change for an order.
   * @param event - The status change to publish.
   * @returns Resolves once published.
   */
  publish(event: Omit<OrderStatusChanged, 'eventId'>): Promise<void>;
  /** Events for one order, starting after `since` when given; ends when `signal` aborts. */
  watch(
    orderId: string,
    since: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<OrderStatusChanged>;
}
