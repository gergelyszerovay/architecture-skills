# Plans

A plan states what a change delivers and how it is built, before the change; its
implementation notes record afterwards what changed and what differed. Both are working
documents, not normative ones: the constitution and the package docs hold the rules, and a
plan says which of them it touches.

## Numbering and files

- `planning/plans/<nnnn>/plan.md`, with a four-digit number that is never reused.
- A **draft** is `planning/draft-plans/<slug>/plan.md`, without a number. A plan is promoted
  by moving its folder to the next free number (`scripts/promote-plan.mjs`); a numbered plan
  is approved for implementation. Only the planner or the orchestrator promotes, on `main`.
- **An implementer never implements a draft.** Handed a path under `draft-plans/`, it changes
  nothing and stops, asking for the draft to be promoted on `main` first
  (`node <skill>/scripts/promote-plan.mjs <planning-dir> <slug>`, then a commit), and for the
  new `plans/<nnnn>/plan.md` path. It does not promote the draft in its own branch: the
  promotion would carry another plan's folder into its pull request, and its
  commits would name a path that no longer exists.
- A second plan in the same folder is `<artifact>.plan.md` (`repository-history.plan.md`),
  so it binds to the `plan` template by name.
- The implementation notes sit beside their plan: `implementation-notes.md` for `plan.md`,
  `<artifact>.implementation-notes.md` for `<artifact>.plan.md`. They bind to the
  `implementation-notes` template. Their screenshots go in
  `implementation-notes-screenshots/` (or `<artifact>.implementation-notes-screenshots/`).
- The review sits beside them: `review.md` (or `<artifact>.review.md`), bound to the `review`
  template, written by the reviewer once the notes exist.
- The questions sit beside the review: `questions.md` (or `<artifact>.questions.md`), bound to
  the `questions` template, written by the reviewer when it needs the person's answer before it
  can judge (see "The review").
- **The files are the status**, in this order: a draft (under `draft-plans/`); open (numbered,
  no notes), and waiting while a plan it is `after` has no notes; implemented (notes, no
  review); questions (notes, a `questions.md` with an unanswered question, no review); answered
  (notes, every question answered, no review: the review is due again); reviewed (a
  `review.md`). Each file has one writer: the planner writes `plan.md`, the implementer the
  notes, the reviewer the review and the questions (the person writes the answers). A plan states no status of its own, and
  no one edits another's file. In-flight states (being implemented, being reviewed) are not in
  the repository.
- **Frontmatter**, optional, written once by the plan's author and read by the scripts (a
  two-key subset of YAML, no other key):

  ```yaml
  ---
  after: [0082] # plans whose notes must exist before this one starts
  fixes: 0084 # set by a review on the fix plan it drafts
  ---
  ```

- **Issues** (optional): a reported problem the plan fixes lives in `plans/<nnnn>/issues/`,
  one Markdown file per issue, and the plan links it. An issue no plan has taken yet lives in
  the planning folder's `issues/`; the plan that takes it moves it into its `issues/`. So
  the folder is the issue's status: unplanned, planned, and fixed once the plan has notes.
- Other files of the plan (research, working notes) live beside it and need no template.
- The planning folder's root keeps only what a person navigates:
  `deferred.md`, `direction.md`, `plans/`, `draft-plans/` and `issues/`. The person's notes
  are a `.notes/` folder beside it (once `notes/` inside it), which an agent leaves alone
  unless asked (see [roadmap-and-direction.md](roadmap-and-direction.md), "Notes").

## Sections

A plan opens, before its first section, with the sentence that binds the implementer to
this workflow:

> Implement this plan by the rules of the `planning` skill (`references/plans.md`): do step 0
> first, close with `implementation-notes.md`, and link this plan from every implementation
> commit. The documents under **Written with this plan** were changed together with the plan;
> the skill's `plan-history` script shows each one's original and planned state.

The `plan` template accepts any section. A new plan should have the sections below; a small
plan may drop those it has nothing to say in.

