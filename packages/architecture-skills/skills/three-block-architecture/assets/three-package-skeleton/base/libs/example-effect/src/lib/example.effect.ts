import { QuadMesh, type Renderer, type RenderTarget } from 'three/webgpu';
import type { ExampleParams } from '~libs/example-domain';
import { createGradientMaterial, type GradientMaterial } from './create-gradient.material';

/**
 * The example effect: a full-screen TSL gradient drawn into the target it is given. It never
 * touches the canvas, so an engine can post-process or composite it.
 * @backend webgpu
 * @output linear
 * @owns its node material and full-screen quad.
 * @cleanup `dispose()` releases both; calling it twice is harmless.
 */
export class ExampleEffect {
  readonly #gradient: GradientMaterial;
  readonly #quad: QuadMesh;
  #speed: number;
  #time = 0;

  constructor(params: Readonly<ExampleParams>) {
    this.#gradient = createGradientMaterial(params.hue);
    this.#quad = new QuadMesh(this.#gradient.material);
    this.#speed = params.speed;
  }

  /** Current value of the gradient's `hue` uniform node (for specs and debugging). */
  get hue(): number {
    return this.#gradient.uniforms.hue.value;
  }

  /** Applies already-validated params to the uniforms. */
  setParams(params: Readonly<ExampleParams>): void {
    this.#gradient.uniforms.hue.value = params.hue;
    this.#speed = params.speed;
  }

  /** Advances the effect's own clock by `dt` seconds, scaled by `speed`. */
  update(dt: number): void {
    this.#time += dt * this.#speed;
    this.#gradient.uniforms.time.value = this.#time;
  }

  /** Draws into `target`, or into the current render target when `null`. */
  render(renderer: Renderer, target: RenderTarget | null): void {
    if (target !== null) renderer.setRenderTarget(target);
    this.#quad.render(renderer);
  }

  /** Releases the material and the quad geometry. */
  dispose(): void {
    this.#gradient.material.dispose();
    this.#quad.geometry.dispose();
  }
}
