import { publicProcedure } from '#libs/shared/trpc';
import type { GetPrices } from '../core/get-prices.use-case.ts';
import { GetPricesRpcInputSchema } from './get-prices-rpc-input.schema.ts';

/**
 * Builds the tRPC procedure that exposes {@link GetPrices} over RPC.
 * @param app - The catalog use case to call.
 * @returns A public tRPC query procedure.
 */
export const makeGetPricesProcedure = (app: { getPrices: GetPrices }) =>
  publicProcedure.input(GetPricesRpcInputSchema).query(({ input }) => app.getPrices(input));
