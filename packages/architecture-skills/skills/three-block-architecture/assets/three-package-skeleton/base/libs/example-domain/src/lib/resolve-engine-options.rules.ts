import type { EngineOptions } from './engine-options.model';

/** Resolves the defaults of {@link EngineOptions}: every option that is not `false` is `true`. */
export function resolveEngineOptions(
  options: Readonly<EngineOptions> = {},
): Required<EngineOptions> {
  return {
    interactive: options.interactive !== false,
    pauseWhenOffscreen: options.pauseWhenOffscreen !== false,
    respectReducedMotion: options.respectReducedMotion !== false,
  };
}
