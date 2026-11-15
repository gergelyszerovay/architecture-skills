---
name: changelog
description: Write a changelog entry, release a version, or check a changelog; for every published package and every skill. Use when changing a published package or a skill (an entry goes under Unreleased in the same commit), when releasing a version (Unreleased moves under the version heading), when creating a package or a skill (it gets a CHANGELOG.md), or when `check-changelogs` or `validate-md` rejects a changelog; provides the `changelog` template and the `check-changelogs` and `release-changelog` scripts.
metadata:
  version: '0.4.1'
---

# Skill: changelog

The release notes of a published package or a skill: what changed for those who consume a version.
Git is the history of the code; a changelog is for the person who updates and wants to know what
they get. Every published package and every skill has one, in one shape, checked by a script.

## Where it lives

| Subject             | File                                                        | Listed in                                                                   |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| A published package | `CHANGELOG.md` beside its `package.json`                    | the package's `files` (a changelog that is not published helps nobody)      |
| A skill             | `CHANGELOG.md` in the skill's own folder, beside `SKILL.md` | nothing: it travels with the skill, so a lab that installs the skill has it |

A published package is a `package.json` with a name that is not `"private": true` and has a `publishConfig` naming
the registry it goes to (GitHub Packages): without one, `pnpm publish` sends the package to the default registry.
`check-changelogs .` fails a named manifest that is neither private nor given a `publishConfig`, and one that is both.
A skill is a folder with a `SKILL.md` inside a published package (the package ships it). Unpublished packages and a
lab's own skills need no changelog; a lab may keep one, and the checker leaves them alone.

## The public changelog

