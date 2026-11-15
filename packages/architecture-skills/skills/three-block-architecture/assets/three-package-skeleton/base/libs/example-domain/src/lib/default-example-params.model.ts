import type { ExampleParams } from './example-params.model';

/** Values an example engine starts with when the host passes none. */
export const defaultExampleParams: Readonly<ExampleParams> = {
  speed: 1,
  hue: 0.6,
  resolution: '320x200',
};
