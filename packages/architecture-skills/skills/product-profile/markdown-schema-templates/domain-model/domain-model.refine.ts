import type { z } from 'zod';

/**
 * Cross-section invariants for `domain-model.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Objects are unique** — no two rows share an Object.
 * 2. **Relationships name objects** — From and To name rows of Objects.
 * 3. **Attributes name objects** — every Attributes.Object names a row of Objects, and an object's attributes are unique.
 * 4. **Unmodeled objects have a meaning** — Objects.Meaning is set unless Modeled by is,
 *    whose TSDoc summary then supplies it.
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
  const objects = rowsOf(d['objects']);
  checkUnique(objects, 'objects', ['Object'], ctx);
  const names = new Set(objects.map((row) => row['Object'] ?? ''));
  const relationships = rowsOf(d['relationships']);
  checkNames(relationships, 'relationships', 'From', names, 'an object', ctx);
  checkNames(relationships, 'relationships', 'To', names, 'an object', ctx);
  const attributes = rowsOf(d['attributes']);
  checkNames(attributes, 'attributes', 'Object', names, 'an object', ctx);
  checkUnique(attributes, 'attributes', ['Object', 'Attribute'], ctx);
  objects.forEach((row, i) => {
    if (!(row['Meaning'] ?? '').trim() && !(row['Modeled by'] ?? '').trim()) {
      issue(
        ctx,
        ['objects', i, 'Meaning'],
        `Object "${row['Object'] ?? ''}" needs a Meaning, or a Modeled by citation whose TSDoc summary supplies it.`,
      );
    }
  });
};
