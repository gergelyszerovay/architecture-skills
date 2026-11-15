export type { Greeting } from './lib/core/greeting.model.ts';
export type { Clock } from './lib/core/clock.port.ts';
export type { Greet } from './lib/core/greet.use-case.ts';
export { formatGreeting } from './lib/core/format-greeting.rules.ts';
export { makeGreet } from './lib/core/greet.use-case.ts';
export { makeSystemClock } from './lib/adapters-driven/system-clock.gateway.ts';
