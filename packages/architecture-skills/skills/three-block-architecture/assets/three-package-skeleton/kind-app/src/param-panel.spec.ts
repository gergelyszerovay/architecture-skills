import { describe, it } from 'vitest';

describe('param-panel', () => {
  it.todo(
    'every control sends its change to the engine and then shows the value the engine holds',
    {
      tags: ['scenario'],
      meta: {
        spec: 'param-panel-control-change',
        arrange: 'a panel mounted for an engine whose `setParams` clamps a range to its maximum',
        act: 'the range control is set above its maximum',
        assert: 'the engine received the patch and the control shows the clamped value',
      },
    },
  );
});
