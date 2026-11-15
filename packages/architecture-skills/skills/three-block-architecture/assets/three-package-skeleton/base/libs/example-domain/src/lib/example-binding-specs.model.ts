import type { InputBindingSpec } from './input-binding-spec.model';

/**
 * The key bindings of the example engine on its focused canvas, in display order.
 * Only active when the engine is created with `interactive: true` (the default).
 */
export const exampleBindingSpecs: readonly InputBindingSpec[] = [
  { keys: ['Space'], description: 'pause or resume' },
];
