import { router } from '#libs/shared/trpc';
import type { GetPrices } from '../core/get-prices.use-case.ts';
import { makeGetPricesProcedure } from './get-prices.procedure.ts';

/**
 * Builds the catalog library's tRPC router.
 * @param app - The catalog use cases exposed over RPC.
 * @returns The catalog router, with a `prices` procedure.
 */
export const makeCatalogRouter = (app: { getPrices: GetPrices }) =>
  router({ prices: makeGetPricesProcedure(app) });
