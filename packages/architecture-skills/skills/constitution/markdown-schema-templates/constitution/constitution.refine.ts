import type { z } from 'zod';

/**
 * Cross-section invariants for `constitution.template.md`.
 *
 * Rules enforced here:
 *
 * 1. **IDs are unique** — within Requirements, Non-goals and Decisions.
 * 2. **Serves references resolve** — every ID listed in a Decisions row's
 *    Serves cell names an existing requirement.
 * 3. **Every requirement is served** — each requirement is listed in the
 *    Serves cell of at least one decision.
 * 4. **Topics are contiguous** — Decisions rows that share a Topic are
 *    adjacent, so each topic reads as one group.
 * 5. **Pending decisions say where they are built** — a Decisions row with
 *    Status `pending` has a non-empty Why.
 */

type Row = Record<string, string | undefined>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

const checkUniqueIds = (rows: Row[], section: string, ctx: z.core.$RefinementCtx): void => {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const id = row['ID'] ?? '';
    if (id && seen.has(id)) {
      ctx.addIssue({
        code: 'custom',
        path: [section, i, 'ID'],
        message: `Duplicate ID "${id}" — IDs must be unique within a section.`,
      });
    }
    seen.add(id);
  });
};

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const d = doc as Record<string, unknown>;
  const requirements = rowsOf(d['requirements']);
  const nonGoals = rowsOf(d['nonGoals']);
  const decisions = rowsOf(d['decisions']);

  // Rule 1: unique IDs per section.
  checkUniqueIds(requirements, 'requirements', ctx);
  checkUniqueIds(nonGoals, 'nonGoals', ctx);
  checkUniqueIds(decisions, 'decisions', ctx);

  // Rule 2: every Serves reference names an existing requirement.
  const requirementIds = new Set(requirements.map((row) => row['ID'] ?? ''));
  const served = new Set<string>();
  decisions.forEach((row, i) => {
    const refs = (row['Serves'] ?? '')
      .split(',')
      .map((ref) => ref.trim())
      .filter((ref) => ref.length > 0);
    for (const ref of refs) {
      served.add(ref);
      if (!requirementIds.has(ref)) {
        ctx.addIssue({
          code: 'custom',
          path: ['decisions', i, 'Serves'],
          message: `${row['ID'] ?? 'Decision'} serves "${ref}", which is not a requirement ID.`,
        });
      }
    }
  });

  // Rule 3: every requirement is served by at least one decision.
  requirements.forEach((row, i) => {
    const id = row['ID'] ?? '';
    if (id && !served.has(id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['requirements', i, 'ID'],
        message: `Requirement ${id} is not served by any decision.`,
      });
    }
  });

  // Rule 4: rows sharing a Topic are contiguous.
  const closedTopics = new Set<string>();
  let currentTopic: string | undefined;
  decisions.forEach((row, i) => {
    const topic = row['Topic'] ?? '';
    if (topic === currentTopic) return;
    if (closedTopics.has(topic)) {
      ctx.addIssue({
        code: 'custom',
        path: ['decisions', i, 'Topic'],
        message: `Topic "${topic}" appears again after other topics — keep its rows together.`,
      });
    }
    if (currentTopic !== undefined) closedTopics.add(currentTopic);
    currentTopic = topic;
  });

  // Rule 5: a pending decision names the plan that builds it.
  decisions.forEach((row, i) => {
    if (row['Status'] === 'pending' && (row['Why'] ?? '').trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['decisions', i, 'Why'],
        message: `Pending decision ${row['ID'] ?? ''} needs a Why naming the plan that builds it.`,
      });
    }
  });
};
