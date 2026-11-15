import { describe, expect, it } from 'vitest';
import type { Clock } from '../core/clock.port.ts';

/** Builds a fresh `Clock` for one spec. */
export type ClockContractSetup = () => Promise<Clock>;

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const clockContract = (name: string, setup: ClockContractSetup): void => {
  describe(`Clock contract: ${name}`, () => {
    it(
      'answers a valid date',
      {
        tags: ['scenario'],
        meta: {
          spec: 'clock-answers-a-date',
          arrange: 'a clock',
          act: 'the time is read',
          assert: 'the answer is a valid date',
        },
      },
      async () => {
        let clock: Clock;
        let now: Date;
        arrange: {
          clock = await setup();
        }
        act: {
          now = clock.now();
        }
        assert: {
          expect(Number.isNaN(now.getTime())).toBe(false);
        }
      },
    );

    it(
      'never answers a time before the previous answer',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'clock-never-runs-backwards',
          arrange: 'a clock',
          act: 'the time is read twice in a row',
          assert: 'the second answer is not before the first',
        },
      },
      async () => {
        let clock: Clock;
        let first: Date;
        let second: Date;
        arrange: {
          clock = await setup();
        }
        act: {
          first = clock.now();
          second = clock.now();
        }
        assert: {
          expect(second.getTime()).toBeGreaterThanOrEqual(first.getTime());
        }
      },
    );
  });
};
