import { uniform } from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { gradientNode, type GradientUniforms } from './gradient.node';

/** A gradient material and the uniform nodes its owner updates every frame. */
export type GradientMaterial = {
  material: MeshBasicNodeMaterial;
  uniforms: GradientUniforms;
};

/**
 * Creates the full-screen gradient material: a node material whose `colorNode` is
 * {@link gradientNode}, drawn without depth.
 * @backend webgpu
 * @output linear
 * @owns the node material.
 * @cleanup The caller calls `material.dispose()`.
 * @attributes uv
 */
export function createGradientMaterial(hue: number): GradientMaterial {
  const uniforms: GradientUniforms = { time: uniform(0), hue: uniform(hue) };
  const material = new MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
  material.colorNode = gradientNode(uniforms);
  return { material, uniforms };
}
