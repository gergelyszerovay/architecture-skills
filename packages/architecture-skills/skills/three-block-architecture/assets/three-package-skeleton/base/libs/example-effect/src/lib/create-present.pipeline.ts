import { HalfFloatType, NearestFilter } from 'three';
import { texture } from 'three/tsl';
import { RenderPipeline, RenderTarget, type Renderer } from 'three/webgpu';

/** A low-resolution target and the `RenderPipeline` that presents it on the canvas. */
export type PresentPipeline = {
  /** Effects render into this target in linear colour; it is nearest-filtered, so the upscale keeps hard pixels. */
  readonly target: RenderTarget;
  /** Changes the size of the target in pixels. */
  setLowRes(width: number, height: number): void;
  /** Draws the target on the canvas, converted to the renderer's output colour space once. */
  render(): void;
  /** Releases the pipeline and the target; calling it twice is harmless. */
  dispose(): void;
};

/**
 * Creates the present step: a render target for the effect and a `RenderPipeline` whose
 * `outputNode` samples it over the canvas. Everything before the output is linear colour; the
 * pipeline's output transform converts it to the canvas's colour space once.
 * @backend webgpu
 * @owns the render target and the `RenderPipeline`.
 * @cleanup `dispose()` releases both.
 */
export function createPresentPipeline(
  renderer: Renderer,
  lowWidth: number,
  lowHeight: number,
): PresentPipeline {
  const target = new RenderTarget(lowWidth, lowHeight, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    type: HalfFloatType,
    depthBuffer: false,
    generateMipmaps: false,
  });
  const pipeline = new RenderPipeline(renderer);
  pipeline.outputNode = texture(target.texture);
  let disposed = false;

  return {
    target,
    setLowRes(width, height) {
      target.setSize(width, height);
    },
    render() {
      if (disposed) return;
      renderer.setRenderTarget(null);
      pipeline.render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pipeline.dispose();
      target.dispose();
    },
  };
}