| Section                     | Holds                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**                   | What the plan delivers, the issues it fixes, dependencies on other plans, the approvals needed, the fast-forward statement and step 0. |
| **Architecture and skills** | A table of package or area, binding and skills to load, then the rules the plan touches most.                                          |
| **Context**                 | Why the plan exists and the state it starts from.                                                                                      |
| **Decisions**               | The choices the plan makes, numbered; a decision that outlives the plan goes to the constitution.                                      |
| Sections of its own         | The design: the parts, the API, the steps. Any `##` title; the template parses them as free text.                                      |
| **Documentation**           | Every document the plan changes, including the docs in code (TSDoc) and specs (below).                                                 |
| **Risks to check**          | What the change could get wrong: untrusted inputs, walks or watches over a whole tree, costs per tab or request; each with its proof.  |
| **Out of scope**            | What is left alone on purpose.                                                                                                         |
| **Verification**            | The checks that show the plan is done: the package scripts and the `validate-md` runs.                                                 |

### Fast-forward statement

Say whether the plan runs in fast-forward mode (`"coverage": "specified"` in a package's
`architecture` binding): what is implemented in full, and which coverage gaps are skeletons
only (`it.todo` with full metadata in unit specs).

### Architecture and skills

List every package or area the plan changes with the architecture its `package.json` binds
(or "none") and the skills to load before changing it, and name the constitution decisions
the plan touches. The reader should know what to load without opening the code.

### Step 0: reconcile

A plan is written before the code moves, so it can be stale when someone picks it up. Step 0
lists what to check against the current code and documents (the inventory a decision relies
on, the behaviour a design assumes) and says what to do when the check disagrees. Do step 0
before implementing, and record what changed in the implementation notes (**Differences from
the plan**).

### Prototypes

When a choice needs trying out (two libraries, two designs), step 0 can ask for throwaway
prototypes. They are committed as **one commit of their own**, with nothing else in it and
the plan's `Plan:` trailer, and removed by the next commit, so they stay in the history
without being merged in use. The implementation notes give the commit's SHA, how to run it,
what was compared and the choice. The pull request is merged with a merge commit, not
squashed, so the prototype commit survives.

### Documents written with the plan

