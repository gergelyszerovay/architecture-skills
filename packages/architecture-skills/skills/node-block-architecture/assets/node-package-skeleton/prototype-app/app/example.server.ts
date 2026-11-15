import { createServer } from 'node:http';
import type { GreetRoute } from '#libs/example';

/** The running server: where it listens and how to stop it. */
export type ExampleServer = {
  /** Starts listening and answers the port it listens on. */
  listen(): Promise<number>;
  /** Stops listening. */
  close(): Promise<void>;
};

/**
 * Builds the HTTP server over `node:http`: every request goes to the greet route.
 * @param deps - What it serves.
 *   - `route`: The greet route.
 *   - `host`: The address to listen on.
 *   - `port`: The port to listen on; 0 picks a free one.
 * @returns The server; nothing listens until `listen()`.
 * @cleanup `close()` stops the listener; the entry calls it on SIGINT and SIGTERM.
 */
export const makeExampleServer = (deps: {
  route: GreetRoute;
  host: string;
  port: number;
}): ExampleServer => {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://x');
    const answer = deps.route({
      method: request.method ?? 'GET',
      path: url.pathname,
      name: url.searchParams.get('name') ?? undefined,
    });
    response.writeHead(answer.status, { 'content-type': answer.contentType }).end(answer.body);
  });
  const handle: ExampleServer = {
    listen: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(deps.port, deps.host, () => {
          const address = server.address();
          resolve(typeof address === 'object' && address !== null ? address.port : deps.port);
        });
      }),
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          resolve();
        });
        server.closeAllConnections();
      }),
  };
  return handle;
};
