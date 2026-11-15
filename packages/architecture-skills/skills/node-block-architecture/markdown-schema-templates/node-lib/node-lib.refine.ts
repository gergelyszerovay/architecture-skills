import type { z } from 'zod';

/**
 * Cross-section invariants for `node-lib.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Boundaries concerns are unique** — no two rows share a Concern.
 * 2. **Owned Records records are unique** — no two rows share a Record.
 * 3. **Decisions IDs are unique** — no two rows share an ID.
 * 4. **Areas areas are unique** — no two rows share an Area.
 */

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

const checkUnique = (
  rows: Row[],
  section: string,
  column: string,
  ctx: z.core.$RefinementCtx,
): void => {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const value = row[column] ?? '';
    if (value && seen.has(value)) {
      ctx.addIssue({
        code: 'custom',
        path: [section, i, column],
        message: `Duplicate ${column} "${value}" — values must be unique within the section.`,
      });
    }
    seen.add(value);
  });
};

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  checkUnique(rowsOf(d['boundaries']), 'boundaries', 'Concern', ctx);
  checkUnique(rowsOf(d['ownedRecords']), 'ownedRecords', 'Record', ctx);
  checkUnique(rowsOf(d['decisions']), 'decisions', 'ID', ctx);
  checkUnique(rowsOf(d['areas']), 'areas', 'Area', ctx);
};
