/** The facts that decide whether an engine's frame loop should produce frames. */
export type LoopActivity = {
  /** The host's intent: `true` until the host (or the Space key) pauses the engine. */
  hostRunning: boolean;
  /** Whether the container intersects the viewport. */
  visible: boolean;
  /** Whether `prefers-reduced-motion: reduce` currently matches. */
  reducedMotion: boolean;
};
