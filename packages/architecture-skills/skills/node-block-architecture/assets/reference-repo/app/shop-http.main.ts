import { loadShopHttpConfig } from './load-shop-http.config.ts';
import { loadLoggingConfig } from './load-logging.config.ts';
import { composeLogger } from './compose-logger.composition.ts';
import { composeShopHttp } from './compose-shop-http.composition.ts';

/** The logger for the shop HTTP server, writing to stdout. */
const log = composeLogger(loadLoggingConfig(), 'stdout', 'shop');
/** The tRPC HTTP server exposing the shop's app router, and the composition's disposer. */
const { server, dispose } = composeShopHttp({
  log,
  seedProducts: [{ sku: 'tea', name: 'Green tea', listPrice: { amount: 450, currency: 'EUR' } }],
});
/** The shop HTTP server's configuration, including the port to listen on. */
const config = loadShopHttpConfig();
server.listen(config.port, () => {
  const address = server.address();
  log.info(
    { port: typeof address === 'object' && address ? address.port : config.port },
    'shop listening',
  );
});

/**
 * Closes the HTTP server and disposes the composition container.
 * @returns Nothing.
 */
const shutdown = (): void => {
  server.close(() => void dispose());
  return undefined;
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
