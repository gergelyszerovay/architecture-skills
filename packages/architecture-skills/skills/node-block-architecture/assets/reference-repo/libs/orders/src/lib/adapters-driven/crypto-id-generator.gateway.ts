import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../core/id-generator.port.ts';

/**
 * Builds an `IdGenerator` over random UUIDs.
 * @returns The `IdGenerator`.
 * @failure Doesn't fail: `randomUUID` draws from the process's cryptographic random source.
 */
export const makeCryptoIdGenerator = (): IdGenerator => ({ next: (): string => randomUUID() });
