# Changelog: architecture-skills

Release notes of the architecture-skills group, one section per release, generated from the changelogs of its packages by `release-changelog --group`. Do not edit it by hand.

## Unreleased

## 0.8.2

No changes for users of the package.

## 0.8.1

### Added

- **architecture-skills: The changelog skill supports a public changelog.** `CHANGELOG.public.md` beside a `CHANGELOG.md`:
  `check-changelogs --public[=<path>,<glob>,...]` pairs and checks it, `release-changelog` moves both files and
  generates the group's public twin, and the pre-commit warning names a staged `CHANGELOG.md` without its public
  twin. See the changelog skill's changelog.

### Changed

- **architecture-skills: The package is developed in a repository of its own.** The `repository` field of the manifest names it, and the release group is now called `architecture-skills` (it was `block-architecture`; tags `architecture-skills@<version>` from the next release).

- **install-skills: The package is developed in a repository of its own.** The `repository` field of the manifest names it, and the release group is now called `architecture-skills` (it was `block-architecture`; tags `architecture-skills@<version>` from the next release).

## 0.8.0

### Added

- **architecture-skills: Skills in this release.** The versions of 0.7.2, with three-block-architecture raised to 0.6.0: angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.1, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.6.0.

- **architecture-skills: three-block-architecture has a `.prop.ts` block** (D77) for attachments a subject wears: code-built, adopted from a
  `.glb`, or both.

## 0.7.2

### Changed

- **architecture-skills: The citations skill's resolution reference names `.reviewermanifestignore`.** The manifest policy file was
  renamed from `.reviewerignore`; `references/resolution.md` says which file leaves a path unchecked.

## 0.7.1

### Changed

- **architecture-skills: Skills in this release.** The versions of 0.7.0, with three-block-architecture raised to 0.5.3: angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.5.3.

- **architecture-skills: `check-units` (three-block-architecture) finds packages in a group folder** (`prototypes/<group>/<name>`).

### Fixed

- **architecture-skills: `check-changelogs` and `validate-md` work in a repository that installs the package.** The templates'
  `*.refine.ts` files failed to load under `node_modules` with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. The package now
  ships them as plain JavaScript (`*.refine.js`, written by `prepack` with `scripts/build-refine-js.mjs`), which needs
  `@gergelyszerovay/markdown-schema` with the same fix 0.13.2 or later.

## 0.7.0

### Changed

- **architecture-skills: Skills in this release.** angular-block-architecture 0.8.6, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.3.0, changelog 0.4.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.3,
  planning 0.1.4, product-profile 0.2.1, source-organization 0.1.1 and three-block-architecture 0.5.2. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.

- **Breaking:** **architecture-skills: Bindings name no version; profiles keep no older copies.** The
  loader reads the installed profile and ignores a binding's `version`; the `versions/` copies of the architecture
  skills are gone; a binding may freeze its package (`"frozen": { "reason": … }`); the skills' changelogs mark what
  existing code has to change with `**Migration:**` lines, which `check-changelogs` requires on a skill's
  `**Breaking:**` entry.

  **Migration:** Follow the `**Migration:**` line of the architecture-profile skill's entry **A binding names the
  profile only**, then that of the changelog skill's entry.

## 0.6.1

### Added

- **architecture-skills: three-block-architecture: the three.js app template proxies `/openrouter` to an OpenRouter gateway.** See the
  skill's changelog.

## 0.6.0

### Added

- **architecture-skills: `install-skills` is a package of its own.** It was a bin of
  `@gergelyszerovay/architecture-skills`; a repository that installs the skills of any package no longer needs the architecture
  skills to get the installer. Same command, same options. A repository that ran the bin of the architecture skills adds this
  package (`pnpm add -D @gergelyszerovay/install-skills`).

- **architecture-skills: `install-skills --check [--link] [--force]`.** It computes what a run would do and writes nothing: exit 0 and no output when
  nothing would change, exit 1 with one line per change and per finding a run would leave alone and fail on, exit 2 on a usage error
  or a layout a run refuses. See the install-skills changelog.

- **install-skills: `install-skills` is a package of its own.** It was a bin of
  `@gergelyszerovay/architecture-skills`; a repository that installs the skills of any package no longer needs the architecture
  skills to get the installer. Same command, same options. A repository that ran the bin of the architecture skills adds this
  package (`pnpm add -D @gergelyszerovay/install-skills`).

- **install-skills: `install-skills --check [--link] [--force]`.** It computes what a run would do and writes nothing: exit 0 and no output when
  nothing would change, exit 1 with one line per change (`would install`, `would refresh`, `would remove`, `would write` or
  `would rewrite` a record or a `.gitignore`) and per finding a run would leave alone and fail on (`would fail: …`: a conflict, a
  changed copy, a skill two packages provide, an unlisted package, a refused name, a missing `installSkills`), exit 2 on a usage error
  or a layout a run refuses. A doctor or a hook can ask without writing.

### Changed

- **architecture-skills: Skills in this release.** angular-block-architecture 0.8.5, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.2, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.2,
  planning 0.1.3, product-profile 0.2.0, source-organization 0.1.1 and three-block-architecture 0.5.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.

