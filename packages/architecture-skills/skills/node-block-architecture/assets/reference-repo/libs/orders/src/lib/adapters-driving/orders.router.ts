import { router } from '#libs/shared/trpc';
import type { PlaceOrder } from '../core/place-order/place-order.use-case.ts';
import type { WatchOrder } from '../core/watch-order/watch-order.use-case.ts';
import { makePlaceOrderProcedure } from './place-order.procedure.ts';
import { makeWatchOrderProcedure } from './watch-order.procedure.ts';

/**
 * Builds the orders library's tRPC router.
 * @param app - The orders use cases exposed over RPC.
 * @returns The orders router, with `place` and `watch` procedures.
 */
export const makeOrdersRouter = (app: { placeOrder: PlaceOrder; watchOrder: WatchOrder }) =>
  router({ place: makePlaceOrderProcedure(app), watch: makeWatchOrderProcedure(app) });
