// The package's entry (`exports["."]`): the public API of the `example` library, which is the
// only library of the package. It is an `.entry.ts` block, so it holds only `export … from`.
export type { Greeting, Clock, Greet } from './index.ts';
export { formatGreeting, makeGreet, makeSystemClock } from './index.ts';
