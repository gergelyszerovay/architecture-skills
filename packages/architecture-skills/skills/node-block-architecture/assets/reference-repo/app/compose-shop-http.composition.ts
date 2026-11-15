import type { Server } from 'node:http';
import type { Logger } from 'pino';
import type { Product } from '#libs/catalog';
import { makeAppRouter } from './app.router.ts';
import { composeShop } from './compose-shop.composition.ts';
import { createShopHttpServer } from './create-shop-http.server.ts';

/** The shop's HTTP server and the disposer of the composition behind it. */
export type ShopHttp = { server: Server; dispose: () => Promise<void> };

/**
 * Wires the shop's HTTP server: the shop use cases, the app router over them, and the server.
 * @param deps - The logger and the products the catalogue starts with.
 *   - `log`: The logger each request's child logger is derived from.
 *   - `seedProducts`: The products the in-memory catalogue is seeded with.
 * @returns The server, not yet listening, and the disposer of the composition.
 */
export const composeShopHttp = (deps: { log: Logger; seedProducts: Product[] }): ShopHttp => {
  const { app, dispose } = composeShop({ seedProducts: deps.seedProducts });
  return { server: createShopHttpServer(makeAppRouter(app), deps.log), dispose };
};
