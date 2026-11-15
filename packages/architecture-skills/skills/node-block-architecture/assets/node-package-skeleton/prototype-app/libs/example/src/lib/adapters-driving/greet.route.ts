import type { GreetRequest, GreetResponse } from '../core/greet-exchange.model.ts';
import type { Greet } from '../core/greet.use-case.ts';

/** The greet route contract: answers a request, whatever the HTTP server is. */
export type GreetRoute = (request: GreetRequest) => GreetResponse;

/** The content type of every answer. */
const TEXT = 'text/plain; charset=utf-8';

/**
 * Builds the greet route: `GET /` greets the `name` of the query (a blank or missing name is
 * greeted as `friend`), any other path is a 404 and any other method a 405.
 * @param deps - What the route calls.
 *   - `greet`: The greet use case.
 * @returns The route; it knows no HTTP framework.
 */
export const makeGreetRoute =
  (deps: { greet: Greet }): GreetRoute =>
  (request) => {
    if (request.path !== '/') return { status: 404, contentType: TEXT, body: 'Not found\n' };
    if (request.method !== 'GET') {
      return { status: 405, contentType: TEXT, body: 'Method not allowed\n' };
    }
    const greeting = deps.greet({ name: request.name ?? '' });
    return { status: 200, contentType: TEXT, body: `${greeting.text}\n` };
  };
