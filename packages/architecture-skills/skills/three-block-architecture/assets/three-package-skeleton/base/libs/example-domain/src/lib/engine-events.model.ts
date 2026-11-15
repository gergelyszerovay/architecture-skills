/**
 * Events every engine emits. `paramsChanged` reports only changes the engine made itself
 * (for example from a key binding), never echoes of `setParams`.
 */
export type EngineEvents<P> = {
  /** The measured frame rate, reported about twice a second while the loop runs and `0` when it stops. */
  fps: number;
  paramsChanged: P;
  runningChanged: boolean;
};
