import type { z } from 'zod';

/**
 * Cross-section invariants for `permission-matrix.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Roles are unique** — no two rows share a Role.
 * 2. **Permissions name roles** — every Permissions.Role names a row of Roles.
 * 3. **Cells are unique** — no two rows share Object + Action + Role.
 * 4. **The matrix is complete** — every Object + Action pair has a row for every role.
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
  const roles = rowsOf(d['roles']);
  checkUnique(roles, 'roles', ['Role'], ctx);
  const names = new Set(roles.map((row) => row['Role'] ?? ''));
  const permissions = rowsOf(d['permissions']);
  checkNames(permissions, 'permissions', 'Role', names, 'a role', ctx);
  checkUnique(permissions, 'permissions', ['Object', 'Action', 'Role'], ctx);
  const cells = new Map<string, Set<string>>();
  for (const row of permissions) {
    const pair = `${row['Object'] ?? ''} / ${row['Action'] ?? ''}`;
    const covered = cells.get(pair) ?? new Set<string>();
    covered.add(row['Role'] ?? '');
    cells.set(pair, covered);
  }
  for (const [pair, covered] of cells) {
    const missing = [...names].filter((role) => !covered.has(role));
    if (missing.length > 0) {
      issue(
        ctx,
        ['permissions'],
        `"${pair}" has no row for role(s) ${missing.join(', ')}; every cell of the matrix is explicit.`,
      );
    }
  }
};
