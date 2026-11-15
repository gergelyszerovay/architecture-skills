import { makeGreet, makeGreetRoute, makeSystemClock, type GreetRoute } from '#libs/example';

/**
 * Wires the greet route to the system clock.
 * @returns The route, ready to be served.
 */
export const composeExample = (): GreetRoute =>
  makeGreetRoute({ greet: makeGreet({ clock: makeSystemClock() }) });
