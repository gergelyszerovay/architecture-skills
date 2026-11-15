<!-- TEMPLATE-ONLY: guide
// The roadmap of a product or package group, printed by `scripts/roadmap.mjs` of the
// planning skill from the plans' titles, their frontmatter (`after:`, `fixes:`) and the
// files beside them. Never edited by hand and never committed: `roadmap.mjs <dir>` prints it
// and `--write <path>` writes a local copy (a `roadmap.md` that `.gitignore` ignores), which
// this template validates. Workflow: references/roadmap-and-direction.md of the planning skill.
//
// Title: the product's name and "roadmap". The text between the title and the first section
// says that the file is generated and by what, and links the direction log, the deferred
// list and the archived roadmap that exist.
//
// Open: numbered plans without notes, in `after:` order then by number, each with the plans
// it waits for. Questions for you: plans whose reviewer asked questions (a `questions.md`
// with an unanswered one), each linking the file. Implemented, not reviewed: plans with
// notes and no review, among them the plans whose questions are answered and whose review
// is due again. Done: reviewed
// plans, newest first, each linking its notes and review. Drafts: each draft's title and
// folder. A section with no plans says "None.".
//
// A plan's number is its only ID; there are no roadmap item numbers.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Generated on demand by `roadmap.mjs` of the planning skill from the plans in `plans/` and `draft-plans/`; never committed.

## Open

<!-- TEMPLATE-ONLY: freetext; required -->

| Plan                       | Title            | Waits for |
| -------------------------- | ---------------- | --------- |
| 0002 | the second slice | 0001      |

## Questions for you

<!-- TEMPLATE-ONLY: freetext; required -->

None.

## Implemented, not reviewed

<!-- TEMPLATE-ONLY: freetext; required -->

None.

## Done

<!-- TEMPLATE-ONLY: freetext; required -->

| Plan                       | Title           | Notes                                       | Review                         |
| -------------------------- | --------------- | ------------------------------------------- | ------------------------------ |
| 0001 | the first slice | notes | review |

## Drafts

<!-- TEMPLATE-ONLY: freetext; required -->

None.
