# Changelog: planning

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.1.4

### Added

- **`references/plans.md` says where a skills migration plan is written.** In the draft folder
  the migration-input tool made, as `plan.md` beside its `migration-input.md`, restating what it takes from the input and
  keeping the file beside it.

## 0.1.3

### Added

- **`SKILL.md` says when a change needs a plan.** A new section, "When a change needs a plan", puts a
  bug fix, a change its package's decisions already allow and a decision amended in place in one
  commit without a plan, and a new command, format, package or decision, or work in ordered steps,
  under a plan; the person decides when in doubt. A change without a plan keeps the changelog, the
  documents, the hooks and the checks.

## 0.1.2

### Added

- **A plan names its risks to check.** The `plan` template gains an optional **Risks to check**
  section, and `references/plans.md` says what goes in it: every input that does not come from the
  person, every walk or watch over a whole tree and every cost paid per tab or per request, each
  with the check, bound or spec that handles it. The implementer handles each item before the
  review, and the review starts from the list. Existing plans stay valid.

## 0.1.1

### Added

- **The person's notes live in `.notes/`, and no script enters it.**
  - The notes are a `.notes/` folder at any level (beside a product's `planning/`, at the
    repository's root, in a package), no longer `notes/` inside the planning folder; `SKILL.md`,
    `references/plans.md` and `references/roadmap-and-direction.md` ("Notes") say so, and that an
    agent reads, searches or changes a note only when the person asks.
  - `move-plan` reads and rewrites no file under a `.notes/` folder at any depth, as under
    `planning/notes/`, and points no symbolic link there again; `check-planning`, `roadmap` and
    `promote-plan` never enter one (root discovery skips dot-folders). `planning-lib.mjs` exports
    `isInNotesFolder`. A planning root's old `planning/notes/` is skipped as before.
- **`move-plan` rewrites TSDoc root links.**
  - A `{@link /<path>#<Key> | <Key>}` (or `{@link /<path>}`) into a moved path, in a tracked
    `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` or `.cjs` file, is rewritten in the root form,
    as a Markdown root link already was; one whose target does not exist is left alone.
  - A tracked Markdown file that is a symbolic link is no longer rewritten through the link: its
    target is rewritten where it is tracked.
  - A link wrapped onto the next comment line (`{@link` then ` * /<path>…`) is rewritten too.
- **`move-plan` points moved symbolic links again and leaves `archive/` alone.**
  - A tracked symbolic link with a relative target that moved, or whose target moved, points at its target
    again and is staged; an absolute link and one under a `planning/notes/` folder are left as they are. The
    report counts them.
  - Nothing under a non-code folder `archive/` is rewritten: no Markdown or TSDoc link and no
    symbolic link. A `p/` folder is no longer passed over: it is rewritten like any other.
- **The `direction` template names a plan of another planning root.**
  - A Status may name the root before the plan's number: `in plan <root> 0012`,
    `implemented in plan <root> 0009`, for a product's log that a plan of another product carries.
    The example and `references/roadmap-and-direction.md` show the form.

### Changed

- **Row links follow the citations skill.** The Conventions cite the citations
  skill's **Rows** (it was the layered-documentation-authoring skill's "Citing a row").

## 0.1.0

### Added

- **Planning-root discovery.**
  - `planning-lib.mjs` gains `findPlanningRoots`, `resolveRoots`, `resolveOneRoot` and
    `isPlanningRoot`. `check-planning` and `roadmap` given a folder that is not a root work on
    every root under it; `promote-plan` and `plan-history` on the one root that holds the draft or
    the plan. A root given as before behaves as before.
  - `move-plan` rewrites no link in a file under a `planning/notes/` folder.
- **A reviewer asks before it judges.**
  - New `questions` template, bound to `questions.md` (and `<artifact>.questions.md`): a
    preamble and one `### Q<n>` per question with an `**Answer:**` line.
  - Two statuses derived from the files: _questions_ (notes, an unanswered question, no review)
    and _answered_ (notes, every question answered, no review). `planning-lib.mjs` gains
    `readQuestions`, `QUESTIONS` and the plans' `questions` field.
  - **Breaking change of the `roadmap` template:** a required **Questions for you** section
    between **Open** and **Implemented, not reviewed**; regenerate `roadmap.md` (answered plans
    are listed under **Implemented, not reviewed**).
  - `check-planning` reports a `questions.md` without notes or without a question, and a
    `review.md` beside an unanswered question.
  - `references/plans.md` gains "Questions before the judgement". Implementers do not ask
    questions yet.
- **The plan orchestrator.**
  - New optional `orchestrator.json` at the root of a planning folder (`check`, `roadmap`,
    `promote`, `checkPlanning`): the commands the `plan-orchestrator` CLI
    runs to check a pull request, regenerate the roadmap and promote a draft.
  - `references/plans.md` gains "Running plans with the orchestrator". No change to the templates
    or the scripts.
