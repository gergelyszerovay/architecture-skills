import { abs, clamp, Fn, fract, mix, sin, uv, vec3 } from 'three/tsl';
import type { UniformNode } from 'three/webgpu';

/** The uniform nodes {@link gradientNode} reads; writing `value` changes the colour without a recompile. */
export type GradientUniforms = {
  /** The effect's clock, seconds. */
  readonly time: UniformNode<'float', number>;
  /** The base hue, 0 to 1. */
  readonly hue: UniformNode<'float', number>;
};

/**
 * An animated hue gradient over the full-screen quad's `uv`, in linear colour: the hue drifts with
 * a sine along u and rises along v, at saturation 0.7 and value 0.9.
 * @backend webgpu
 */
export function gradientNode(uniforms: GradientUniforms) {
  return Fn(() => {
    const coords = uv();
    const h = uniforms.hue
      .add(sin(coords.x.mul(6.2831).add(uniforms.time)).mul(0.15))
      .add(coords.y.mul(0.1));
    // hsv to rgb: the hue picks the channel ramps, saturation mixes towards white.
    const ramps = abs(
      fract(vec3(h).add(vec3(0, 2 / 3, 1 / 3)))
        .mul(6)
        .sub(3),
    );
    return mix(vec3(1), clamp(ramps.sub(1), 0, 1), 0.7).mul(0.9);
  })();
}
