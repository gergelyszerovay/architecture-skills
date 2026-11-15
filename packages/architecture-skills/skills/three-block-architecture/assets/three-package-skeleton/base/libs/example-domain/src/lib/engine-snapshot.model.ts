/**
 * Plain-data state an engine reports on request. `S` is the shape of the engine's readout
 * values; an engine without readouts leaves it `undefined`.
 */
export type EngineSnapshot<P, S = undefined> = {
  params: Readonly<P>;
  running: boolean;
  fps: number;
  /** The readout values, a plain-data record. */
  state: S;
};
