# Changelog: @gergelyszerovay/architecture-skills

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.8.2

No changes for users of the package.

## 0.8.1

### Added

- **The changelog skill supports a public changelog.** `CHANGELOG.public.md` beside a `CHANGELOG.md`:
  `check-changelogs --public[=<path>,<glob>,...]` pairs and checks it, `release-changelog` moves both files and
  generates the group's public twin, and the pre-commit warning names a staged `CHANGELOG.md` without its public
  twin. See the changelog skill's changelog.

### Changed

- **The package is developed in a repository of its own.** The `repository` field of the manifest names it, and the release group is now called `architecture-skills` (it was `block-architecture`; tags `architecture-skills@<version>` from the next release).

## 0.8.0

### Added

- **Skills in this release.** The versions of 0.7.2, with three-block-architecture raised to 0.6.0: angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.1, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.6.0.
- **three-block-architecture has a `.prop.ts` block** (D77) for attachments a subject wears: code-built, adopted from a
  `.glb`, or both.

## 0.7.2

### Changed

- **The citations skill's resolution reference names `.reviewermanifestignore`.** The manifest policy file was
  renamed from `.reviewerignore`; `references/resolution.md` says which file leaves a path unchecked.

## 0.7.1

### Changed

- **Skills in this release.** The versions of 0.7.0, with three-block-architecture raised to 0.5.3: angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.5.3.
- **`check-units` (three-block-architecture) finds packages in a group folder** (`prototypes/<group>/<name>`).

### Fixed

- **`check-changelogs` and `validate-md` work in a repository that installs the package.** The templates'
  `*.refine.ts` files failed to load under `node_modules` with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. The package now
  ships them as plain JavaScript (`*.refine.js`, written by `prepack` with `scripts/build-refine-js.mjs`), which needs
  `@gergelyszerovay/markdown-schema` with the same fix 0.13.2 or later.

## 0.7.0

### Changed

- **Skills in this release.** angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.5.2. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **Breaking:** **Bindings name no version; profiles keep no older copies.** The
  loader reads the installed profile and ignores a binding's `version`; the `versions/` copies of the architecture
  skills are gone; a binding may freeze its package (`"frozen": { "reason": … }`); the skills' changelogs mark what
  existing code has to change with `**Migration:**` lines, which `check-changelogs` requires on a skill's
  `**Breaking:**` entry.

  **Migration:** Follow the `**Migration:**` line of the architecture-profile skill's entry **A binding names the
  profile only**, then that of the changelog skill's entry.

## 0.6.1

### Added

- **three-block-architecture: the three.js app template proxies `/openrouter` to an OpenRouter gateway.** See the
  skill's changelog.

## 0.6.0

### Added

- **`install-skills` is a package of its own.** It was a bin of
  `@gergelyszerovay/architecture-skills`; a repository that installs the skills of any package no longer needs the architecture
  skills to get the installer. Same command, same options. A repository that ran the bin of the architecture skills adds this
  package (`pnpm add -D @gergelyszerovay/install-skills`).
- **`install-skills --check [--link] [--force]`.** It computes what a run would do and writes nothing: exit 0 and no output when
  nothing would change, exit 1 with one line per change and per finding a run would leave alone and fail on, exit 2 on a usage error
  or a layout a run refuses. See the install-skills changelog.

### Changed

