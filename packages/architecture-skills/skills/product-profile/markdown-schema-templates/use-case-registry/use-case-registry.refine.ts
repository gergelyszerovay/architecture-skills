import type { z } from 'zod';

/**
 * Cross-section invariants for `use-case-registry.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Use cases are unique** — no two rows share an ID or a Journey.
 * 2. **Extensions name use cases** — every Extensions.Use case names a row of Use Cases.
 */

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

const issue = (ctx: z.core.$RefinementCtx, path: (string | number)[], message: string): void => {
  ctx.addIssue({ code: 'custom', path, message });
};

/** Reports rows whose key (one or more columns) repeats an earlier row's. */
const checkUnique = (
  rows: Row[],
  section: string,
  columns: string[],
  ctx: z.core.$RefinementCtx,
): void => {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const key = columns.map((column) => row[column] ?? '').join(' / ');
    if (seen.has(key)) {
      issue(
        ctx,
        [section, i, columns[0] ?? ''],
        `Duplicate ${columns.join(' + ')} "${key}" — must be unique within the section.`,
      );
    }
    seen.add(key);
  });
};

/** Reports rows whose column doesn't name a value of the given set. */
const checkNames = (
  rows: Row[],
  section: string,
  column: string,
  names: Set<string>,
  what: string,
  ctx: z.core.$RefinementCtx,
): void => {
  rows.forEach((row, i) => {
    const value = row[column] ?? '';
    if (!names.has(value)) {
      issue(ctx, [section, i, column], `"${value}" must name ${what}.`);
    }
  });
};

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const useCases = rowsOf(d['useCases']);
  checkUnique(useCases, 'useCases', ['ID'], ctx);
  checkUnique(useCases, 'useCases', ['Journey'], ctx);
  const ids = new Set(useCases.map((row) => row['ID'] ?? ''));
  checkNames(rowsOf(d['extensions']), 'extensions', 'Use case', ids, 'a use case ID', ctx);
};
