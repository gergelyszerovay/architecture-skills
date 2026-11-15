# Add a due date to loans

Implement this plan by the rules of the `planning` skill (`references/plans.md`): do step 0
first, close with `implementation-notes.md`, and link this plan from every implementation
commit. The documents under **Written with this plan** were changed together with the plan;
the skill's `plan-history` script shows each one's original and planned state.

## Scope

A loan gets a due date that the lender sees, and nothing else changes. Runs in fast-forward
mode: the new behaviour is implemented in full, and coverage gaps are skeleton specs.

## Verification

- `typecheck`, `lint` and `test` pass in `packages/loans`.
