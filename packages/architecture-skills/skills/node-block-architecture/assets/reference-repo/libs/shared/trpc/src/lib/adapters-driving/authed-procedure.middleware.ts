import { TRPCError } from '@trpc/server';
import { publicProcedure } from './public-procedure.middleware.ts';

/** A procedure that requires an authenticated user, narrowing `ctx.user` to defined. */
export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { user: ctx.user } });
});
