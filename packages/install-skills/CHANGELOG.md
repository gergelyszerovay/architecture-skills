# Changelog: @gergelyszerovay/install-skills

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.8.1

### Changed

- **The package is developed in a repository of its own.** The `repository` field of the manifest names it, and the release group is now called `architecture-skills` (it was `block-architecture`; tags `architecture-skills@<version>` from the next release).

## 0.6.0

### Added

- **`install-skills` is a package of its own.** It was a bin of
  `@gergelyszerovay/architecture-skills`; a repository that installs the skills of any package no longer needs the architecture
  skills to get the installer. Same command, same options. A repository that ran the bin of the architecture skills adds this
  package (`pnpm add -D @gergelyszerovay/install-skills`).
- **`install-skills --check [--link] [--force]`.** It computes what a run would do and writes nothing: exit 0 and no output when
  nothing would change, exit 1 with one line per change (`would install`, `would refresh`, `would remove`, `would write` or
  `would rewrite` a record or a `.gitignore`) and per finding a run would leave alone and fail on (`would fail: …`: a conflict, a
  changed copy, a skill two packages provide, an unlisted package, a refused name, a missing `installSkills`), exit 2 on a usage error
  or a layout a run refuses. A doctor or a hook can ask without writing.

### Changed

- **Breaking:** **No package is special.** The installer installs the skills of the packages `installSkills` lists and of no other,
  the architecture skills included: they must be declared and listed like any other (they already had to be listed). A repository
  that listed nothing and relied on the installer's own package gets the report of an unlisted package naming it.
- **Breaking:** **The record has no `package` and `version` at its top level.** Its `packages` (name to version) and the `package` of
  each entry say what was installed; an older record still reads, and is rewritten by the next run.
- **A skill is copied without any symbolic link, whatever its package.** The installer's own package was trusted to copy its links;
  the filter now applies to every package.
- **A run installs only what differs.** It plans first, then applies the plan; a copy or link that already matches, a record and a
  `.gitignore` with the same text are left as they are, so their times stay.

## 0.5.0

No changes for users of the package.
