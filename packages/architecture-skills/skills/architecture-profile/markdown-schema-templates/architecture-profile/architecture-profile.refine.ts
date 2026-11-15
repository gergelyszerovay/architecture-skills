import type { z } from 'zod';

/**
 * Cross-section invariants for `architecture-profile.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **Names are unique** — Layer, Role, Block and Kind values within their tables.
 * 2. **Block layers exist** — every Blocks.Layer names a row of Layers.
 * 3. **Block dependencies exist** — every Blocks.May depend on entry names a block
 *    (by name without dot and extension), or is `*` / `none`.
 * 4. **Role dependencies exist** — every Library roles.May depend on entry names a role.
 * 5. **Spec kinds exist** — every Blocks.Spec kinds entry names a row of Spec kinds.
 * 6. **Blocks match the classifier** — with `file-suffix`, every block name looks like
 *    `.store.ts`.
 * 7. **Rules are in the vocabulary** — structural and coverage rule names are ones the
 *    tools implement.
 * 8. **Coverage targets exist** — every Coverage rules.Applies to entry names a block.
 * 9. **Role parameters name roles** — the `default-role`, `places-role`, `shared-role`,
 *    `contract-roles` and `index-roles` parameters of a structural rule name rows of
 *    Library roles (the tools know no role of their own).
 * 10. **Block parameters name blocks** — the `blocks` parameter of a structural rule
 *    (`private-blocks`, `contract-only`, `no-symbol`, `providers-only`, `entry-only`) names blocks (by name
 *    without dot and extension).
 */

export const STRUCTURAL_RULES = [
  'library-roles',
  'acyclic',
  'public-entry-only',
  'block-allow-list',
  'layer-packages',
  'no-testing-in-prod',
  'private-blocks',
  'composition-root',
  'directory-allow-list',
  'context-access',
  'contract-only',
  'lazy-places',
  'block-placement',
  'max-facades-per-component',
  'no-symbol',
  'providers-only',
  'entry-only',
  'originating-declaration',
  'tsdoc-tags',
  'spec-structure',
  'package-allow-list',
  'use-case-has-journey',
  'file-naming',
  'unit-manifest',
  'unit-imports',
  'entry-excludes-package',
];

export const COVERAGE_RULES = [
  'public-method-has-spec',
  'failure-path-has-spec',
  'export-has-spec',
  'interactive-ui-has-spec',
  'port-has-contract',
  'dispose-has-spec',
];

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

/** The parameters whose values are library roles. */
const ROLE_PARAMETERS = [
  'default-role',
  'places-role',
  'shared-role',
  'contract-roles',
  'index-roles',
];

/** `a=x; b=y, z` → `[["a", "x"], ["b", "y, z"]]`; `none` → `[]`. */
const parametersOf = (cell: string | undefined): [string, string][] =>
  (cell === undefined || cell === 'none' ? '' : cell)
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes('='))
    .map((pair) => {
      const at = pair.indexOf('=');
      return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
    });

const list = (cell: string | undefined): string[] =>
  (cell ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== 'none' && item !== '*');

/** `.store.ts` → `store`; SQL object kinds are used as they are. */
export const blockName = (block: string): string => block.replace(/^\./, '').replace(/\.ts$/, '');

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const identity = (d['identity'] ?? {}) as Record<string, string | undefined>;
  const layers = rowsOf(d['layers']);
  const roles = rowsOf(d['libraryRoles']);
  const blocks = rowsOf(d['blocks']);
  const structural = rowsOf(d['structuralRules']);
  const coverage = rowsOf(d['coverageRules']);
  const kinds = rowsOf(d['specKinds']);

  const issue = (path: (string | number)[], message: string): void => {
    ctx.addIssue({ code: 'custom', path, message });
  };

  // Rule 1: unique names.
  const unique = (rows: Row[], section: string, column: string): Set<string> => {
    const seen = new Set<string>();
    rows.forEach((row, i) => {
      const value = row[column] ?? '';
      if (value && seen.has(value)) {
        issue([section, i, column], `Duplicate ${column} "${value}".`);
      }
      seen.add(value);
    });
    return seen;
  };
  const layerNames = unique(layers, 'layers', 'Layer');
  const roleNames = unique(roles, 'libraryRoles', 'Role');
  unique(blocks, 'blocks', 'Block');
  const kindNames = unique(kinds, 'specKinds', 'Kind');
  const blockNames = new Set(blocks.map((row) => blockName(row['Block'] ?? '')));

  blocks.forEach((row, i) => {
    const block = row['Block'] ?? '';
    // Rule 2: layers exist.
    if (!layerNames.has(row['Layer'] ?? '')) {
      issue(['blocks', i, 'Layer'], `${block}: layer "${row['Layer']}" is not in Layers.`);
    }
    // Rule 3: block dependencies exist.
    for (const dep of list(row['May depend on'])) {
      if (!blockNames.has(dep)) {
        issue(['blocks', i, 'May depend on'], `${block}: "${dep}" is not a block.`);
      }
    }
    // Rule 5: spec kinds exist.
    for (const kind of list(row['Spec kinds'])) {
      if (!kindNames.has(kind)) {
        issue(['blocks', i, 'Spec kinds'], `${block}: spec kind "${kind}" is not in Spec kinds.`);
      }
    }
    // Rule 6: block names match the classifier.
    if (identity['Classifier'] === 'file-suffix' && !/^\.[a-z][a-z-]*\.ts$/.test(block)) {
      issue(['blocks', i, 'Block'], `"${block}" is not a file suffix such as ".store.ts".`);
    }
  });

  // Rule 4: role dependencies exist.
  roles.forEach((row, i) => {
    for (const dep of list(row['May depend on'])) {
      if (!roleNames.has(dep)) {
        issue(['libraryRoles', i, 'May depend on'], `${row['Role']}: "${dep}" is not a role.`);
      }
    }
  });

  // Rule 7: rules are in the vocabulary.
  structural.forEach((row, i) => {
    if (!STRUCTURAL_RULES.includes(row['Rule'] ?? '')) {
      issue(
        ['structuralRules', i, 'Rule'],
        `"${row['Rule']}" is not a structural rule the tools implement.`,
      );
    }
    for (const [key, value] of parametersOf(row['Parameters'])) {
      // Rule 10: block parameters name blocks.
      if (key === 'blocks') {
        for (const block of list(value)) {
          if (!blockNames.has(block)) {
            issue(
              ['structuralRules', i, 'Parameters'],
              `${row['Rule']}: blocks names "${block}", which is not a block.`,
            );
          }
        }
        continue;
      }
      // Rule 9: role parameters name roles.
      if (!ROLE_PARAMETERS.includes(key)) continue;
      for (const role of list(value)) {
        if (!roleNames.has(role)) {
          issue(
            ['structuralRules', i, 'Parameters'],
            `${row['Rule']}: ${key} names "${role}", which is not in Library roles.`,
          );
        }
      }
    }
  });
  coverage.forEach((row, i) => {
    if (!COVERAGE_RULES.includes(row['Rule'] ?? '')) {
      issue(
        ['coverageRules', i, 'Rule'],
        `"${row['Rule']}" is not a coverage rule the tools implement.`,
      );
    }
    // Rule 8: coverage targets exist.
    for (const target of list(row['Applies to'])) {
      if (!blockNames.has(blockName(target))) {
        issue(['coverageRules', i, 'Applies to'], `"${target}" is not a block.`);
      }
    }
  });
};
