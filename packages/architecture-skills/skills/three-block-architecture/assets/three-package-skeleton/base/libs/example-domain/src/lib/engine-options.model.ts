/**
 * Behaviour switches a host passes when it creates an engine. Every option defaults to
 * `true`, so an engine created without options is a fully interactive, well-behaved widget.
 * Plain data; safe to build from configuration.
 */
export type EngineOptions = {
  /**
   * Whether the user can drive the engine. `false` makes the canvas non-focusable, creates
   * no keyboard controls and sets `pointer-events: none` on the canvas, so the page behind
   * it keeps its own input.
   */
  interactive?: boolean;
  /**
   * Whether the frame loop stops while the container is not visible in the viewport and
   * restarts when it is visible again. Independent of the host's `setRunning`.
   */
  pauseWhenOffscreen?: boolean;
  /**
   * Whether `prefers-reduced-motion: reduce` turns the animation off: the engine renders one
   * static frame and does not animate while the media query matches.
   */
  respectReducedMotion?: boolean;
};
