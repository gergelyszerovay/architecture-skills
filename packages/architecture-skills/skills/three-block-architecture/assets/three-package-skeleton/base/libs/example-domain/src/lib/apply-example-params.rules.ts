import type { ExampleParams } from './example-params.model';
import { exampleParamSpecs } from './example-param-specs.model';

/**
 * Merges a patch into the current params by the spec table: a `range` is clamped into its row's
 * bounds (a non-finite number is ignored), an `enum` keeps only one of its row's options, a `toggle`
 * only a boolean and a `color` only a `#rrggbb` colour; a key no row names is ignored. The bounds
 * live in `exampleParamSpecs` only, so the engine never renders from invalid input and the clamp
 * never repeats them.
 */
export function applyExampleParams(
  current: Readonly<ExampleParams>,
  patch: Readonly<Partial<ExampleParams>>,
): ExampleParams {
  const next = { ...current } as Record<string, unknown>;
  const input = patch as Readonly<Record<string, unknown>>;
  for (const spec of exampleParamSpecs) {
    if (!Object.hasOwn(input, spec.key)) continue;
    const value = input[spec.key];
    switch (spec.kind) {
      case 'range':
        if (typeof value === 'number' && Number.isFinite(value))
          next[spec.key] = Math.min(spec.max, Math.max(spec.min, value));
        break;
      case 'enum':
        if (typeof value === 'string' && spec.options.some((option) => option.value === value))
          next[spec.key] = value;
        break;
      case 'toggle':
        if (typeof value === 'boolean') next[spec.key] = value;
        break;
      case 'color':
        if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) next[spec.key] = value;
        break;
    }
  }
  return next as ExampleParams;
}