A package or skill whose files are copied to a public repository has a second file, `CHANGELOG.public.md`, in the
same folder as its `CHANGELOG.md` (a package's folder, a shipped skill's folder, a release group's root). The
internal changelog cites plans, decisions and private paths; the public copy is for the readers of the public
repository, so it never carries the internal file.

- **Same shape, same headings.** It has the shape below, the same title (`# Changelog: <name>`), `## Unreleased`
  first, and the same version headings in the same order as its `CHANGELOG.md`. A version with nothing a public
  reader needs holds the one line `No changes for users of the package.` instead of categories, so the two files never
  disagree on what was released. (The line is allowed under a version heading only.)
- **Who needs one.** Every changelog a public copy would hold: those inside the `include` of a release group whose
  `repo` is not `null`. A changelog of a private package, or of a group that is never copied, needs none.
  `check-changelogs --public` reports a missing one; `--public=<path>,<glob>` limits that to the folders it names, so
  a repository can say which of its changelogs are public.
- **Writing an entry.** A change a consumer notices gets its entry under `## Unreleased` in **both** files in the
  same commit. The internal one is written as above (it may cite plans, decisions and private paths). The public one
  is written for a reader of the public repository: **no plan, no decision row, no private path, no private
  repository**; it may link files of the public copy. When the change is not visible to a public reader, only the
  internal file gets an entry.
- **Releasing.** `release-changelog` moves the `## Unreleased` entries of both files under the new version
  heading; an empty public `Unreleased` gets `No changes for users of the package.` under the version. A release
  group's generated changelog has a public twin made the same way from the packages' public changelogs only.

## The shape

```markdown
# Changelog: @scope/name

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

### Added

- **The first change.** What a consumer of the version notices. (lab plan 0001)

## 1.2.0

### Changed

- **Breaking:** **The default output folder is `out/`.** It was `dist/`; set `outDir` to keep it.

  **Migration:** In every package that builds with the tool, set `outDir: "dist"` or move what reads
  `dist/` to `out/`; the build's output folder shows it is done.
```

- The title is `Changelog: ` and the package's name, or the skill's `name`.
- `## Unreleased` comes first and is always there, empty when there is nothing to say. Then one
  `## <version>` section per release, newest first. **A heading is the version and nothing else:**
  no date, no `v`, no note. (Git tags and the registry hold the dates.)
- Inside a section, the categories `### Added`, `### Changed`, `### Deprecated`, `### Removed`,
  `### Fixed`, `### Security`, in this order, each at most once, none empty. Nothing but categories
  sits under a `##` heading.
- An entry is a bullet that opens with a bold sentence, then the detail, and it may cite its plan in
  parentheses (`(lab plan 0005)`). Continuation lines are indented by two spaces.
- **Breaking.** An entry that needs action from the consumers (a renamed option, a removed export, a
  new required setting) starts with `**Breaking:** ` and then its bold sentence. In `0.x` a breaking
  change takes at least a new minor version, from `1.0` a new major version.
- **Migration.** What to change in existing code goes in a line of its own inside the entry, indented
  two spaces like any continuation, after the entry's detail (a blank line before it is allowed),
  opening with `**Migration:** ` and then, in the reader's words, which files (by kind or glob), what
  to do to them and how to see that it is done (the rule or script that checks it). An entry has at
  most one; it runs to the end of the entry and may span several indented lines. A marker inside a
  fenced code block is an example, not the entry's line. It sits beside
  `**Breaking:**`, never in its place: the entry still opens with its bold sentence. A tool that
  collects the migration of a release (such as a lab's update) reads these lines and nothing else.
- **When an entry needs a `**Migration:**`.** When code or documents that followed the previous
  version have to change to follow this one: a profile rule added or tightened, a block, layer or role
  renamed, a template's new required section, a script that now refuses what it accepted, or a
  skill's guidance that changes how existing code is written (a layout moved, a convention replaced),
  even where no tool checks it yet. It needs none when the change adds something existing code may
  ignore, concerns only code written from now on, loosens a rule, or changes wording.
  - In a **skill's** changelog every `**Breaking:**` entry needs one (`check-changelogs` refuses it
    without), and a non-breaking entry may have one (a guidance change no check enforces is not
    breaking, yet existing code should follow it). A skill without a profile follows the same rule:
    its existing code is the documents bound to its templates and the repositories' use of its
    scripts.
  - In a **package's** changelog it is optional: a package's `**Breaking:**` entries already say what
    to do in their detail.

## What gets an entry

A change a consumer of the version would notice: a command, an option, an output, a rule a checker
enforces, a document a skill tells the reader to follow, a fix of a bug they could hit. It goes into
`## Unreleased`, **in the same commit as the change**, under the category it belongs to, in the
words of the person who reads it (what changed for them, not which file). Refactors, tests,
internal documents, plans and tooling of the repository get none.

A skill is changed when what it tells its reader to do changes: a rule, a reference, a template,
a script it ships. The skill's own `CHANGELOG.md` gets the entry; the package that ships it
names the skill's version at release (below).

## The warning at commit time

`check-changelogs --staged` (the pre-commit hook runs it) only warns; the release check is the gate. It names a
package or skill when a shipped file is staged, a deleted one included, and its `CHANGELOG.md` has no new entry:
a staged changelog silences the warning only when it adds a line under `## Unreleased`, so an edit elsewhere in it, or
a release (Unreleased moved under a version), does not. A package's shipped files are everything but tests,
configuration, internal documents (`layered-docs/`, `planning/`), `dist/` and Markdown other than a README, so a
source change counts although `files` names only `dist`. When its `package.json` has a `files` list, a Markdown file
the list includes is shipped too, such as a manual (an entry is a file, a folder, or a glob matching under its
directory part: the text before the last `/` that precedes the first `*`, or the package root when there is none).
A skill ships
everything but its changelog, tests and the same internal folders. The warning also names a staged `CHANGELOG.md`
whose `CHANGELOG.public.md` beside it is not staged, so a public entry is not forgotten (a changelog with no public
twin gets no such warning; `--public` asks for the twin).

## Release groups

Packages that are released together form a **release group**. A package joins one in its `package.json`:

```json
{
  "changelog": { "group": "reviewer2" }
}
```

(beside `covers` when it has that). The group is released as one: every package of it gets the group's version, even a
package that did not change. So two changelogs exist, and only one is written by hand:

- **A package's `CHANGELOG.md`** stays what a person writes. It lists the versions the package changed in; the versions it
  did not change in are missing (**gaps are allowed**), and its top version heading may be below its `version`, never above.
- **The group's changelog** is generated by `release-changelog --group <name> <folder> <version>` and nobody edits it. It is
  `CHANGELOG.md` in the group's folder (a folder above the packages, such as the product's root), titled
  `# Changelog: <name>`. `## Unreleased` stays empty. Each release adds one `## <version>` section: the entries of the
  packages' sections of that version, by category, each entry's bold sentence prefixed with the package's name
  (`**lab: The first change.**`).