- **The planning skill.**
  - New skill: the workflow of numbered plans, a roadmap of stable numbered items and
    iterations (`references/plans.md`, `references/roadmap-and-iterations.md`).
  - New templates `plan`, `roadmap` and `iterations` in `markdown-schema-templates/`, with
    examples. The plan template is open and unordered (the `document`
    directive): it requires only **Status and scope**, so an existing plan binds without
    rewriting. The roadmap's order numbers and the iterations' IDs are row keys.
  - Needs `@gergelyszerovay/markdown-schema` 0.6.0 or later.
- **The `direction` template.**
  - `direction.md` binds to it: a table of agreements keyed `A<n>` (ID, Date, Direction, Status,
    Where it goes), each row's notes a free `## A<n> notes` section; `references/roadmap-and-direction.md`
    describes the log.

### Changed

- **Three workspaces.**
  - `plan-orchestrator` moves to its own package; `references/plans.md` names the new path.
  - The scripts are bins of the skills' package (`architecture-skills`): a workspace that links it
    runs `check-planning`, `plan-history`, `roadmap`, `promote-plan` and `move-plan` by name. No
    change to the scripts or the templates.
- **Open issues in `issues/`, everything else under `notes/`.**
  - The planning folder's root keeps `roadmap.md`, `deferred.md`, `direction.md`, `plans/`,
    `draft-plans/`, `issues/` and `notes/`. The archive moves to `notes/archive/`, design
    documents to `notes/docs/`, ideas to `notes/ideas/`; open issues are `issues/` (was the
    product's `0-issues/`). `roadmap.mjs` and `promote-plan.mjs` read `notes/archive/`, and still
    `archive/` for a folder migrated before.
- **Breaking:** **Plans live in one folder, drafts beside them, and the roadmap is generated.**
  - **Breaking change of the layout:** numbered plans live in `planning/plans/<nnnn>/`, drafts
    in `planning/draft-plans/<slug>/` (promoted by moving the folder to the next number). A
    plan's status is the files in its folder, each written once by one writer: `plan.md`,
    `implementation-notes.md`, and the new `review.md`.
  - **Breaking change of the `roadmap` template:** the roadmap is generated by `scripts/roadmap.mjs`
    from the plans' titles, their optional frontmatter (`after:`, `fixes:`) and the files beside
    them: **Open**, **Implemented, not reviewed**, **Done** and **Drafts**. Roadmap item numbers,
    the **Items** and **Deferred** sections and `work.yaml` are retired; the `iterations` template
    stays for an archived `iterations.md`.
  - New template `review` for `review.md`, with a **Verdict** that `check-planning` checks.
  - New scripts `roadmap.mjs`, `move-plan.mjs` (moves a plan folder and rewrites every relative
    link to it), `promote-plan.mjs` and the shared `planning-lib.mjs`. `check-planning` reads the
    new layout, checks the frontmatter and the verdicts, and with `--roadmap` the generated
    file; `plan-history` follows a plan folder across the move to `plans/`.
  - `references/roadmap-and-iterations.md` is now `references/roadmap-and-direction.md`.

  **Migration:** Move numbered plans to `planning/plans/<nnnn>/` and drafts to `planning/draft-plans/<slug>/`, regenerate the roadmap with `roadmap.mjs`, and run `check-planning` until it reports nothing.

- **Breaking:** **Roadmap items stay citable.**
  - **Breaking change of the `roadmap` template:** **Next** becomes **Items**, with an added
    **Status** column (`next`, `done` or `dropped`). An item keeps its row, and so its
    `roadmap.md#<order>` link, when its plan is implemented or it is dropped; **Done** stays the
    log of implemented plans. An existing roadmap moves its **Next** rows to **Items** with a
    status, and adds a row for every retired number it wants to keep citable.
  - The roadmap workflow (`references/roadmap-and-iterations.md`, "When an item moves") and the
    example roadmap follow.
- **Breaking:** **The roadmap is printed on demand, not committed.**
  - **Breaking change of `roadmap.mjs`:** it prints the roadmap to standard output; `--write <path>`
    writes it to a file instead (links relative to that file; refused with several planning
    roots); `--check` is gone (exit 2). Same sections and tables.
  - **Breaking change of `check-planning`:** `--roadmap` is gone (exit 2); a planning root keeps no
    `roadmap.md`. Promoting a draft regenerates nothing.
  - The roadmap is never committed: a workspace ignores `planning/roadmap.md` at any depth, and
    `orchestrator.json` loses its `roadmap` key. The `roadmap` template stays and validates a
    `--write` copy. Delete a committed `roadmap.md` and ignore it.
- **The planning scripts handle repository-root links.**
  - `check-planning` resolves a link starting with `/` from the repository root and reports one to
    a missing file; `move-plan` (and so `promote-plan`) rewrites a root link into a moved path in
    the root form; `plan-history` reads a plan's root links. `planning-lib.mjs` exports
    `resolveLinkPath` and `repositoryTop`.
  - `SKILL.md` and `references/plans.md` give the decision link in the root form,
    `[D26](/<product>/layered-docs/2.<product>.constitution.md#D26)`.
