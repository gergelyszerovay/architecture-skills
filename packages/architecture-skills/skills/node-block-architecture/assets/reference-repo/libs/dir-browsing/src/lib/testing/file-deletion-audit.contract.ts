import { describe, expect, it } from 'vitest';
import type { FileDeletionAudit } from '../core/file-deletion-audit.port.ts';

/** Builds a fresh `FileDeletionAudit` and a way to read back what it recorded, call by call. */
export type FileDeletionAuditContractSetup = () => {
  audit: FileDeletionAudit;
  recorded: () => string[][];
};

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const fileDeletionAuditContract = (
  name: string,
  setup: FileDeletionAuditContractSetup,
): void => {
  describe(`FileDeletionAudit contract: ${name}`, () => {
    it(
      'records the paths of each call, in call order',
      {
        tags: ['scenario'],
        meta: {
          spec: 'file-deletion-audit-records-each-call',
          arrange: 'a fresh audit',
          act: 'two deletions are recorded, `a.txt` and `b.txt` together, then `c.txt`',
          assert: 'the record holds `[a.txt, b.txt]` then `[c.txt]`',
        },
      },
      () => {
        let context: ReturnType<FileDeletionAuditContractSetup>;
        arrange: {
          context = setup();
        }
        act: {
          context.audit.recordDeleted(['a.txt', 'b.txt']);
          context.audit.recordDeleted(['c.txt']);
        }
        assert: {
          expect(context.recorded()).toEqual([['a.txt', 'b.txt'], ['c.txt']]);
        }
      },
    );

    it(
      'keeps the paths as they were when recorded, not as the caller changes them later',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'file-deletion-audit-keeps-recorded-paths',
          arrange: 'a fresh audit and a list holding `a.txt`',
          act: 'the list is recorded, then `b.txt` is pushed onto it',
          assert: 'the record still holds only `a.txt`',
        },
      },
      () => {
        let context: ReturnType<FileDeletionAuditContractSetup>;
        let paths: string[];
        arrange: {
          context = setup();
          paths = ['a.txt'];
        }
        act: {
          context.audit.recordDeleted(paths);
          paths.push('b.txt');
        }
        assert: {
          expect(context.recorded()).toEqual([['a.txt']]);
        }
      },
    );
  });
};
