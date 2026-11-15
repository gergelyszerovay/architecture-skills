# Add a due date to loans

Notes for plan.md, implemented in pull request #12.

## Functional changes

### The lender sees the due date

The loan page shows the due date under the borrower's name.

![The loan page with a due date](implementation-notes-screenshots/1-loan-page.png)

### The CLI lists loans by due date

```text
$ loans list --due
2026-10-04  hammer  Ada
2026-10-09  ladder  Grace
```

## Technical changes

### API

- `loans#Loan` gains `dueDate`.
- `loans#createLoan` requires a due date (breaking).

### Data

The loan table gains a `due_date` column; existing loans get the creation date plus 14 days.

## Differences from the plan

Step 0 found no loans without a lender, so decision 2 was not needed. The default loan
period is 14 days, not 7: the lenders asked for it during the work.

## Verification

- `typecheck`, `lint` and `test` pass in `packages/loans`.
- `validate-md planning/0002` passes.

## Additional notes

Overdue loans could be highlighted; added to the roadmap as deferred.
