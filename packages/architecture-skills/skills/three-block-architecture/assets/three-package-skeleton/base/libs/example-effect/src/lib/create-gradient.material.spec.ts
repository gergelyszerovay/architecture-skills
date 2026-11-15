import { describe, it } from 'vitest';

describe('create-gradient.material', () => {
  it.todo('createGradientMaterial: Creates the full-screen gradient material.', {
    tags: ['scenario'],
    meta: {
      spec: 'create-gradient-material-scenario',
      arrange: 'a hue; a node material needs no GPU to be built',
      act: '`createGradientMaterial` is called with it',
      assert: 'the material has a `colorNode`, and its `hue` uniform node holds the hue',
    },
  });
});
