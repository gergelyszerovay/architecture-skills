# Review of plan 0007: the loan list

Review of plan.md and its implementation notes, commits `abc1234..def5678`.

## Verdict

findings, fix drafted: a due date is not shown for overdue loans; the draft is overdue-dates.

## Findings

### Overdue loans show no due date

- **Severity:** medium
- **Place:** `loans#LoanRow`
- **Failure scenario:** a loan due yesterday renders the borrower only; the due date cell is empty.
- **Evidence:** the `loan-list` journey with the `overdue` seed shows the empty cell.

## Checks run

- `typecheck`, `lint` and `test` pass in `packages/loans`.
- The `loan-list` journey fails on the `overdue` seed.

## Notes

The plan's decision 3 holds.
