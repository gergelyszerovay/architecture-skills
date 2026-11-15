import { router } from '#libs/shared/trpc';
import { makeCatalogRouter, type GetPrices } from '#libs/catalog';
import { makeOrdersRouter, type PlaceOrder, type WatchOrder } from '#libs/orders';

/**
 * Builds the shop's tRPC app router from its composed use cases.
 * @param app - The composed shop use cases.
 * @returns The combined catalog and orders router.
 */
export const makeAppRouter = (app: {
  getPrices: GetPrices;
  placeOrder: PlaceOrder;
  watchOrder: WatchOrder;
}) => router({ catalog: makeCatalogRouter(app), orders: makeOrdersRouter(app) });

/** The shop's tRPC app router type, used to build a client or caller. */
export type AppRouter = ReturnType<typeof makeAppRouter>;
