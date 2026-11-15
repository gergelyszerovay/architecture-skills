import type { OrderStore } from '../order-store.port.ts';
import type { OrderEvents } from '../order-events.port.ts';
import type { OrderStatusChanged } from '../order-status-changed.events.ts';
import type { WatchOrderInput } from './watch-order.input.ts';
import { OrderNotVisibleError } from '../order-not-visible.error.ts';

/** The watch-order use case contract. */
export type WatchOrder = (
  input: WatchOrderInput,
  ctx: { signal: AbortSignal },
) => AsyncGenerator<OrderStatusChanged>;

/**
 * Streams status changes of the customer's own order until the signal aborts.
 * @param deps - The ports the use case depends on.
 *   - `orders`: Used to check the order belongs to the requesting customer.
 *   - `events`: The event stream to watch.
 * @returns The watch-order use case.
 * @failure A missing order and another customer's order both throw `OrderNotVisibleError` on the first read; an aborted signal ends the stream without an error.
 */
export const makeWatchOrder = ({
  orders,
  events,
}: {
  orders: OrderStore;
  events: OrderEvents;
}): WatchOrder =>
  /**
   * @param input - The order to watch, the requesting customer, and an optional resume point.
   * @param ctx - An abort signal to stop watching.
   * @returns An async generator of the order's status changes; it ends when the signal aborts.
   */
  async function* (
    input: WatchOrderInput,
    ctx: { signal: AbortSignal },
  ): AsyncGenerator<OrderStatusChanged> {
    const order = await orders.get(input.orderId);
    if (order?.customerId !== input.customerId) throw new OrderNotVisibleError();
    yield* events.watch(input.orderId, input.since, ctx.signal);
  };
