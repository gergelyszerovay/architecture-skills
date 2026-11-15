import { logCall } from './log-call.middleware.ts';
import { trpc } from './trpc.middleware.ts';

/** The base tRPC procedure, with call logging applied. */
export const publicProcedure = trpc.procedure.use(logCall);
