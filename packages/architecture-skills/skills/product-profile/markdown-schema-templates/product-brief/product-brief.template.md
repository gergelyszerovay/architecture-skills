<!-- TEMPLATE-ONLY: guide
// One per product, in the group's layered-docs tree (product-profile
// constitution D4). It says why the product exists: the problem, who has it,
// and which outcomes show it is solved. Requirements, non-goals and
// product-wide decisions are in the group constitution; don't restate them.
//
// Title: the product's name.
// Summary: the product's promise to its audiences, in one sentence.
//
// Cross-section rules enforced by product-brief.refine.ts:
//   - Audiences.Audience values are unique.
//   - Outcomes.Outcome values are unique.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Problem

<!-- TEMPLATE-ONLY: guide
// The problem the audiences have today, and what it costs them, in a short
// paragraph or two. No solution design.
-->

<!-- TEMPLATE-ONLY: freetext; required -->

## 2. Audiences

<!-- TEMPLATE-ONLY: guide
// Who the product serves. Need: what they come to the product for.
// Excluded need: optional; something they might expect that the product
// deliberately doesn't serve.
-->

| Audience | Need | Excluded need |
| -------- | ---- | ------------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Audience: string; required
Need: string; required
Excluded need: string; optional
-->

| Member | Borrow a tool without buying one. | Renting tools for money. |

## 3. Outcomes

<!-- TEMPLATE-ONLY: guide
// Observable results that show the product works, each with how it is
// measured and the target.
-->

| Outcome | Measure | Target |
| ------- | ------- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Outcome: string; required
Measure: string; required
Target: string; required
-->

| Tools are shared | Loans per contributed tool per month | At least 1 |
