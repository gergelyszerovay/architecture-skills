import { TRPCError, tracked } from '@trpc/server';
import { authedProcedure } from '#libs/shared/trpc';
import type { WatchOrder } from '../core/watch-order/watch-order.use-case.ts';
import { OrderNotVisibleError } from '../core/order-not-visible.error.ts';
import { WatchOrderRpcInputSchema } from './watch-order-rpc-input.schema.ts';

/**
 * Builds the tRPC procedure that exposes {@link WatchOrder} over RPC.
 * @param app - The orders use case to call.
 * @returns An authenticated tRPC subscription procedure.
 */
export const makeWatchOrderProcedure = (app: { watchOrder: WatchOrder }) =>
  authedProcedure.input(WatchOrderRpcInputSchema).subscription(async function* ({
    input,
    ctx,
    signal,
  }) {
    const updates = app.watchOrder(
      { orderId: input.orderId, customerId: ctx.user.id, since: input.lastEventId ?? undefined },
      { signal: signal ?? new AbortController().signal },
    );
    try {
      for await (const u of updates)
        yield tracked(u.eventId, { orderId: u.orderId, status: u.status });
    } catch (error) {
      if (error instanceof OrderNotVisibleError)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      throw error;
    }
  });
