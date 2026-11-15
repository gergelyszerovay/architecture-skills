import { describe, expect, it } from 'vitest';
import { exampleBindingSpecs } from './example-binding-specs.model';

describe('exampleBindingSpecs', () => {
  it(
    'every binding has a description and Space pauses',
    { tags: ['invariant'], meta: { spec: 'bindings-are-described' } },
    () => {
      expect(exampleBindingSpecs.every((spec) => spec.description.length > 0)).toBe(true);
      expect(exampleBindingSpecs.some((spec) => spec.keys.includes('Space'))).toBe(true);
    },
  );
});
