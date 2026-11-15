import type { Material, Mesh } from 'three';
import type { Renderer, RenderTarget } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { createExampleSurface } from './create-example.surface';

/** A renderer that records what is drawn into which target; no GL context needed. */
function fakeRenderer(bound: RenderTarget | null): {
  renderer: Renderer;
  draws: { target: RenderTarget | null; material: Material }[];
  bindings: (RenderTarget | null)[];
} {
  const draws: { target: RenderTarget | null; material: Material }[] = [];
  const bindings: (RenderTarget | null)[] = [];
  let current = bound;
  const renderer = {
    getRenderTarget: () => current,
    setRenderTarget: (target: RenderTarget | null) => {
      current = target;
      bindings.push(target);
    },
    render: (mesh: Mesh) => {
      draws.push({ target: current, material: mesh.material as Material });
    },
  } as unknown as Renderer;
  return { renderer, draws, bindings };
}

const sentinel = { name: 'caller-target' } as unknown as RenderTarget;

describe('createExampleSurface', () => {
  it(
    'an update draws the effect into the output texture and restores the previous render target',
    {
      tags: ['scenario'],
      meta: {
        spec: 'surface-update-and-restore',
        arrange: "a surface on a fake renderer with the caller's target bound, its hue set",
        act: 'the surface is updated',
        assert:
          "the effect's node material drew once into the output texture, and the caller's target is bound again",
      },
    },
    () => {
      let renderer;
      let draws;
      let bindings;
      let surface;
      arrange: {
        ({ renderer, draws, bindings } = fakeRenderer(sentinel));
        surface = createExampleSurface(renderer, { width: 64, height: 32 });
        surface.setParams({ hue: 0.25 });
      }
      act: {
        surface.update(0.1);
      }
      assert: {
        expect(draws).toHaveLength(1);
        expect(draws[0]?.target?.texture).toBe(surface.texture);
        expect(draws[0]?.material.type).toBe('MeshBasicNodeMaterial');
        expect(bindings.at(-1)).toBe(sentinel);
      }
      surface.dispose();
    },
  );

  it(
    'disposing twice does not throw and a disposed surface draws nothing',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'surface-dispose-idempotent',
        arrange: 'a surface that was already disposed',
        act: 'it is disposed again, updated and resized',
        assert: 'no error is thrown and nothing is drawn',
      },
    },
    () => {
      const { renderer, draws } = fakeRenderer(null);
      const surface = createExampleSurface(renderer, { width: 16, height: 16 });
      let error: unknown;
      arrange: {
        surface.dispose();
      }
      act: {
        try {
          surface.dispose();
          surface.update(0.016);
          surface.resize(32, 32);
        } catch (caught) {
          error = caught;
        }
      }
      assert: {
        expect(error).toBeUndefined();
        expect(draws).toHaveLength(0);
      }
    },
  );
});
