import type { z } from 'zod';

/**
 * Cross-section invariants for `product-group.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Packages are unique** — no two rows share a Package.
 * 2. **Dependencies name packages** — every May depend on entry names another row's
 *    Package.
 * 3. **Glossary terms are unique** — no two rows share a Term.
 */

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

const list = (cell: string | undefined): string[] =>
  (cell ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== 'none');

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
  const packages = rowsOf(d['packages']);
  checkUnique(packages, 'packages', 'Package', ctx);
  const names = new Set(packages.map((row) => row['Package'] ?? ''));
  packages.forEach((row, i) => {
    for (const dependency of list(row['May depend on'])) {
      if (dependency === row['Package'] || !names.has(dependency)) {
        ctx.addIssue({
          code: 'custom',
          path: ['packages', i, 'May depend on'],
          message: `"${dependency}" must name another package in this table.`,
        });
      }
    }
  });
  checkUnique(rowsOf(d['glossary']), 'glossary', 'Term', ctx);
};
