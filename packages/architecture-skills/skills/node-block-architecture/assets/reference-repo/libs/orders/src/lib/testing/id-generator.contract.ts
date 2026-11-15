import { describe, expect, it } from 'vitest';
import type { IdGenerator } from '../core/id-generator.port.ts';

/**
 * Run against the fake and every real implementation, so they cannot drift apart. Each spec
 * is declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const idGeneratorContract = (name: string, setup: () => IdGenerator): void => {
  describe(`IdGenerator contract: ${name}`, () => {
    it(
      'hands out a different identifier on every call',
      {
        tags: ['scenario'],
        meta: {
          spec: 'id-generator-unique-ids',
          arrange: 'a fresh generator',
          act: 'fifty identifiers are requested',
          assert: 'all fifty are different',
        },
      },
      () => {
        let ids: IdGenerator;
        let issued: string[];
        arrange: {
          ids = setup();
        }
        act: {
          issued = Array.from({ length: 50 }, () => ids.next());
        }
        assert: {
          expect(new Set(issued).size).toBe(50);
        }
      },
    );

    it(
      'never hands out an empty identifier',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'id-generator-non-empty-id',
          arrange: 'a fresh generator',
          act: 'the first identifier is requested',
          assert: 'it is a non-empty string',
        },
      },
      () => {
        let ids: IdGenerator;
        let id: string;
        arrange: {
          ids = setup();
        }
        act: {
          id = ids.next();
        }
        assert: {
          expect(id.length).toBeGreaterThan(0);
        }
      },
    );
  });
};
