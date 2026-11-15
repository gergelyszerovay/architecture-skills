import { describe, expect, it } from 'vitest';
import { resolveEngineOptions } from './resolve-engine-options.rules';

describe('resolveEngineOptions', () => {
  it(
    'every option that is not false resolves to true',
    { tags: ['invariant'], meta: { spec: 'options-default-to-true' } },
    () => {
      expect(resolveEngineOptions()).toEqual({
        interactive: true,
        pauseWhenOffscreen: true,
        respectReducedMotion: true,
      });
      expect(resolveEngineOptions({ interactive: false })).toMatchObject({
        interactive: false,
        pauseWhenOffscreen: true,
      });
    },
  );
});
