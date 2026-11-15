import { describe, expect, it } from 'vitest';
import { applyExampleParams } from './apply-example-params.rules';
import { defaultExampleParams } from './default-example-params.model';
import type { ExampleParams } from './example-params.model';

describe('applyExampleParams', () => {
  it.each<{ patch: Partial<ExampleParams>; expected: Partial<ExampleParams> }>([
    { patch: { speed: 9 }, expected: { speed: 4 } },
    { patch: { speed: -1 }, expected: { speed: 0 } },
    { patch: { hue: Number.NaN }, expected: { hue: defaultExampleParams.hue } },
    { patch: { hue: 0.25 }, expected: { hue: 0.25 } },
    {
      patch: { resolution: '1x1' as ExampleParams['resolution'] },
      expected: { resolution: defaultExampleParams.resolution },
    },
    {
      patch: { resolution: 'toString' as ExampleParams['resolution'] },
      expected: { resolution: defaultExampleParams.resolution },
    },
  ])(
    'params stay inside their spec ranges for $patch',
    { tags: ['invariant'], meta: { spec: 'params-stay-in-range' } },
    ({ patch, expected }) => {
      expect(applyExampleParams(defaultExampleParams, patch)).toMatchObject(expected);
    },
  );
});
