import type { Clock } from '../core/clock.port.ts';

/**
 * Builds a fake `Clock` that reads one fixed time.
 * @param at - The time every read answers.
 * @returns The fake `Clock`.
 */
export const makeFakeClock = (at: Date = new Date(2026, 0, 1, 12)): Clock => ({
  now: (): Date => new Date(at),
});
