# Questions on plan 0007: the loan list

Questions of the review of plan.md and its implementation notes, commits `abc1234..def5678`.

## Questions

### Q1: Is the due date meant to stay hidden for returned loans?

The loan list hides the due date once a loan is returned (`loans#LoanRow`); the plan's decision 3 does not say whether that is intended.

If it is intended, there is no finding. Otherwise the fix is to show the date in the returned state.

**Answer:**

Yes, hidden on purpose. (answered in chat)

### Q2: Should an overdue loan sort first?

The plan says nothing about the order; the implementation sorts by borrower.

If sorting by borrower is intended, there is no finding. Otherwise the fix is to sort overdue loans first.

**Answer:**