- **architecture-skills: The three.js skill has presentable subjects.** D71 to D76 are added and D41 amended, the
  references explain subjects, presenters, the story, the camera hand-over and a scroll page, and the template's spec tables
  change (**Breaking** for a package that copies the template's `ParamSpec`); see the changelog of three-block-architecture.

- **architecture-skills: The three.js skill has an engine lifecycle, clocks, a custom element and a standalone build.**
  `.element.ts` is a block, D2, D11, D31, D32 and D34 are amended and D69, D70 added; see the changelog of three-block-architecture.

- **architecture-skills: The three.js skill has an asset pipeline's side.** `.exporter.ts` is a block, N6, D7 and D18 are amended and D67, D68
  added; see the changelog of three-block-architecture.

- **architecture-skills: The three.js skill and template default to `WebGPURenderer` and TSL.** See the changelogs of
  three-block-architecture (amended decisions, D65, D66, the template's example) and architecture-profile (optional tags of
  `tsdoc-tags`, checked by `check-tsdoc-tags`).

- **Breaking:** **install-skills: No package is special.** The installer installs the skills of the packages `installSkills` lists and of no other,
  the architecture skills included: they must be declared and listed like any other (they already had to be listed). A repository
  that listed nothing and relied on the installer's own package gets the report of an unlisted package naming it.

- **Breaking:** **install-skills: The record has no `package` and `version` at its top level.** Its `packages` (name to version) and the `package` of
  each entry say what was installed; an older record still reads, and is rewritten by the next run.

- **install-skills: A skill is copied without any symbolic link, whatever its package.** The installer's own package was trusted to copy its links;
  the filter now applies to every package.

- **install-skills: A run installs only what differs.** It plans first, then applies the plan; a copy or link that already matches, a record and a
  `.gitignore` with the same text are left as they are, so their times stay.

### Removed

- **Breaking:** **architecture-skills: The `install-skills` bin is a package of its own.** `install-skills` is
  now `@gergelyszerovay/install-skills` (a package with no dependency, released in the same group); this package no longer
  ships `scripts/install-skills.mjs` or the bin. A repository that ran `pnpm exec install-skills` from here must add the
  installer (`pnpm add -D @gergelyszerovay/install-skills`), or its setup
  fails for the missing bin. The installer no longer treats this package as its own: it installs the skills of the
  packages `installSkills` lists, this one included, only if the root lists it (it already had to).

## 0.5.0

### Changed

- **architecture-skills: Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.1, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.1,
  planning 0.1.3, product-profile 0.2.0, source-organization 0.1.0 and three-block-architecture 0.4.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.

- **Breaking:** **architecture-skills: `install-skills` requires `installSkills` in the root `package.json`.** Without the field (or without a readable root
  `package.json`) it no longer installs the skills of every declared package that exports `./skills/*`, this package's own
  included: it installs nothing, names the packages that export skills, says the field is missing and exits 1. Skills an earlier run installed stay in place, neither removed nor refreshed, and the record and `.gitignore` are not
  rewritten. Add `"installSkills": [...]` listing every package whose skills you want, this package too (`[]` installs nothing and
  exits 0). Adding a dependency can no longer add agent instructions unseen.

  **Migration:** Add `"installSkills": [...]` to the root `package.json`, listing every package whose skills you want installed, including `@gergelyszerovay/architecture-skills`.

## 0.4.0

### Added

- **architecture-skills: The three-block profile declares the rules applied to its units.** The `unit-imports` row gains
  `same-minor=three`; see the changelogs of three-block-architecture and architecture-profile.

- **architecture-skills: The `changelog` skill knows release groups.** A package that says `"changelog": { "group": "<name>" }` is released with the
  others of its group: one version, a generated group changelog, gaps in its own changelog. See the changelog skill's
  changelog.

### Changed

- **architecture-skills: Skills in this release.** angular-block-architecture 0.8.4, architecture-docs-and-specs 0.1.1,
  architecture-profile 0.2.0, changelog 0.3.0, citations 0.2.0, constitution 0.1.0,
  layered-documentation-authoring 0.1.1, layered-documentation-reading 0.1.1, node-block-architecture 0.5.0,
  planning 0.1.2, product-profile 0.2.0, source-organization 0.1.0 and three-block-architecture 0.4.0. Versions of
  skills without a profile are `metadata.version` in their `SKILL.md`; those with a profile take the profile's.

- **architecture-skills: The licence is MIT.** `package.json` declares `"license": "MIT"` (it declared none) and the public copy of its
  release group carries an MIT `LICENSE`, copyright 2026 Gergely Szerovay.

- **Breaking:** **architecture-skills: The three.js package template no longer depends on a runtime package.** It
  carries the small host contract, loop, controls and present pipeline it needs; `test:templates` links no runtime package. See the
  changelog of three-block-architecture.

- **Breaking:** **architecture-skills: The skills depend on `@gergelyszerovay/markdown-schema`.** The package's dependency, the
  templates' `devDependencies`, the profile loader and the `changelog` skill's checker use the package's new name; the former name is replaced
  in every place; see the changelogs of architecture-profile, changelog, node-block-architecture and
  three-block-architecture.

  **Migration:** Replace the former-name devDependency with `@gergelyszerovay/markdown-schema` in packages bound to these skills, and follow the migration lines of the skills' entries.

### Fixed

- **architecture-skills: The package skeletons pin `@gergelyszerovay/markdown-schema` at `^0.13.0`.** They pinned `^0.11.0`, which the
  renamed package never had; a spec in `scripts/skeleton-pins.test.mjs` refuses a skeleton whose pin of a package of this repository
  accepts neither its current version nor its next release. See the changelogs of node-block-architecture and three-block-architecture.