- **Skills in this release.** angular-block-architecture 0.8.5, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.2, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.2,
  planning 0.1.3, product-profile 0.2.0, source-organization 0.1.1 and three-block-architecture 0.5.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **The three.js skill has presentable subjects.** D71 to D76 are added and D41 amended, the
  references explain subjects, presenters, the story, the camera hand-over and a scroll page, and the template's spec tables
  change (**Breaking** for a package that copies the template's `ParamSpec`); see the changelog of three-block-architecture.
- **The three.js skill has an engine lifecycle, clocks, a custom element and a standalone build.**
  `.element.ts` is a block, D2, D11, D31, D32 and D34 are amended and D69, D70 added; see the changelog of three-block-architecture.
- **The three.js skill has an asset pipeline's side.** `.exporter.ts` is a block, N6, D7 and D18 are amended and D67, D68
  added; see the changelog of three-block-architecture.
- **The three.js skill and template default to `WebGPURenderer` and TSL.** See the changelogs of
  three-block-architecture (amended decisions, D65, D66, the template's example) and architecture-profile (optional tags of
  `tsdoc-tags`, checked by `check-tsdoc-tags`).

### Removed

- **Breaking:** **The `install-skills` bin is a package of its own.** `install-skills` is
  now `@gergelyszerovay/install-skills` (a package with no dependency, released in the same group); this package no longer
  ships `scripts/install-skills.mjs` or the bin. A repository that ran `pnpm exec install-skills` from here must add the
  installer (`pnpm add -D @gergelyszerovay/install-skills`), or its setup
  fails for the missing bin. The installer no longer treats this package as its own: it installs the skills of the
  packages `installSkills` lists, this one included, only if the root lists it (it already had to).

## 0.5.0

### Changed

- **Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.1, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.1,
  planning 0.1.3, product-profile 0.2.0, source-organization 0.1.0 and three-block-architecture 0.4.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **Breaking:** **`install-skills` requires `installSkills` in the root `package.json`.** Without the field (or without a readable root
  `package.json`) it no longer installs the skills of every declared package that exports `./skills/*`, this package's own
  included: it installs nothing, names the packages that export skills, says the field is missing and exits 1. Skills an earlier run installed stay in place, neither removed nor refreshed, and the record and `.gitignore` are not
  rewritten. Add `"installSkills": [...]` listing every package whose skills you want, this package too (`[]` installs nothing and
  exits 0). Adding a dependency can no longer add agent instructions unseen.

  **Migration:** Add `"installSkills": [...]` to the root `package.json`, listing every package whose skills you want installed, including `@gergelyszerovay/architecture-skills`.

## 0.4.0

### Added

- **The three-block profile declares the rules applied to its units.** The `unit-imports` row gains
  `same-minor=three`; see the changelogs of three-block-architecture and architecture-profile.
- **The `changelog` skill knows release groups.** A package that says `"changelog": { "group": "<name>" }` is released with the
  others of its group: one version, a generated group changelog, gaps in its own changelog. See the changelog skill's
  changelog.

### Changed

- **Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.0, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.0,
  planning 0.1.2, product-profile 0.2.0, source-organization 0.1.0 and three-block-architecture 0.4.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **The licence is MIT.** `package.json` declares `"license": "MIT"` (it declared none) and the public copy of its
  release group carries an MIT `LICENSE`, copyright 2026 Gergely Szerovay.
- **Breaking:** **The three.js package template no longer depends on a runtime package.** It
  carries the small host contract, loop, controls and present pipeline it needs; `test:templates` links no runtime package. See the
  changelog of three-block-architecture.
- **Breaking:** **The skills depend on `@gergelyszerovay/markdown-schema`.** The package's dependency, the
  templates' `devDependencies`, the profile loader and the `changelog` skill's checker use the package's new name; the former name is replaced
  in every place; see the changelogs of architecture-profile, changelog, node-block-architecture and
  three-block-architecture.

  **Migration:** Replace the former-name devDependency with `@gergelyszerovay/markdown-schema` in packages bound to these skills, and follow the migration lines of the skills' entries.

### Fixed

- **The package skeletons pin `@gergelyszerovay/markdown-schema` at `^0.13.0`.** They pinned `^0.11.0`, which the
  renamed package never had; a spec in `scripts/skeleton-pins.test.mjs` refuses a skeleton whose pin of a package of this repository
  accepts neither its current version nor its next release. See the changelogs of node-block-architecture and three-block-architecture.

## 0.3.0

### Added

- **`release-changelog --bump` raises a version and releases its changelog in one step.** See the `changelog` skill's
  changelog.

### Changed

- **Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.1.1, changelog 0.2.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.4.1,
  planning 0.1.2, product-profile 0.2.0, source-organization 0.1.0 and three-block-architecture 0.3.3. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **The `changelog` skill's commit-time warning is sharper.** `check-changelogs --staged` counts a deleted shipped
  file and a shipped `.md` of a package whose `files` lists it (a package that lists only `dist` still warns about a
  source change), and a staged `CHANGELOG.md` silences it only when it
  adds an entry under `## Unreleased`. See the skill's changelog.
- **Breaking:** **The `changelog` skill's checker wants a `publishConfig` on a published package.** A named
  `package.json` that is neither private nor given a `publishConfig`, or is both, fails `check-changelogs .`; add
  `"publishConfig": { "registry": … }` to publish the package, or `"private": true`. See the skill's changelog.

  **Migration:** In each published package's `package.json`, add a `publishConfig` with the registry, or `"private": true`; `check-changelogs .` names each manifest that fails.

## 0.2.0

### Changed

- **The package's folder in the repository it was developed in moved** (`repository.directory` and the READMEs
  follow). The `hook:pre-commit` and `hook:setup` scripts are gone, and so is `sync:skills` (install the skills with
  `install-skills --link`). Nothing a consumer runs changes.
- **`move-plan` leaves only `archive/` alone.** A `p/` folder is no longer one of the non-code folders, so the
  planning skill's `move-plan` rewrites the links in it like any other; see the planning skill's changelog.
