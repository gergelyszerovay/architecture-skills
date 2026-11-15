# Changelog: @scope/example-package

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

### Added

- **`--dry-run` prints the plan.** Nothing is written. (example plan 0007)

### Fixed

- **A missing folder is created.** The command used to stop with `ENOENT`.

## 0.2.0

### Added

- **A `report` command.** It prints the checks that ran.

### Changed

- **Breaking:** **The default output folder is `out/`.** It was `dist/`; set `outDir` to keep the old one. The
  folder is read from the configuration first.

### Removed

- **The `--legacy` flag.** It has done nothing since 0.1.0.

## 0.1.1

### Fixed

- **The exit code of a failed check is 1.** It was 0.

## 0.1.0

### Added

- **The package.** The `example` command and its configuration file.
