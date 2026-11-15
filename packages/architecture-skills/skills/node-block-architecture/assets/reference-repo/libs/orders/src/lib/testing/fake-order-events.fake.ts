import type { OrderEvents } from '../core/order-events.port.ts';
import type { OrderStatusChanged } from '../core/order-status-changed.events.ts';

/**
 * Records published events; `watch` replays those after `since` and ends (no live updates).
 * @returns The fake `OrderEvents` and the events published so far.
 */
export const makeFakeOrderEvents = (): { events: OrderEvents; published: OrderStatusChanged[] } => {
  const published: OrderStatusChanged[] = [];
  const events: OrderEvents = {
    async publish(event): Promise<void> {
      published.push({ ...event, eventId: String(published.length + 1) });
    },
    async *watch(orderId: string, since: string | undefined): AsyncGenerator<OrderStatusChanged> {
      const after = since === undefined ? 0 : Number(since);
      yield* published.filter((e) => e.orderId === orderId && Number(e.eventId) > after);
    },
  };
  return { events, published };
};