- **Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.1.1, changelog 0.1.1, citations 0.2.0 (it was symbol-citations 0.1.0),
  constitution 0.1.0, layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1,
  node-block-architecture 0.4.1, planning 0.1.1, product-profile 0.1.1, source-organization 0.1.0 and
  three-block-architecture 0.3.3. Versions of skills without a profile are `metadata.version` in their
  `SKILL.md`; those with a profile take the profile's, which now rises with every change to the skill
  (the architecture-profile skill, "Versioning"). The angular, node and three architectures and
  product-profile keep the profile they replace under `versions/`, so a package bound to it is still
  judged; the node and three.js package skeletons and the node reference repository bind the new
  versions.
- **Breaking:** **The `symbol-citations` skill is now `citations`, and holds the row form too.**
  - Once the pin accepts 0.2.0 (`pnpm add -D @gergelyszerovay/architecture-skills@^0.2.0`),
    `pnpm exec install-skills` installs `citations` and removes `symbol-citations`; a copy of the old
    skill you edited fails the run until `--force`, and a skill of your own named `citations` is a
    conflict.
  - A repository that links the skills (`.agents/skills/<name>`) links `skills/citations` instead of
    `skills/symbol-citations`; `install-skills --link` does, and removes the old link.
  - The row form moved from the layered-documentation-authoring skill, whose "Citing a row" points
    to the citations skill's **Rows**; the other skills point to `citations`. See each skill's
    changelog.

  **Migration:** Rename the skill in your own `AGENTS.md` or `CLAUDE.md` where they name `symbol-citations`; nothing rewrites them.

- **The node reference repository and the spartan boilerplate declare this package `^0.2.0`.** They declared `^0.1.1`, which no release has; 0.2.0 is the first published version with the `tsdoc-syntax` wrapper.

## 0.1.0

### Added

- **The `changelog` skill and the bins `check-changelogs` and `release-changelog`.**
  - Every published package and every skill has a `CHANGELOG.md` in one shape, checked by
    `check-changelogs`; `release-changelog` moves `Unreleased` under a version. The skill's rules are in
    its `SKILL.md`.
  - Each skill's changelog is in the skill's own folder, so it travels with the skill; this package has a changelog of its own, this one.
- **The bin `check-units`.** It judges the `unit.json` of each lib of a three.js package (see the
  three-block-architecture skill, 0.3.1). The package template's `lint` script runs it.
- **`eslint-rules.cjs` exports `tsdocSyntaxPlugin(tsdoc)`.**
  - The rule `architecture-skills/tsdoc-syntax` is `tsdoc/syntax` (the same parser, the package's
    `tsdoc.json`) except that a `{@link}` to a repository-root path with an optional fragment
    (`{@link /<path>.md#D21 | D21}`) is no finding. Register
    it as `plugins: { 'architecture-skills': tsdocSyntaxPlugin(tsdoc) }` and replace
    `'tsdoc/syntax': 'error'` with `'architecture-skills/tsdoc-syntax': 'error'`.
  - The node package skeleton, the node reference repository and the spartan boilerplate use it; the
    two reference repositories declare this package `^0.1.1` and carry an `.npmrc` with the scope's
    registry mapping.

### Changed

- **Skills in this release.** angular-block-architecture 0.8.3, architecture-docs-and-specs 0.1.0,
  architecture-profile 0.1.0, changelog 0.1.0, constitution 0.1.0, layered-documentation-authoring 0.1.0,
  layered-documentation-reading 0.1.0, node-block-architecture 0.4.0, planning 0.1.0, product-profile 0.1.0,
  source-organization 0.1.0, symbol-citations 0.1.0 and three-block-architecture 0.3.1. Versions of skills
  without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.
- **`new-package` makes a product package `private`.** `new-package node|three … --tier product` writes `"private": true` (it was unset), so a new product package is not counted as published by `check-changelogs` and needs no `CHANGELOG.md` yet. Remove `private` and add the changelog when it is to be published. Existing packages are not touched.
- **Breaking:** **The planning skill prints the roadmap.** `roadmap` prints to standard output (`--write <path>` for a local file, no `--check`);
  `check-planning` loses `--roadmap`; no planning root commits a `roadmap.md`. Details in the
  planning skill's changelog.

  **Migration:** Delete a committed `roadmap.md` and ignore it; print the roadmap with `roadmap`.

