import { EventEmitter, on } from 'node:events';
import type { OrderEvents } from '../core/order-events.port.ts';
import type { OrderStatusChanged } from '../core/order-status-changed.events.ts';

/**
 * Single-process event log. Replace with Redis or another pub/sub for several instances.
 * @returns An in-memory `OrderEvents` implementation.
 * @failure Publishing never fails; `watch` ends quietly when its signal aborts, and any other error is thrown to the caller.
 */
export const makeInMemoryOrderEvents = (): OrderEvents => {
  const log: OrderStatusChanged[] = [];
  const emitter = new EventEmitter();
  let seq = 0;
  return {
    async publish(event): Promise<void> {
      const full = { ...event, eventId: String(++seq) };
      log.push(full);
      emitter.emit('event', full);
    },
    async *watch(orderId, since, signal): AsyncGenerator<OrderStatusChanged> {
      const after = since === undefined ? 0 : Number(since);
      for (const e of log) if (e.orderId === orderId && Number(e.eventId) > after) yield e;
      try {
        for await (const [e] of on(emitter, 'event', { signal }) as AsyncIterable<
          [OrderStatusChanged]
        >) {
          if (e.orderId === orderId) yield e;
        }
      } catch (error) {
        if (!signal.aborted) throw error;
      }
    },
  };
};
