# Changelog: architecture-profile

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.3.1

### Changed

- **Examples name the package folder `packages/architecture-skills/`.** The skill's documents named the folder the package had in a different repository; they name the folder of this one.

## 0.3.0

### Added

- **A package can be frozen.** `"frozen": { "reason": "<why>" }` in a binding takes the
  package out of the migration to the installed version: no rule of its profile judges it. `check-tsdoc-tags`,
  `check-block-placement` and `check-units` print one line,
  `<package name>: frozen (<reason>); not checked against <profile> <installed version>`, and exit 0, and
  the `eslint-rules.cjs` builders return no rule for it; it is still built and tested. `frozen` takes exactly
  `reason`, one line of 1 to 300 characters, not only spaces and with no control characters (no C0 or C1 control,
  DEL, U+2028 or U+2029, so a printed reason cannot move the cursor or rewrite the terminal), and `load-profile.cjs`
  refuses any other shape. `loadBoundProfile` returns it as `frozen`, and `frozenLine` is the line the scripts print. The **Overrides**
  bullet names it beside `"enforcement": "advisory"`, which is checked and reported; a frozen package is not checked.

### Changed

- **Breaking:** **A binding names the profile only.**
  `"architecture": { "profile": "<name>" }`: the loader reads the installed profile and returns its `Version`, a
  `version` the binding still names is accepted and ignored whatever its type, and `findBoundProfile` returns no `version`. The copies under `versions/`
  are gone and no binding is raised at a release: a repository has one version of the skills package installed, and
  raising it is a migration of the repository (**Versioning**). A package bound to an older profile is judged by the
  installed one from now on, so its lint may report what the newer rules add.

  **Migration:** In every `package.json` with an `architecture` binding, delete `version`, then run each package's
  `lint` and architecture check; fix what they report, or freeze the package (`"frozen": { "reason": … }`). A package
  whose libs carry `unit.json` keeps its `version` until the tool that reads those files reads the installed profile
  (the release of that tool says it).

## 0.2.2

### Added

- **Optional TSDoc tags.** The `tsdoc-tags` rule takes `optional=<tag>(<values>), …` in its Parameters: a
  block need not carry such a tag, and where its primary declaration does, `check-tsdoc-tags` checks the value as it checks a
  required tag's. `load-profile.cjs` returns them as `optionalTags` and exports `parseOptionalTags` and `tagValueFinding`. A
  profile whose rule says `none` checks what it checked before.

### Changed

- **`SKILL.md` names the installer's package.** The setup step adds `@gergelyszerovay/install-skills` beside
  `@gergelyszerovay/architecture-skills`; the `install-skills` bin is no longer shipped by the latter.

## 0.2.1

### Changed

- **`SKILL.md` says `installSkills` is required.** The setup step no longer says `install-skills` installs from every declared package
  that exports skills; it names the root `package.json` `installSkills` list, without which nothing is installed and the command fails.

## 0.2.0

### Added

- **`unit-imports` takes `same-minor=<packages>`.** `references/rules.md` documents the parameter (the packages whose
  minor a unit and its receiver should share) and that tools read it and the role in `kit=all-libs-units-no-<role>` from the
  profile of a unit's architecture.

### Changed

- **Breaking:** **The profile loader resolves `@gergelyszerovay/markdown-schema`.** `load-profile.cjs` tries that name,
  then the legacy `markdown-schema`; the former name of the package is no longer tried. A bound package
  that declares the old name as a devDependency declares the new one instead; `SKILL.md` says so.

## 0.1.1

### Changed

- **A profile's version rises with every change to its skill.** "Versioning"
  in `SKILL.md`: not only when a rule changes; the version before it is kept under
  `versions/<version>/` (the loader fails for a bound version without one), and every package of
  the repository that ships the skill binds the latest version, so a raise rebinds them, the
  skeletons and the reference repositories.
- **The row citation is the citations skill's.** `references/rules.md`
  (`tsdocSyntaxPlugin`) and the comments of `eslint-rules.cjs` and `check-tsdoc-tags.mjs` name the
  citations skill (it was the layered-documentation-authoring skill's "Citing a row" and the
  `symbol-citations` skill).

## 0.1.0

### Added

- **Advisory enforcement.**
  - The binding takes an optional `"enforcement"`, `"gate"` (the default) or `"advisory"`.
    `load-profile.cjs` validates it (any other value throws), returns it from `findBoundProfile`
    and `loadBoundProfile`, and documents it in its header; `SKILL.md` documents it next to
    `"coverage"`, and `references/rules.md` says a coverage gap of an advisory package is an `info`.
