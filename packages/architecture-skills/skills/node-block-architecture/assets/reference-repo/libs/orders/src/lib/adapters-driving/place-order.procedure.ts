import { TRPCError } from '@trpc/server';
import { authedProcedure } from '#libs/shared/trpc';
import type { PlaceOrder } from '../core/place-order/place-order.use-case.ts';
import { PlaceOrderRpcInputSchema } from './place-order-rpc-input.schema.ts';

/**
 * Builds the tRPC procedure that exposes {@link PlaceOrder} over RPC.
 * @param app - The orders use case to call.
 * @returns An authenticated tRPC mutation procedure.
 */
export const makePlaceOrderProcedure = (app: { placeOrder: PlaceOrder }) =>
  authedProcedure.input(PlaceOrderRpcInputSchema).mutation(async ({ input, ctx }) => {
    const result = await app.placeOrder({ customerId: ctx.user.id, lines: input.lines });
    if (result.kind === 'unknown-products') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unknown products: ${result.skus.join(', ')}`,
      });
    }
    return { orderId: result.orderId, total: result.total };
  });
