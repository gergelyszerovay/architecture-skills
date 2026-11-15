import type { z } from 'zod';

/**
 * Cross-section invariants for `information-architecture.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Places are unique** — no two rows share a Place.
 * 2. **Regions name places** — every Regions.Place names a row of Places, and a place's regions are unique.
 * 3. **Wireframes name places** — every Wireframes.Place names a row of Places.
 * 4. **Navigation names places or regions** — From and To name a place or a `<place>/<region>` of Regions.
 * 5. **Commands name a scope** — Scope is `global`, a place or a `<place>/<region>` of Regions.
 *
 * Keys (N, M, command ids) are unique across the document by the row-key rule (D40), not here.
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
  const places = rowsOf(d['places']);
  checkUnique(places, 'places', ['Place'], ctx);
  const names = new Set(places.map((row) => row['Place'] ?? ''));
  const regions = rowsOf(d['regions']);
  checkNames(regions, 'regions', 'Place', names, 'a place', ctx);
  checkUnique(regions, 'regions', ['Place', 'Region'], ctx);
  checkNames(rowsOf(d['wireframes']), 'wireframes', 'Place', names, 'a place', ctx);
  const targets = new Set([
    ...names,
    ...regions.map((row) => `${row['Place'] ?? ''}/${row['Region'] ?? ''}`),
  ]);
  const what = 'a place or a <place>/<region> of Regions';
  const navigation = rowsOf(d['navigation']);
  checkNames(navigation, 'navigation', 'From', targets, what, ctx);
  checkNames(navigation, 'navigation', 'To', targets, what, ctx);
  checkNames(
    rowsOf(d['commands']),
    'commands',
    'Scope',
    new Set([...targets, 'global']),
    `global, ${what}`,
    ctx,
  );
};
