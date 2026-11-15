import { describe, expect, it } from 'vitest';
import { resolveEngineOptions } from './resolve-engine-options.rules';
import { shouldRunLoop } from './should-run-loop.rules';

describe('shouldRunLoop', () => {
  it.each([
    { activity: { hostRunning: false, visible: true, reducedMotion: false }, expected: false },
    { activity: { hostRunning: true, visible: false, reducedMotion: false }, expected: false },
    { activity: { hostRunning: true, visible: true, reducedMotion: true }, expected: false },
    { activity: { hostRunning: true, visible: true, reducedMotion: false }, expected: true },
  ])(
    'the loop runs only while every gate is open: $activity',
    { tags: ['invariant'], meta: { spec: 'loop-runs-while-gates-open' } },
    ({ activity, expected }) => {
      expect(shouldRunLoop(activity, resolveEngineOptions())).toBe(expected);
    },
  );

  it(
    'a gate whose option is off never stops the loop, and the host pause always does',
    { tags: ['invariant'], meta: { spec: 'loop-ignores-disabled-gates' } },
    () => {
      const options = resolveEngineOptions({
        pauseWhenOffscreen: false,
        respectReducedMotion: false,
      });
      expect(
        shouldRunLoop({ hostRunning: true, visible: false, reducedMotion: true }, options),
      ).toBe(true);
      expect(
        shouldRunLoop({ hostRunning: false, visible: true, reducedMotion: false }, options),
      ).toBe(false);
    },
  );
});
