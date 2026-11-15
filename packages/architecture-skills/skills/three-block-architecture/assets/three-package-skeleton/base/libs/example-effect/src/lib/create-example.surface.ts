import { HalfFloatType, LinearFilter, type Texture } from 'three';
import { RenderTarget, type Renderer } from 'three/webgpu';
import { applyExampleParams, defaultExampleParams, type ExampleParams } from '~libs/example-domain';
import { ExampleEffect } from './example.effect';

/** Options of {@link createExampleSurface}. */
export type ExampleSurfaceOptions = {
  /** Width of the texture in pixels. */
  width: number;
  /** Height of the texture in pixels. */
  height: number;
  /** Initial params; clamped like the engine's, missing keys take the defaults. */
  params?: Readonly<Partial<ExampleParams>>;
};

/** The example effect rendered into a texture owned by the surface. */
export type ExampleSurface = {
  /** The effect as a linear-colour texture: use it as `map` of any material. Stable for the surface's lifetime. */
  readonly texture: Texture;
  /** Merges a patch into the params (clamped like the engine's). */
  setParams(patch: Readonly<Partial<ExampleParams>>): void;
  /** Advances the clock by `dt` seconds (scaled by `speed`) and renders the texture. */
  update(dt: number): void;
  /** Changes the texture size in pixels. */
  resize(width: number, height: number): void;
  /** Releases the render target and the effect; safe to call twice. */
  dispose(): void;
};

/**
 * Renders the example effect into a render target the surface owns and exposes its `texture`
 * for use in any scene, as in `new MeshStandardMaterial({ map: surface.texture })`.
 * The caller drives it: call `update(dt)` once per frame, before rendering the scene that
 * samples the texture. `update` restores the render target bound before the call.
 * The output is linear colour: the material that samples it converts to display colour.
 * @backend webgpu
 * @output linear
 * @owns the output render target and the example effect (node material and quad).
 * @cleanup `dispose()` releases both; calling it twice is harmless. The renderer is the
 *   caller's and is never disposed.
 */
export function createExampleSurface(
  renderer: Renderer,
  options: Readonly<ExampleSurfaceOptions>,
): ExampleSurface {
  let params = applyExampleParams(defaultExampleParams, options.params ?? {});
  let disposed = false;
  const output = new RenderTarget(
    Math.max(1, Math.round(options.width)),
    Math.max(1, Math.round(options.height)),
    {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: HalfFloatType,
      depthBuffer: false,
      generateMipmaps: false,
    },
  );
  const effect = new ExampleEffect(params);

  return {
    texture: output.texture,
    setParams(patch) {
      if (disposed) return;
      params = applyExampleParams(params, patch);
      effect.setParams(params);
    },
    update(dt) {
      if (disposed) return;
      const previous = renderer.getRenderTarget();
      effect.update(dt);
      effect.render(renderer, output);
      renderer.setRenderTarget(previous);
    },
    resize(width, height) {
      if (disposed) return;
      output.setSize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      effect.dispose();
      output.dispose();
    },
  };
}
