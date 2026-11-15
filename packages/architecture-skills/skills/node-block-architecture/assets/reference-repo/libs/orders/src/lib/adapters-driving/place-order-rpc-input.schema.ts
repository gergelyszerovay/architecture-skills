import { z } from 'zod';

/** Validates the RPC input for the `place` mutation. */
export const PlaceOrderRpcInputSchema = z.object({
  lines: z.array(z.object({ sku: z.string(), quantity: z.number().int().positive() })).min(1),
});