`check-changelogs` checks the group changelog when it exists: an empty `Unreleased`, no heading but versions, and its top
version equal to the version of every package of the group. `--release` also demands it, and counts a `**Breaking:**` entry
since the newest tag of the group (`<name>@<version>`) or of the package, whichever is newer. A group that has never been
released has no changelog yet, and the default check does not ask for it.

A skill never joins a group: it keeps its own version and changelog, and the package that ships it lists the versions of its
skills in the "Skills in this release" entry (below).

## Bundled private packages

A published package can bundle private workspace packages into what it ships: its build inlines their
source, as a bundler does. A change to such a private package is a change of the published package, so
the published package's `package.json` names the private packages its build bundles:

```json
{
  "changelog": {
    "covers": ["@scope/private-parser", "@scope/private-model"]
  }
}
```

`check-changelogs --staged` then warns when a covered package's shipped files are staged without a change
to the published package's `CHANGELOG.md`, and names that changelog. A private package's shipped files are
those of any package (the rules above), except that a bundled one ships no Markdown, no test support
(`testing/`, `fixtures/`, `__fixtures__/`, a `testing.*` entry, `*.fixture.*`, `*.fake.*`, `*.contract.*`,
`*.stub.*`, `*.mock.*`), and nothing at its root that its build never bundles (`package.json`, `bin/`,
`scripts/`, its configuration files), since its build never holds them. A private package that no published
package covers is never warned about. The covering packages are the workspace's: the packages the root
`pnpm-workspace.yaml` names, or the tracked manifests without such a file. `--staged` reads no manifest under
`archive/`, `node_modules` or a dot-folder, and checks no staged file of `archive/`. The list is kept by hand,
beside the build's bundle list, which names what the build inlines. The default check refuses a `covers` that
is not a list of names, and a name that is not a private package of the folder it checks.

## Versions

- A package's version is `version` in its `package.json`. A skill's version is the `Version` of its
  architecture profile where it has one, otherwise `metadata.version` in the frontmatter of its
  `SKILL.md`:

  ```yaml
  ---
  name: my-skill
  description: …
  metadata:
    version: '0.2.0'
  ---
  ```

  `metadata` is the Agent Skills field for what the format does not define; Claude Code,
  `install-skills` and skills.sh read the other fields and ignore it.

- **The top version heading equals the version.** A version that is raised ahead of the last release
  (the bump is committed, the release is not) keeps the work under its own `## <version>` heading
  and `## Unreleased` stays empty; a version that is not raised keeps the work under `## Unreleased`
  above the heading of the version it is at.
- A skill's version rises with every release that carries an entry of its changelog, by the same
  rule as a package's, and for a skill with an architecture profile that is the profile's `Version`
  too, whether or not a rule changed: a minor step for a breaking change in
  `0.x`, a patch otherwise; from `1.0` a major step for a breaking change, a minor step for a new
  feature, a patch otherwise.

## Releasing

1. Raise the version (`package.json`, or the profile's `Version`, or `metadata.version`). A skill
   with an architecture profile raises the profile's `Version` for every change it ships, a rule or
   not. No copy of the version before it is kept and no binding changes: a binding names no version,
   and a repository that installs the release migrates to it (the architecture-profile skill,
   "Versioning"), reading the entries marked `**Migration:**`.
2. `release-changelog <folder> <version>` moves the `## Unreleased` entries under
   `## <version>` and leaves `## Unreleased` empty above it, in the `CHANGELOG.public.md` beside it too (an empty
   public `Unreleased` becomes `No changes for users of the package.`). Run it for the package and for each
   skill that has entries.
3. For `@gergelyszerovay/architecture-skills` (and any package that ships skills), list in its own
   changelog's section for the release the versions of the skills it contains, as the first entry
   of its `### Changed` or `### Added` category.
4. `check-changelogs --release <package folder>` refuses unless the top section is the version, `Unreleased` is empty,
   every `**Breaking:**` entry since the last release comes with the step above, and every `**Breaking:**` entry of a
   skill's section this release ships has a `**Migration:**` line (the sections above the headings the changelog had at
   the package's or its group's release tags; sections already released are never judged, and without a tag none is). The publish script
   runs it for each package it publishes. The last release of a package is its newest tag
   `<name without scope>@<version>`; a skill's is the version heading below its top one.

