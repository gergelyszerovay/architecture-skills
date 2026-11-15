import { trpc } from './trpc.middleware.ts';

/** Builds a tRPC router, bound to the transport context. */
export const router = trpc.router;
