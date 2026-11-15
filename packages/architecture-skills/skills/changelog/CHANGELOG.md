# Changelog: changelog

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.4.1

### Added

- **A public changelog, `CHANGELOG.public.md`, beside a `CHANGELOG.md`.** A changelog that a public copy of
  the repository holds has a twin in the same folder, written for the readers of the public repository: the same
  title and version headings, no plan, decision row or private path, and `No changes for users of the package.` under
  a version that changed nothing public. The skill states the rule (**The public changelog**).
  `check-changelogs` validates the twin with the same template and compares it with its `CHANGELOG.md`, naming a
  missing, an extra or an out-of-order version; the new option `--public[=<path>,<glob>,...]` also fails a changelog
  with no twin (only the folders it names, when given), and with `--release` checks both files at a release.
  `--staged` warns about a staged `CHANGELOG.md` whose `CHANGELOG.public.md` is not staged.
  `release-changelog` (plain, `--bump` and `--group`) moves the entries of both files, giving an empty public
  `Unreleased` the nothing-public line, and generates the group's public twin from the packages' public changelogs.
  The `changelog` template accepts that line as a version section.

## 0.4.0

### Changed

- **Breaking:** **A skill's breaking entry needs a `**Migration:**` line.** An entry
  may carry one indented line `**Migration:** …` at its end, saying what to change in existing code (which files, what
  to do, how to see it is done); `validate-md` refuses a second one in an entry, one with no text and one before any
  entry; a marker inside a fenced code block is an example and counts for nothing. An entry needs one when code or documents that followed the previous version have to change (**The shape**).
  `check-changelogs .` refuses a skill's `**Breaking:**` entry not released yet without one, and `--release` one in a
  section this release ships (above the headings the changelog had at the package's or its group's last release tag;
  a released section is never judged, and without a tag only `## Unreleased` is); a package's entries need none. `release-changelog --bump` no longer reminds you to keep a
  copy of a profile under `versions/`: profiles keep none.

  **Migration:** Before releasing a package that ships skills, add a `**Migration:**` line to each `**Breaking:**`
  entry under `## Unreleased` of its skills' changelogs; `check-changelogs .` names each one that lacks it.

## 0.3.0

### Added

- **Release groups.** A published package can say `"changelog": { "group": "<name>" }` in its `package.json`. The packages of a
  group are released together with one version. `release-changelog --group <name> <folder> <version>` writes the group's
  changelog (`# Changelog: <name>`, in a folder above the packages) from the packages' sections of that version, each entry
  prefixed with its package's name; nobody edits it. `check-changelogs` lets a package of a group list only the versions it
  changed in (its top heading may be below its version, not above), checks the group changelog (an empty `## Unreleased`,
  the group's version as top heading) and, with `--release`, demands it and counts a **Breaking:** entry since the group's
  newest tag `<name>@<version>`. `changelog.covers` no longer needs to be present beside `changelog.group`.

### Changed

- **Breaking:** **`check-changelogs` names `@gergelyszerovay/markdown-schema`.** Its message about a missing
  `validate-md` asks for a package that depends on the new name, not on its former name, which is
  renamed.

## 0.2.0

### Added

- **`release-changelog --bump <folder> [patch|minor|major|<version>]`.** It raises the version of a package or a skill
  (its `package.json`, the profile's `Version`, or `metadata.version`) and moves Unreleased under it in one step. The
  step is the smallest the rules allow (a `**Breaking:**` entry: minor in `0.x`, major from `1.0`; otherwise a patch);
  a smaller one asked for is refused naming the entry, a larger one is used, and an empty Unreleased changes nothing.
  `--dry-run` prints the old version, the new one and why; `--json` prints it as one object. The form
  `release-changelog <folder> <version>` is unchanged.
- **A private package that a published package bundles counts for it.** The published package lists the private
  packages its build bundles in `changelog.covers` of its `package.json`. `check-changelogs --staged` warns when their
  shipped files are staged without the published package's `CHANGELOG.md`, and names that changelog;
  `check-changelogs .` refuses a name that is not a private package of the folder. The covering packages are the
  workspace's (the root `pnpm-workspace.yaml`, or the tracked manifests without one); `--staged` reads no manifest
  under `archive/`, `node_modules` or a dot-folder, and checks no staged file of `archive/`. A bundled private
  package ships none of its test support, root manifest or root configuration either.

### Changed

- **`check-changelogs --staged` sees deletions and shipped Markdown, and wants a real entry.** A deleted path is owned
  by the package or skill whose folder it was in. A package whose `package.json` has a `files` list ships what it
  ships without the list (so a source change still warns when `files` names only `dist`) and, on top of that, what the
  list includes, a `.md` too (a manual under `assets/`); a `docs/` Markdown file outside the list is not shipped. A glob
  entry of `files` matches only under its directory part (the text before the last `/` that precedes the first `*`),
  and an entry with no `/` before its `*` only files at the package root. A staged `CHANGELOG.md` silences the warning only when it adds a line under `## Unreleased`:
  an edit elsewhere in it, or a release, no longer does. "The warning at commit time" says so.
- **Breaking:** **A published package names its registry: not private and a `publishConfig`.** `isPublished` is now
  that test, so a package without `"private": true` and without a `publishConfig` is no longer found as published
  (`pnpm publish` would send it to the default registry). `check-changelogs .` fails a named manifest that is neither
  private nor given a `publishConfig` (add `"publishConfig": { "registry": … }` or `"private": true`), and one that is
  both (remove one); `--release` on such a folder still exits 2. "Where it lives" says so.

## 0.1.1

### Changed

- **`check-changelogs` and `release-changelog` skip notes folders.** A package or a skill under
  a `.notes/` folder at any depth (or a `planning/notes/` folder) is not found, so the
  scripts read no file there, and `--staged` passes over a staged file there.
- **A skill with an architecture profile raises the profile's version for every change it ships.** "Versions" and "Releasing", step 1: a rule or not, with a copy of the
  version before it under `versions/<version>/` and the bound packages moved to the new version
  (the architecture-profile skill, "Versioning").

## 0.1.0

### Added

- **The skill.** The rules for the changelog of a published package or a skill (location, shape, categories, `**Breaking:**` entries, versions, releasing), the `changelog` markdown-schema template with its refine and examples, and two scripts: `check-changelogs` (every package and skill under a folder; `--staged` warns about changes without an entry; `--release` before publishing) and `release-changelog` (moves `Unreleased` under a version).
