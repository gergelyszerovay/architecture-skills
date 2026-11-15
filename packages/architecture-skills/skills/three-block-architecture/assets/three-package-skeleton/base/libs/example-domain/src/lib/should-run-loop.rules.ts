import type { EngineOptions } from './engine-options.model';
import type { LoopActivity } from './loop-activity.model';

/**
 * Whether the frame loop should run. All gates must be open, so the host's pause always wins
 * and an automatic pause never overrides it:
 *
 * - the host paused the engine: stopped, whatever else is true;
 * - reduced motion matches and `respectReducedMotion` is on: stopped (one static frame);
 * - the container is not visible and `pauseWhenOffscreen` is on: stopped;
 * - otherwise: running.
 *
 * Visibility and motion pauses are not the host's `running` state: the engine reports
 * `runningChanged` only when the host's intent changes, never for these automatic pauses.
 */
export function shouldRunLoop(
  activity: Readonly<LoopActivity>,
  options: Readonly<Required<EngineOptions>>,
): boolean {
  if (!activity.hostRunning) return false;
  if (options.respectReducedMotion && activity.reducedMotion) return false;
  if (options.pauseWhenOffscreen && !activity.visible) return false;
  return true;
}
