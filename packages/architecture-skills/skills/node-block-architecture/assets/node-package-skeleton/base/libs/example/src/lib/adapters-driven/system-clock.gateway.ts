import type { Clock } from '../core/clock.port.ts';

/**
 * Builds the clock that reads the machine's time.
 * @returns The `Clock` over the system time.
 * @failure Reading the system time does not fail, so nothing is translated.
 */
export const makeSystemClock = (): Clock => ({
  now: (): Date => new Date(),
});
