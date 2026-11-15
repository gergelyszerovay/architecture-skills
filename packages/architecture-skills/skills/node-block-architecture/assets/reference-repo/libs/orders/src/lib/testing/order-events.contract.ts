import { describe, expect, it } from 'vitest';
import type { OrderEvents } from '../core/order-events.port.ts';
import type { OrderStatusChanged } from '../core/order-status-changed.events.ts';
import { take } from './take.fixture.ts';

/** Builds a fresh `OrderEvents` with nothing published. */
export type OrderEventsContractSetup = () => Promise<OrderEvents>;

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const orderEventsContract = (name: string, setup: OrderEventsContractSetup): void => {
  describe(`OrderEvents contract: ${name}`, () => {
    it(
      'replays the events published for an order, oldest first, each with its own event ID',
      {
        tags: ['scenario'],
        meta: {
          spec: 'order-events-replays-published',
          arrange: 'events `placed` then `paid` published for `o1`',
          act: '`o1` is watched from the start and two events are read',
          assert: 'the statuses are `placed`, `paid`, with different event IDs',
        },
      },
      async () => {
        let events: OrderEvents;
        let seen: OrderStatusChanged[];
        arrange: {
          events = await setup();
          await events.publish({ orderId: 'o1', status: 'placed' });
          await events.publish({ orderId: 'o1', status: 'paid' });
        }
        act: {
          seen = await take(events.watch('o1', undefined, new AbortController().signal), 2);
        }
        assert: {
          expect(seen.map((e) => e.status)).toEqual(['placed', 'paid']);
          expect(new Set(seen.map((e) => e.eventId)).size).toBe(2);
        }
      },
    );

    it(
      'resumes after the event a watcher last saw',
      {
        tags: ['scenario'],
        meta: {
          spec: 'order-events-resumes-after-since',
          arrange: 'events `placed`, `paid` and `shipped` published for `o1`',
          act: '`o1` is watched from the ID of the `placed` event and one event is read',
          assert: 'the event is `paid`',
        },
      },
      async () => {
        let events: OrderEvents;
        let seen: OrderStatusChanged[];
        arrange: {
          events = await setup();
          await events.publish({ orderId: 'o1', status: 'placed' });
          await events.publish({ orderId: 'o1', status: 'paid' });
          await events.publish({ orderId: 'o1', status: 'shipped' });
        }
        act: {
          const [first] = await take(
            events.watch('o1', undefined, new AbortController().signal),
            1,
          );
          seen = await take(events.watch('o1', first?.eventId, new AbortController().signal), 1);
        }
        assert: {
          expect(seen.map((e) => e.status)).toEqual(['paid']);
        }
      },
    );

    it(
      "does not deliver another order's events",
      {
        tags: ['edge-case'],
        meta: {
          spec: 'order-events-scoped-to-order',
          arrange: 'events published for `o1` and for `o2`',
          act: '`o2` is watched and one event is read',
          assert: 'the event belongs to `o2`',
        },
      },
      async () => {
        let events: OrderEvents;
        let seen: OrderStatusChanged[];
        arrange: {
          events = await setup();
          await events.publish({ orderId: 'o1', status: 'placed' });
          await events.publish({ orderId: 'o2', status: 'paid' });
        }
        act: {
          seen = await take(events.watch('o2', undefined, new AbortController().signal), 1);
        }
        assert: {
          expect(seen.map((e) => [e.orderId, e.status])).toEqual([['o2', 'paid']]);
        }
      },
    );

    it(
      'ends without an error once its signal aborts',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'order-events-ends-on-abort',
          arrange: 'a watcher of `o1` that has read its one event, and its signal aborted',
          act: 'the next event is requested',
          assert: 'the stream is done and nothing was thrown',
        },
      },
      async () => {
        let stream: AsyncIterator<OrderStatusChanged>;
        let controller: AbortController;
        let next: IteratorResult<OrderStatusChanged>;
        arrange: {
          const events = await setup();
          await events.publish({ orderId: 'o1', status: 'placed' });
          controller = new AbortController();
          stream = events.watch('o1', undefined, controller.signal)[Symbol.asyncIterator]();
          await stream.next();
          controller.abort();
        }
        act: {
          next = await stream.next();
        }
        assert: {
          expect(next.done).toBe(true);
        }
      },
    );
  });
};