**`release-changelog --bump`** does steps 1 and 2 for one package or skill folder:

```bash
release-changelog --bump <folder> [patch|minor|major|<version>] [--dry-run] [--json]
```

It reads the current version and the `## Unreleased` entries and takes the smallest version the rules above allow: a
`**Breaking:**` entry needs a new minor version in `0.x` and a new major version from `1.0`, otherwise a patch. A step or
version asked for that is smaller is refused (exit 1) naming the entry that needs more; a larger one is used. It writes
the version into its home (the `version` line of `package.json`, the profile's `- Version:` line, or `metadata.version`;
exactly one line is replaced, and it refuses when there is none or several), then moves Unreleased under the new
heading. It changes nothing when Unreleased is empty. `--dry-run` writes nothing and prints the old version, the new one
and why; `--json` prints the same as one object. It does not write the packages' "Skills in this release" entry (step 3)
and does not follow ranges that name the new version: those are yours. `release-changelog <folder> <version>` still only
moves the entries.

`lab update` prints the sections between the old and the new version of each package and skill it
updates, so these are what a lab's owner reads.

## The checks

```bash
check-changelogs .                       # every package and skill under the folder; `pnpm check` runs it
check-changelogs --staged [file...]      # warns (never fails) about staged or deleted shipped files without an entry, a covered private package's included; the pre-commit hook runs it
check-changelogs --release <folder>      # before publishing
check-changelogs --public[=<path>,<glob>] .   # also: every changelog (or those under the named folders) has a CHANGELOG.public.md
release-changelog <folder> <version>
release-changelog --bump <folder> [patch|minor|major|<version>] [--dry-run] [--json]
release-changelog --group <name> <folder> <version> [--dry-run]   # the generated changelog of a release group
validate-md CHANGELOG.md                 # a CHANGELOG.md binds to the `changelog` template by its name
                                         # (CHANGELOG.public.md: `check-changelogs` validates it with the template)
```

`check-changelogs .` fails when a package or skill has no changelog, a package's `files` leaves it
out, the title or the `## Unreleased` section is missing (or sits below a version heading: the template
cannot see that, the script does), the top version heading differs from the version, a `changelog.covers`
names no private package of the folder, a skill's `**Breaking:**` entry not released yet has no `**Migration:**`
line (one under `## Unreleased`, or under a version heading above every heading the changelog had at a release tag of
the package that ships the skill, its own `<name>@<version>` or its group's `<group>@<version>`; without such a tag only
`## Unreleased` is judged, never a released section), or `validate-md` rejects the file. A `CHANGELOG.public.md`
beside a changelog is validated with the same template and compared with it: a different title, `## Unreleased` not
first, or a version missing, extra or out of order (named) fails; `--public` also fails a changelog without one, and
`--release --public` checks both files at a release (the public `Unreleased` must be empty too). It needs `validate-md` on the
`PATH` (run it through `pnpm exec`, or pass `--no-validate`).

The `changelog` template (`markdown-schema-templates/changelog/`, with valid examples) is open: a
version heading is a section's key, which a template cannot declare, so `changelog.refine.ts`
checks the headings (versions, newest first), the categories and the `**Migration:**` lines (each
belongs to an entry, at most one per entry, with text after the marker). A workspace links the template as
`markdown-schema-templates/changelog` so `validate-md .` binds every `CHANGELOG.md` to it
(markdown-schema skill, "Binding").
