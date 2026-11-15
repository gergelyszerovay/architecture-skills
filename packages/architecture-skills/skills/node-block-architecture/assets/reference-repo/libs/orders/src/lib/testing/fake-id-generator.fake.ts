import type { IdGenerator } from '../core/id-generator.port.ts';

/**
 * Builds a fake `IdGenerator` handing out `o1`, `o2`, … in order.
 * @returns The fake `IdGenerator`.
 */
export const makeFakeIdGenerator = (): IdGenerator => {
  let count = 0;
  return { next: (): string => `o${String(++count)}` };
};
