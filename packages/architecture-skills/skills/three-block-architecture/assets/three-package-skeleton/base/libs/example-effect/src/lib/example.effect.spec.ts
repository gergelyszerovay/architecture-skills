import type { Renderer } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { defaultExampleParams } from '~libs/example-domain';
import { ExampleEffect } from './example.effect';

describe('ExampleEffect', () => {
  it(
    'new params reach the shader uniforms',
    {
      tags: ['scenario'],
      meta: {
        spec: 'params-reach-uniforms',
        arrange: 'an effect created with the default params',
        act: 'the hue is set to 0.1',
        assert: 'the `hue` uniform node is 0.1',
      },
    },
    () => {
      let effect: ExampleEffect;
      arrange: {
        effect = new ExampleEffect(defaultExampleParams);
      }
      act: {
        effect.setParams({ ...defaultExampleParams, hue: 0.1 });
      }
      assert: {
        expect(effect.hue).toBe(0.1);
      }
      effect.dispose();
    },
  );

  it(
    'disposing twice does not throw',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'dispose-is-idempotent',
        arrange: 'an effect that was already disposed',
        act: 'it is disposed again',
        assert: 'no error is thrown',
      },
    },
    () => {
      let effect: ExampleEffect;
      let error: unknown;
      arrange: {
        effect = new ExampleEffect(defaultExampleParams);
        effect.dispose();
      }
      act: {
        try {
          effect.dispose();
        } catch (caught) {
          error = caught;
        }
      }
      assert: {
        expect(error).toBeUndefined();
      }
    },
  );

  it(
    'rendering without a target does not bind a render target',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'render-without-target-keeps-the-bound-target',
        arrange: 'an effect and a renderer that records the render targets it is given',
        act: 'the effect renders with a null target',
        assert: 'the renderer drew once and setRenderTarget was never called',
      },
    },
    () => {
      let effect: ExampleEffect;
      let bindings: unknown[];
      let draws: number;
      let renderer: Renderer;
      arrange: {
        effect = new ExampleEffect(defaultExampleParams);
        bindings = [];
        draws = 0;
        renderer = {
          setRenderTarget: (target: unknown) => bindings.push(target),
          render: () => {
            draws += 1;
          },
        } as unknown as Renderer;
      }
      act: {
        effect.render(renderer, null);
      }
      assert: {
        expect(draws).toBe(1);
        expect(bindings).toEqual([]);
      }
      effect.dispose();
    },
  );
});