- **The skill and its scripts.** The profile template, `load-profile.cjs`, `eslint-rules.cjs`, `vendor-roots.cjs`, `check-tsdoc-tags` and `check-block-placement`. Changes before this changelog are recorded in the changelogs of the architectures that needed them.
- **The rule vocabulary has `unit-imports`.** A structural rule (`own=…; other=…; scope=…; form=…; kit=…;
dependencies=…; cycles=…`) for the imports a unit may make of units of other kits; the three-block-architecture profile
  states it and `check-units.mjs` reads the row.
- **The rule vocabulary has `unit-manifest`.**
  - The rule vocabulary has a `unit-manifest` entry (`file=<name>; format=<n>; keys=<keys>`), checked by the
    architecture's `check-units.mjs`.
- **`tsdocSyntaxPlugin(tsdoc)` in `eslint-rules.cjs`.**
  - `references/rules.md` describes it: the rule `architecture-skills/tsdoc-syntax` reports what
    `tsdoc/syntax` reports except the message on a `{@link}` to a repository-root path, the row
    citation of the layered-documentation-authoring skill, which the TSDoc parser rejects for its
    leading `/`.

### Changed

- **The architecture checker is the engine, dependency-cruiser the fallback.**
  - `Enforced by: architecture-check` is the value of every rule over a package's imports that
    the architecture checker judges (its `dependencies` and `facades` rules); the Node, Angular and
    three.js profiles name it. A row names one engine; `dependency-cruiser` stays a valid value for
    profiles written before, and the kept copies of older versions keep it.
  - `references/rules.md`: a new **Engines** paragraph says which engine checks each rule and that
    dependency-cruiser (and ESLint for `max-facades-per-component`) is the fallback for a project
    without the architecture checker; the Implemented by column names the engine and whether a fallback
    exists. The architecture-check table gains `lazy-places` and the
    edges the checker's manifest added (dynamic `import()`, side-effect imports, an
    `export *` of an external module).
  - `scripts/dependency-cruiser-rules.cjs`: `buildForbiddenRules` builds the rows marked
    `architecture-check` or `dependency-cruiser`, and nothing for an `architecture-check` row it has
    no rule for; a `dependency-cruiser` row it has no rule for still throws.
  - `scripts/eslint-rules.cjs`: `buildMaxFacades` builds `max-facades-per-component` when it is
    marked `eslint` or `architecture-check`.
  - `SKILL.md`: the Enforced by rule says the same.
  - `references/rules.md`: the architecture-check table says that a
    test file's imports are judged by `library-roles`, `context-access`, `public-entry-only`,
    `composition-root`, `directory-allow-list` and `acyclic` as dependency-cruiser judged the specs
    (`no-testing-in-prod` exempts them), that an import type (`typeof import('./x')`) is a type-only
    dynamic edge, that a spec's `import()` is no static import for `lazy-places`, and that a library
    `role-source=lib-doc` gives no role is an error of `library-roles`; the vendor-roots row drops
    the gate's parity sentence.

### Removed

- **dependency-cruiser is retired: the architecture checker is the one engine of the import rules.**
  - `scripts/dependency-cruiser-rules.cjs` and its test are gone: no repository runs the fallback.
    `vendorRoots`, which the checkers and a package's ESLint config read, moves to
    `scripts/vendor-roots.cjs`.
  - `references/rules.md`: "Engines" names the architecture checker the one engine of the import rules;
    the Implemented by column loses its fallbacks; `layer-packages` and "Layers" say `*` covers
    external packages only, so a layer imports another workspace package only when its cell lists
    `workspace` or an Approved Packages row names it; a test file whose name ends with a block
    suffix of the profile is judged as that block. A package states no dependency rule of its own.
  - The template's Enforced by keeps `dependency-cruiser` as a valid value for the copies of older
    profiles kept under `versions/`, which the architecture checker reads as `architecture-check`; its
    example row and `examples/valid-small.md` say `architecture-check`.
- **The package-doc parameters of `contract-only` and `lazy-places` are gone.**
  - `references/rules.md`: `contract-only` loses the optional `withheld=package-doc` (a package's
    wiring is a block the row does not list), and `lazy-places`
    takes no parameter: `places=package-doc` and the check of the Lazy Places table both ways are
    gone, the lazy places being read off the `import()` edges. The architecture-check table follows.
  - The profile template's refine test accepts `lazy-places` with `none`.
