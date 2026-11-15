import { defaultExampleParams } from './default-example-params.model';
import type { ExampleParams } from './example-params.model';
import type { ParamSpec } from './param-spec.model';

/** One UI control per example parameter, in display order. */
export const exampleParamSpecs: readonly ParamSpec<ExampleParams>[] = [
  {
    kind: 'range',
    key: 'speed',
    group: 'motion',
    phase: 'look',
    label: 'Speed',
    min: 0,
    max: 4,
    step: 0.05,
    default: defaultExampleParams.speed,
  },
  {
    kind: 'range',
    key: 'hue',
    group: 'colour',
    phase: 'look',
    label: 'Hue',
    min: 0,
    max: 1,
    step: 0.01,
    default: defaultExampleParams.hue,
  },
  {
    kind: 'enum',
    key: 'resolution',
    group: 'output',
    phase: 'build',
    label: 'Resolution',
    options: [
      { value: '320x200', label: '320 × 200 (mode 13h)' },
      { value: '640x400', label: '640 × 400' },
    ],
    default: defaultExampleParams.resolution,
  },
];
