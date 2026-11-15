<!-- TEMPLATE-ONLY: guide
// The questions a reviewer asks before it judges, written by the reviewer when it cannot
// decide a finding without the user (is this behaviour intended? which of two fixes?). It
// sits beside the plan and its notes: `questions.md` for `plan.md`,
// `<artifact>.questions.md` for `<artifact>.plan.md`. Workflow: references/plans.md of the
// planning skill, "The review".
//
// Title: "Questions on plan <nnnn>" and the plan's title.
//
// The text before the first section links the plan and its notes and names the commits (or
// the pull request) reviewed.
//
// Questions: one `###` per question, named `Q<n>` and a short title, holding its context,
// what depends on the answer ("if X is intended, no fix; otherwise the fix is Y") and an
// `**Answer:**` line. The reviewer writes the questions; the user writes each answer under
// its question, in the file or in the reviewer's chat (the reviewer then writes it here,
// marked "(answered in chat)"). A question is answered when text follows `**Answer:**`
// before the next heading; the plan is in the questions status while one is unanswered.
//
// The template is open: a file may add a section of its own.
-->

# <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Questions of the review of plan.md and its implementation notes, commits `abc1234..def5678`.

## Questions

<!-- TEMPLATE-ONLY: freetext; required -->

### Q1: Is the due date meant to stay hidden for returned loans?

The loan list hides the due date once a loan is returned (`loans#LoanRow`); the plan's decision 3 does not say whether that is intended.

If it is intended, there is no finding. Otherwise the fix is to show the date in the returned state.

**Answer:**

Yes, hidden on purpose. (answered in chat)
