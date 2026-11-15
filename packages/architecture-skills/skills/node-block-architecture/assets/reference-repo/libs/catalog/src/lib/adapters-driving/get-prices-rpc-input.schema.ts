import { z } from 'zod';

/** Validates the RPC input for the `prices` query: 1 to 100 SKUs. */
export const GetPricesRpcInputSchema = z.object({ skus: z.array(z.string()).min(1).max(100) });
