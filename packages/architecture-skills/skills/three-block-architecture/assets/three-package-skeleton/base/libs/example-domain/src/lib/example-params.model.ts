import type { ExampleResolution } from './example-resolutions.model';

/** Parameters of the example effect; plain data, safe to send across the host contract. */
export type ExampleParams = {
  /** Animation speed multiplier. */
  speed: number;
  /** Base hue, 0..1. */
  hue: number;
  /** Size of the low-resolution render target. */
  resolution: ExampleResolution;
};