- **`install-skills` installs into one folder, writes a `.gitignore` and only the listed packages.**
  - When `.claude/skills` is a symbolic link to `../.agents/skills`, `install-skills` installs once, into
    `.agents/skills`, keeps one `.install-skills.json` and reports one target. Without the link it
    behaves as before (two real folders).
  - Each target folder gets a generated `.gitignore`: a header saying it is generated, then
    `/.install-skills.json`, `/.gitignore` and one `/<skill>/` line per skill installed there, sorted,
    and nothing else. A skill that is not an installed one (your own, one from `npx skills add`) is
    never listed, so Git tracks it.
  - `installSkills`, an optional array of package names in the root `package.json`: when it is
    there, only the declared packages it lists are installed from. A declared package that exports skills and is not
    listed is reported with its skill names and installs nothing; its skills installed earlier are removed. A listed
    package that is not declared, or exports no skills, is reported and the run exits 1. A field that is not an array
    of names stops the run. Without the field every declared package that exports skills is installed from, as before.
  - Every run prints the skills installed for the first time and those removed.
  - `installSkills` is matched against the declared key. A declared package whose installed
    `package.json` names another package is skipped, reported with both names, and the run exits 1;
    a declared key that is not a plain package name (such as `../../x`) is ignored.
  - A skill name that is not letters, digits, `.`, `_`, `-` (starting with a letter or digit) is
    refused and reported, so the generated `.gitignore` lists only safe names.
  - A link a person made into a package that is neither listed nor recorded is kept.
  - No link is followed out of the target folders: a `.claude`, `.agents` or `.agents/skills` that
    is a link, and a `.claude/skills` link that does not hold exactly `../.agents/skills`, stop the
    run before anything is written (exit 1, nothing deleted); the record and the `.gitignore` are
    written over a fresh file; a record that is not a regular file is not read; a link planted where a skill goes
    is removed or left alone, never written or deleted through.
- **Rows of documents are cited by root links.** The layered-documentation-authoring, product-profile,
  architecture-docs-and-specs, symbol-citations and planning skills say how; the planning scripts resolve and move
  root links; the skills cite their own rows by relative links. See each skill's changelog.

## 0.0.3

### Added

- **`install-skills` discovers the skills of installed packages, and `new-package` makes a package from a template.**
  - `install-skills` installs the skills of its own package and of every package the root
    `package.json` declares in `dependencies` or `devDependencies` (an undeclared or hoisted
    transitive package is ignored, so it cannot put instructions into the skills folders) whose
    `exports` has `./skills/*`, from the folder that export maps to. A skill name two
    packages provide is installed or refreshed from neither (a copy already installed stays) and reported (exit 1). A package's `./skills/*` target must start with `./`, have no `..` segment and resolve inside the package; symbolic links in another package's skills are not copied. The record
    (`.install-skills.json`) keeps `package` and `version` (the running package) and gains `packages`
    (name to version); each entry gains `package`. `--link` links each skill through its own package's `node_modules` path.
  - `new-package`, a bin of the skills package, makes a package from the node or three.js package
    template (`SKILL.md` of node-block-architecture and three-block-architecture).
- **The skills ship as a package with `install-skills`.** The `architecture-skills` package ships the skills (with their profiles, templates and
  scripts) and the `install-skills` command, which copies (or, with `--link`, links) every skill
  into a repository's `.claude/skills/` and `.agents/skills/`, records what it installed, and
  refreshes it when run again. `SKILL.md` ("Where profiles live") says how another repository sets it up.
- **Changes before 0.0.3 are not itemized.** The entries of this section are what was recorded for the package
  up to this version; its skills' changes are in their own changelogs.

### Changed

- **Skills in this release.** angular-block-architecture 0.8.3, architecture-docs-and-specs 0.1.0,
  architecture-profile 0.1.0, constitution 0.1.0, layered-documentation-authoring 0.1.0,
  layered-documentation-reading 0.1.0, node-block-architecture 0.4.0, planning 0.1.0, product-profile 0.1.0,
  source-organization 0.1.0, symbol-citations 0.1.0 and three-block-architecture 0.3.0. (Skills without a
  profile had no version before the `changelog` skill; 0.1.0 is the first version their changelogs record.)
- **The package is scoped: `@gergelyszerovay/architecture-skills`.** The package is renamed from `architecture-skills` to
  `@gergelyszerovay/architecture-skills` and is no longer private: GitHub Packages accepts only the owner's scope, and an
  unscoped name would resolve from the public npm registry. Consumers install `@gergelyszerovay/architecture-skills`, require
  `@gergelyszerovay/architecture-skills/load-profile.cjs` (and `eslint-rules.cjs`, `vendor-roots.cjs`), and reach a skill under
  `node_modules/@gergelyszerovay/architecture-skills/skills/`, which `install-skills` links into. The setup sections say
  `pnpm add -D @gergelyszerovay/architecture-skills` again, replacing the tarball workaround.
- **The scripts are bins of the package.** The package's bins are the checkers (`check-tsdoc-tags`, `check-block-placement`) and
  its exports name the modules (`architecture-skills/load-profile.cjs`, `eslint-rules.cjs`, `vendor-roots.cjs`). A bound
  package declares it as a devDependency and reaches the scripts by name instead of a relative
  path out of its workspace; `SKILL.md` and `references/rules.md` ("Scripts") say how. The two
  checkers gain a `#!/usr/bin/env node` line.