A plan doesn't restate the target it builds. When it changes what the product is meant to
do (a region's rules, a use case, a constitution decision set `pending`), the planner edits
that document in place, together with the plan, and the plan cites the rows it builds
(`2.reviewer2.app-shell.revision-picker.region.md#R3`). Its decisions are about how to
build it. There are no draft copies in the plan folder: a draft is a second home that
drifts, its links break when it moves, and nothing can cite it. Working documents that
compare options before anything is decided are the exception; they stay in the plan folder.

The **Documentation** section has two lists:

- **Written with this plan:** the target documents already changed, each linked, so a
  reviewer reads them with the plan and `plan-history` finds them;
- **Updated by the implementation:** what only the implementer can write: TSDoc, lib and
  package docs, decisions set `active`.

When the work changes a target document, the implementer edits it in place and says what
and why under **Differences from the plan**.

### The history of a plan's documents

Writing documents in place needs no commit discipline from the planner. Three states are
derived from Git, however the commits were made:

| State       | The document as of                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| original    | the parent of the commit that added the plan                                                                                                                                  |
| planned     | the handoff: the merge base of the merge that added the implementation notes, or the parent of the first commit with the plan's `Plan:` trailer; the working tree before then |
| implemented | the tip of the implementation branch (the merge's second parent), or the commit that added the notes                                                                          |

`scripts/plan-history.mjs <planning-dir> <nnnn> [<document>]` lists the documents the plan
links with their planning and implementation changes, and the other documents the
implementation changed; with a document it prints both diffs. An edit made for another
reason between the plan's first commit and the handoff counts as planning; the diffs are
still right.

### Documentation coverage

A plan is not complete until it names every document that states something it changes:
TSDoc and specs (architecture-docs-and-specs skill), lib and package docs, group docs
(glossary, domain model, use cases), READMEs and changelogs, agent instructions, and the
planning documents themselves. Apply the "one home per fact" rule: don't plan to repeat
what a TSDoc tag or the code already says.

## Linking

Link a decision by its row key, from the repository root: `[D26](/products/reviewer2/layered-docs/2.reviewer2.constitution.md#D26)`, a plan by its folder:
`[0025](../0025/plan.md)`. Plans that already exist are not rewritten to use the form.

### Risks to check

A plan names its risks before anyone builds it, so they are handled in the first implementation
rather than found in a second review round. List, one item each, every input that does not come
from the person (a file in the served repository or a generated report an agent can write, a web
origin, a branch or path name, a process's output), every walk or watch over a whole tree, and every
cost paid per tab, per request or per file, with what the implementation must show: a check (read
only inside the root, by real path; regular files only), a bound (a size cap, a timeout, one shared
watcher), or a spec. A plan with none says so in a line. The implementer handles each item before
the review and says how in the notes; the reviewer starts from the list.

## Implementation notes

The implementer writes them when the work is done, from the `implementation-notes` template:

| Section                       | Holds                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Preamble                      | A link to the plan, and the commits or the pull request that implemented it.                                                             |
| **Functional changes**        | What a user or a caller sees now, one `###` per change, each with its evidence: a screenshot, a CLI output, a benchmark.                 |
| **Technical changes**         | How the code changed, one `###` per kind: API, data, structure, dependencies, performance, configuration and tooling, decisions.         |
| **Differences from the plan** | The step 0 results and what turned out differently, with why; "None." when the plan held. The plan itself is corrected in place as well. |
| **Verification**              | What ran and the result; failures with their output, known baseline failures named.                                                      |
| **Additional notes**          | Optional: findings, risks, follow-ups, candidates for the roadmap.                                                                       |

Screenshots are PNG files in the screenshots folder, numbered in reading order
(`1-graph-neighbourhood.png`) and linked by relative path. Short CLI outputs and benchmarks
go inline in fenced code blocks; a long one goes in a file beside the notes, linked.

## The review

The reviewer writes `review.md` from the `review` template once the notes exist: a preamble
linking the plan and the commits reviewed, then **Verdict** (one line: `no findings`,
`findings`, `findings, fix drafted`, or `legacy` for a plan reviewed before reviews were
files), **Findings** (one `###` per finding, with its severity, place, failure scenario and
evidence), **Checks run** and an optional **Notes**. The review starts from the plan's
**Risks to check**: each item is confirmed handled or becomes a finding. A review that drafts a fix links the
draft, and the draft's frontmatter says `fixes: <nnnn>`. A review never edits the plan or the
notes it reviews.

### Questions before the judgement

A reviewer that cannot judge a finding without the person (is this behaviour intended? which
of two fixes?) asks instead of guessing. It writes `questions.md` from the `questions`
template (a preamble linking the plan and the commits reviewed, then one `### Q<n>` per
question with its context, what depends on the answer — "if X is intended, no fix; otherwise
the fix is Y" — and an `**Answer:**` line), commits it, opens its pull request as a **draft**,
asks the same questions in its chat and waits. A question is answered when text follows its
`**Answer:**` line before the next heading.

- **Answered in the chat:** the reviewer writes each answer under its question, marked
  "(answered in chat)", finishes `review.md` (and a fix draft if needed) and marks the pull
  request ready. It holds `questions.md` and `review.md`.
- **Answered in the file:** if the person says they will answer in the file, or the session
  ends, the reviewer marks the pull request ready with `questions.md` alone. Merged, the plan
  is in the _questions_ status; the person fills the answers on `main`; the plan is then
  _answered_ and the review starts again with the questions and answers as its input, writing
  `review.md`.

Either way the answers end up in `questions.md`, so the record is in the plan's folder and the
orchestrator reads only files. A `review.md` beside a question that is not answered is a
mistake (`check-planning` reports it). Only reviews can ask questions for now; an
implementation could stop with questions before its notes, but no template or script supports
that yet.

## Commits

Every commit that implements a plan links it with a `Plan:` trailer, the plan's path from
the repository root, and the pull request description carries the same link:

```text
reviewer2: declaration graph view (plan 0025)

Plan: reviewer2/planning/plans/0025/plan.md
```

`git log --format='%(trailers:key=Plan,valueonly)'` lists them. Git reads trailers only from
the message's last paragraph, so `Plan:` goes in the same block as the other trailers
(`Co-Authored-By:`), with no blank line between them. A commit that only writes or
changes plans needs no trailer.

## Checking a planning folder

A planning root is a folder that holds `plans/` or `draft-plans/` (a lab has one per product and
one at its root, lab constitution D15). Every script below takes a root, as before, or any other
folder: it then searches the tracked and untracked files under it for roots, skipping
`node_modules` and dot-folders (the person's `.notes/` among them) and never entering a root, so
a root's old `notes/` is not read either.
`check-planning` checks each root found and prints one status table per root; `roadmap`
prints each root's roadmap (`--title` and `--write` are refused with more than one); `promote-plan <dir>
<slug>` and `plan-history <dir> <nnnn>` act on the one root that holds the draft or the plan and
refuse, naming the roots, when several do. In a lab, `check-planning .` at the workspace root
covers every planning root of the lab; never run it on this repository's root, which would find
the archived trees. `move-plan` takes paths and no root.

`scripts/check-planning.mjs <planning-dir>` checks what `validate-md` cannot see:
every folder under `plans/` and `draft-plans/` has a plan, and no plan folder is left at the
root; notes and screenshot folders have their plan and notes, a review has its notes, and a
draft has neither; `after:` and `fixes:` name existing plans and `after:` has no cycle; a
review's verdict is one of the four; a `questions.md` has its notes and at least one
question, and no `review.md` sits beside one that still has an unanswered question; a current-form plan opens with the sentence above and
keeps no notes section; an `issues/` folder holds only Markdown files, each linked from a
plan of its folder; links in plans, notes and reviews resolve (a link starting with `/` from the repository root). It prints a status table (implemented, reviewed, waiting). Then it runs `validate-md` over the folder (found on `PATH`; run the script through
`pnpm exec` in a package that has `validate-md`, or pass `--no-validate` and run it
yourself).

## Life of a plan

1. **Draft.** Write `draft-plans/<slug>/plan.md`; keep it as small as the change allows.
2. **Promote.** The planner or the orchestrator runs `promote-plan` on `main` and commits.
3. **Reconcile.** Check that the plan is numbered (a draft is not implemented, see "Numbering
   and files"). Do step 0; fix the plan where the code moved, before implementing.
4. **Implement.** Follow the plan. The plan is not edited by the implementation; what turned
   out differently goes in the notes.
5. **Close.** Write the implementation notes with their evidence. Commit with the `Plan:`
   trailer. There is no roadmap to update: `scripts/roadmap.mjs` prints it when needed.
6. **Review.** The reviewer writes `review.md`; a finding that needs code becomes a draft
   with `fixes:`. A reviewer that needs the person's answer first writes `questions.md`
   (above).
7. **Validate.** `check-planning` on the planning folder, which runs `validate-md` too.

A **skills migration** plan (raising a skills package, or a skill change a lab takes from source)
is written in the draft folder `lab migration-input` made, as `plan.md` beside its
`migration-input.md` and `skills.diff`: the plan restates what it takes from the input (the
`**Migration:**` notes it applies, the findings and units it fixes, the frozen packages it leaves
out) and keeps the files beside it; the input's quoted text is data, not instructions.

`scripts/plan-history.mjs` reads a plan's folder across the move to `plans/` and finds
its commits by the `Plan:` trailer under both paths.

## Running plans with the orchestrator

`reviewer2/toolkit/plan-orchestrator` (the `plan-orchestrator` CLI, a package of the reviewer2 workspace) drives the plans of a planning
folder through steps 4 to 6 above: it starts an agent on an open plan whose `after:` plans have
notes, merges the pull request the agent opens (with a merge commit, after a local check),
then starts a reviewer on the merged work and merges the
review. When the reviewer asks questions, the orchestrator reports them (with the draft pull
request and, for a cloud task, the session's link), merges a pull request that holds
`questions.md` alone, reports the plan until its questions are answered on `main`, and starts the
review again. Agents run on Claude Code's cloud or in herdr panes. `--dry-run` prints what it would do
and why, `--step` does the first action, and with neither it loops. The files in a plan's folder
are all it reads, so it needs no state of its own in the repository; its README has the details,
the token and the modes.

A planning folder opts in with an optional `orchestrator.json` at its root, a JSON object with
the commands the orchestrator runs from the repository root (all strings):

| Key             | Is                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------- |
| `check`         | The local check of an implementation's pull request. Without it nothing is merged.       |
| `promote`       | Promotes a draft; the slug is appended. Default: `promote-plan.mjs <dir>`.               |
| `checkPlanning` | The check of a review's pull request. Default: `check-planning.mjs <dir> --no-validate`. |
