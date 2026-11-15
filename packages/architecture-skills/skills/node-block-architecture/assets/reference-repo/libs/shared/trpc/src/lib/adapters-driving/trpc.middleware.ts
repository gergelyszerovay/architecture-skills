import { initTRPC } from '@trpc/server';
import type { TrpcContext } from './trpc-context.middleware.ts';

/** The tRPC instance bound to {@link TrpcContext}. */
export const trpc = initTRPC.context<TrpcContext>().create();
