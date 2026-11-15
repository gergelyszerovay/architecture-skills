import { z } from 'zod';

/** Validates the RPC input for the `watch` subscription. */
export const WatchOrderRpcInputSchema = z.object({
  orderId: z.string(),
  lastEventId: z.string().nullish(),
});
