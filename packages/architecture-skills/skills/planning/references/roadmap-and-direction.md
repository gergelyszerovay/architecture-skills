# The roadmap and the direction log

Plans are the only list of work, and each fact about a plan has one home. Nothing in the
planning folder is edited by two writers.

| Fact                                 | Home                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| a plan's number and what it delivers | its folder `plans/<nnnn>/` and the title of its `plan.md`            |
| a plan's status                      | the files beside it: notes, then a review (see [plans.md](plans.md)) |
| the order of the open plans          | `after:` in the plans' frontmatter                                   |
| the list of plans and their status   | the roadmap, printed by `scripts/roadmap.mjs` (never committed)      |
| work that is planned but not written | a draft under `draft-plans/<slug>/`                                  |
| an idea the user has not decided on  | the user's own `.notes/ideas/` (see "Notes")                         |
| what was left out on purpose         | `deferred.md`, kept by hand                                          |
| agreed direction not yet in a plan   | the direction log, `direction.md`                                    |

## The roadmap

`scripts/roadmap.mjs <planning-dir>` prints it to standard output from the plans' titles,
their frontmatter and the files beside them (`pnpm roadmap` in a workspace that has the
script). It is generated on demand and never committed: a generated file in Git only goes
stale. `--write <path>` writes a local copy instead, which `.gitignore` ignores as
`planning/roadmap.md`; a planning root keeps no `roadmap.md`, and `check-planning` and
`lab check` do not require one. Its
sections, each a table whose rows are a plan's number, linked, and its title:

- **Open:** numbered plans without notes, in `after:` order then by number, with the plans
  each one waits for.
- **Questions for you:** plans whose reviewer asked questions (a `questions.md` with an
  unanswered one), each linking the file.
- **Implemented, not reviewed:** plans with notes and no review, among them the plans whose
  questions are answered and whose review is due again.
- **Done:** reviewed plans, newest first, each linking its notes and its review.
- **Drafts:** each draft's title and folder.

A plan's number is its only ID: there are no roadmap item numbers. Link a plan by its path
(`plans/0025/plan.md`). The title of a plan says what it delivers, so the roadmap carries no
delivery line of its own.

Roadmaps written before this layout, with their item numbers (`roadmap.md#12`), are kept
verbatim in the notes' `archive/` (`.notes/archive/`, once `planning/notes/archive/`) and are not
bound to a template; a link from a living document follows them when the notes move.

## Drafts and ideas

A **draft** is `draft-plans/<slug>/plan.md`, a plan without a number. It holds planned work
that is not yet ready to be implemented; a numbered plan is approved for implementation.
Promote a draft with `scripts/promote-plan.mjs <planning-dir> <slug>`, which moves the folder
to the next free number and rewrites the links to it. An **idea** is the person's: a file in `.notes/ideas/`, written by an agent only when the
person asks; a plan that takes it restates what it takes and links it.

## Deferred (`deferred.md`)

`###` groups of bullet items, left out on purpose until a need appears. A deferred item that
is picked up becomes a draft and leaves the list.

## The direction log (`direction.md`)

One keyed row per agreement (`direction.md#A4`), with its date, the agreement in a few
sentences, a status (`agreed`, `ideation`, `in plan <nnnn>`, `implemented in plan <nnnn>`,
`superseded`) and where it goes next. A plan of another planning root, such as another
product's, names that root before its number: `in plan lab 0012`, `implemented in plan lab 0009`. It binds by its name to the `direction` template, so
the keys are citable. A row that becomes a constitution decision, a plan or a skill rule is pointed at its
new home and stays for the record. The log is not normative: the constitution, the plans and
the skills stay the homes of decided product rules, work and conventions.

## Notes (`.notes/`)

`.notes/` is the person's own folder, and it may sit at any level: the repository's root, a
product (beside its `planning/`), a package. It holds their design documents (`.notes/docs/`),
the ideas they have not decided on (`.notes/ideas/`), the documents of an earlier layout
(`.notes/archive/`) and their working notes. It is not part of the planning's working
documents: nothing in it has a status or a number, nothing in it is on the roadmap, and nothing
in it is normative. Its earlier place was `planning/notes/`, inside the planning folder; the
scripts and these rules treat a `planning/notes/` folder the same way where one is left.

- **An agent leaves it alone.** It does not read, search, edit, move or tidy anything under
  `.notes/` unless the person asks, and then only what they named. A note that a plan the
  agent works from links by name may be read, and only that note. A move the person asks for
  is a `git mv` by path, the note unopened; a search that does not honour the repository's
  `.ignore` (`git grep`, `grep -r`, `find`) excludes the folder by hand.
- **A plan does not depend on reading notes.** What a plan takes from a note is written in
  the plan (or in the constitution, a region document or a skill, wherever the fact belongs),
  with a link to the note for the person.
- **Not checked.** Notes need no template; `check-planning` validates none of them and checks
  no link in them. `move-plan` reads and rewrites no file under a `.notes/` or `planning/notes/`
  folder (the scripts' root discovery skips dot-folders and never enters a root either).
- **Read by the scripts only for an old archive:** under a planning root's `planning/notes/archive/`
  the printed roadmap links an archived roadmap and `promote-plan.mjs` counts numbered folders as
  used; a `.notes/` folder, outside the planning root, is never entered, so neither happens there.

## Retired: the work tracker and the iterations

`work.yaml` (what is in flight) and `iterations.md` (plans grouped into themes) were
hand-kept files that every plan edited. They are retired: what is open, waiting and done is
the `plans/` folder and the printed roadmap, and the parallelism is `after:`. An existing
`iterations.md` moves to the notes' `archive/`, bound to the `iterations` template, and the
`iteration-<nnnn>/` working folders move to the notes. Working notes need no template.

## Moving things

`scripts/move-plan.mjs <from> <to> [<from> <to> ...]` runs `git mv` and rewrites every
relative Markdown link into or out of the moved paths in the repository's tracked `.md`
files, skipping code; a repository-root link (`/products/reviewer2/….md#D21`) into a moved path is
rewritten in the root form, and so is a TSDoc root link (`{@link /products/reviewer2/….md#D21 | D21}`) into a
moved path in a tracked source file (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`). Use it for any move of a plan folder, a draft or a planning document,
so no link breaks (files under a `.notes/` or `planning/notes/` folder are neither read nor rewritten); old
`Plan:` trailers in the history keep their old paths. A tracked symbolic link with a relative target
that moved, or whose target moved, points at its target again, and nothing under a lab's non-code
folder `archive/` is rewritten.
