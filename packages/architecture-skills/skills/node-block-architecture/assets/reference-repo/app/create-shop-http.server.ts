import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import type { Logger } from 'pino';
import type { AppRouter } from './app.router.ts';

/**
 * Builds the shop's tRPC HTTP server: identity comes from the `x-user-id` header, and every
 * request gets a request-scoped logger bound to its `x-request-id` (or a generated ID).
 * @param appRouter - The shop's app router, built by the composition from its use cases.
 * @param log - The logger each request's child logger is derived from.
 * @returns The HTTP server, not yet listening.
 * @cleanup Nothing is open until the entry point calls `listen`; the entry point closes the server on shutdown.
 */
export const createShopHttpServer = (appRouter: AppRouter, log: Logger): Server =>
  createHTTPServer({
    router: appRouter,
    createContext: ({ req }) => {
      const user = req.headers['x-user-id'];
      const incoming = req.headers['x-request-id'];
      const requestId = typeof incoming === 'string' ? incoming : randomUUID();
      return {
        user: typeof user === 'string' ? { id: user } : undefined,
        requestId,
        log: log.child({ requestId }),
      };
    },
  });
