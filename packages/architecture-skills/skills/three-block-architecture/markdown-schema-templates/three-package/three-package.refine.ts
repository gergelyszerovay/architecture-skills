import type { z } from 'zod';

/**
 * Cross-section invariants for `three-package.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Boundaries concerns are unique** — no two rows share a Concern.
 * 2. **Approved Packages packages are unique** — no two rows share a Package.
 * 3. **Rule Exceptions are unique** — no two rows share a Rule and a Where.
 * 4. **Decisions IDs are unique** — no two rows share an ID.
 */

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

const checkUnique = (
  rows: Row[],
  section: string,
  key: (row: Row) => string,
  column: string,
  ctx: z.core.$RefinementCtx,
): void => {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const value = key(row);
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
  const cell = (column: string) => (row: Row) => row[column] ?? '';
  checkUnique(rowsOf(d['boundaries']), 'boundaries', cell('Concern'), 'Concern', ctx);
  checkUnique(rowsOf(d['approvedPackages']), 'approvedPackages', cell('Package'), 'Package', ctx);
  checkUnique(
    rowsOf(d['ruleExceptions']),
    'ruleExceptions',
    (row) => `${row['Rule'] ?? ''} ${row['Where'] ?? ''}`.trim(),
    'Rule',
    ctx,
  );
  checkUnique(rowsOf(d['decisions']), 'decisions', cell('ID'), 'ID', ctx);
};
