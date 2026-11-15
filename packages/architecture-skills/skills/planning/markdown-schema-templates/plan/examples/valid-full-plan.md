# Loan reminders

Implement this plan by the rules of the `planning` skill (`references/plans.md`): do step 0
first, close with `implementation-notes.md`, and link this plan from every implementation
commit. The documents under **Written with this plan** were changed together with the plan;
the skill's `plan-history` script shows each one's original and planned state.

## Scope

Members get a reminder before a loan is due.

**What it delivers:**

1. A reminder use case and its port.
2. The scheduler that calls it.

**Approvals needed before implementing:** none.

**Step 0: reconcile.** List the loans that have no due date, and confirm the loan model
already carries one.

## Architecture and skills

| Package or area  | Binding                   | Skills                                       |
| ---------------- | ------------------------- | -------------------------------------------- |
| `packages/loans` | `node-block-architecture` | node-block-architecture, source-organization |

The rule this plan touches most: a use case depends on ports, never on an adapter.

## Context

Members forget to return tools. A reminder needs the due date that the previous plan added.

## Decisions

1. **One reminder per loan.** A second reminder would only repeat the first.
2. **The scheduler is an adapter.** The use case knows nothing about time.

## Sketch of the flow

The scheduler asks the use case for the loans due tomorrow, and the use case sends one
message per loan.

### Failure

A message that cannot be sent is logged and retried on the next run.

## Documentation

- The package doc lists the reminder use case.
- The glossary gains _Reminder_.

## Risks to check

- The loans come from the library's database, not the person: a loan with no borrower's address
  is skipped and logged, never sent.
- One run covers every loan due tomorrow: the query is bounded by the due date, not a scan.

## Out of scope

- Reminders by SMS.

## Verification

- `typecheck`, `lint` and `test` pass in `packages/loans`.
