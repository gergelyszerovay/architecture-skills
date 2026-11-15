import { trpc } from './trpc.middleware.ts';

/** Builds a caller factory for a router, for use in tests. */
export const createCallerFactory = trpc.createCallerFactory;
