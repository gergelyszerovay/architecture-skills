# Changelog: node-block-architecture

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.5.3

### Changed

- **The package skeleton's binding names no version.** `new-package node` writes
  `"architecture": { "profile": "node-block-architecture", … }` with no `version`, and so does the reference
  repository's `package.json` and the example in `references/enforcement.md`.

### Removed

- **The kept copies of earlier profile versions.** `versions/` is gone: a binding
  names no version and every package is checked against the installed profile (the architecture-profile skill,
  "Versioning").

## 0.5.2

### Changed

- **`_`-prefixed type aliases are schema checks.** The package skeleton's and the reference repository's
  `eslint.config.js` exempt a `_`-prefixed type alias from `jsdoc/require-jsdoc` and set `no-unused-vars` to
  `varsIgnorePattern: '^_'`, for the type-only schema checks of the source-organization skill; `references/linting.md`
  says so. Copy both lines into a package made from an earlier skeleton.
- **The setup notes name the installer's package.** `references/setup.md` and the package skeleton's READMEs
  say that `install-skills` is the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository beside this skill's package.

### Fixed

- **The package template and the setup notes bind the current profile version.** `new-package node` wrote `architecture.version` 0.4.1, which the gate refuses against the installed 0.5.1; the skeleton's `package.patch.json` and `references/enforcement.md` say 0.5.1.

## 0.5.1

### Changed

- **The setup notes say `installSkills` must list the architecture skills.** `references/setup.md` and the package skeleton's
  README tell the reader that `install-skills` installs nothing without the list in the root `package.json`.

## 0.5.0

### Changed

- **Breaking:** **The package skeleton and `references/enforcement.md` name `@gergelyszerovay/markdown-schema`.** The
  skeleton's `devDependencies` entry had the package's former name, which is renamed; a package made from the
  template before declares the new name instead.

  **Migration:** In a package made from the skeleton before, replace the former-name devDependency with `@gergelyszerovay/markdown-schema` `^0.13.0` and reinstall.

### Fixed

- **The package skeleton pins `@gergelyszerovay/markdown-schema` at `^0.13.0`.** It pinned `^0.11.0`, a version
  the renamed package never had; `^0.13.0` is the first release under the new name. A package made
  from the template before has to raise the range.

## 0.4.1

### Changed

- **A package made from the template skips `.notes/` folders.** The product tier's
  `eslint.config.js` ignores `**/.notes/**` and its new `.prettierignore` holds `.notes/`, so `lint` and `format:check`
  never read a note; the prototype tier's `.oxlintrc.json` ignores `**/.notes/**`.
- **Profile 0.4.1.** The version rises with the skill's changes (the
  architecture-profile skill, "Versioning"); no row changes. `versions/0.4.0/` keeps profile 0.4.0 for a
  package still bound to it; the node package skeleton and the reference repository bind 0.4.1.
- **The `mcp-tool` template's Handler accepts a library citation.**
  `<package>:<lib-id>#<Symbol>` names a handler that the package entry does not export;
  `mcp-tool.refine.ts` compares the part before `:` (else before `#`) with Identity.Server. A new
  example shows the form.
- **The citations skill.** The "What to read" row for docs names the citations
  skill for citing declarations and rows of documents; the `node-lib` and `node-package` templates'
  guides name it at their first symbol citation, and `mcp-tool`'s Handler guide names it (it was
  `symbol-citations`). No profile row changes.
- **The node reference repository declares `@gergelyszerovay/architecture-skills` `^0.2.0`.** It
  was `^0.1.1`, a version that is never published; the `tsdoc-syntax` wrapper it uses ships in 0.2.0.

## 0.4.0

### Added

- **Prototype doc sections in the package template.**
  - `markdown-schema-templates/node-package/node-package.template.md` gains the sections of a prototype doc as
    optional sections: Purpose, Origin, Run, Status and Structure before `1. Boundaries`, and Open
    questions last, so that a prototype doc is a strict subset of it; a doc rebound to this template fails
    only on the sections that are required here.
  - The prototype tier of the app kind splits `dev` into `dev` (`portless`, with a `portless` key naming
    the server script) and `dev:app` (`node --watch` on the entry), and the README says so; `check-package-templates.mjs`
    runs `dev:app`.
  - New example `examples/valid-prototype-sections.md`.
- **Package template and `new-package`.**
  - `assets/node-package-skeleton/` is the starting point of a Node package: tier `prototype`
    (`private`, `"enforcement": "advisory"`, oxlint with the new `assets/oxlint-prototype.json`,
    `check-block-placement`, no docs, no build) or `product` (ESLint with the full rules, Prettier,
    tsdown, publint, package and lib docs), kind `app` or `lib`. One feature library with a model,
    rules, port, use case, gateway, fake and contract and specs of each kind; no runtime dependency;
    binds profile 0.4.0 with `"coverage": "specified"`. `new-package node <dir> --name … --tier …
--kind …` instantiates it; `setup.md` ("Starting a package") and the skill's table say so. The
    template extends only assets of the skills package.

### Changed

- **Workspace packages only where `workspace` is listed.**
  - Profile 0.4.0: `*` in a layer's Allowed packages covers external packages only, never a package
    of the repository's own workspace (architecture-profile skill, `rules.md`, "Layers"); the
    `composition` layer's cell becomes `*, workspace` (D9, D26), and the `layer-packages` row cites
    D9. A layer whose cell is `*` (driving, driven, mapping, testing) imports another workspace
    package only through a row of the package doc's Approved Packages table, so a cross-hexagon
    edge outside the bridges and the composition layer is a finding: D9 is checked by
    `layer-packages`, for every Node package, and no package's own dependency-cruiser rule needs to state it.
  - The meaning of `*` changes for every version, since the engine reads it; a package bound to
    0.3.x whose composition imports a workspace package moves to 0.4.0.
  - Constitution: D9 says which layers import another workspace package, and is checked by
    `tool:layer-packages`.
  - Reference repo: binds 0.4.0 and passes the architecture check (its `.dependency-cruiser.cjs` goes).
    The CLI's subcommands are wired in `compose-fs-tools-cli.composition.ts` (a `.main.ts` may not
    import a `.cli.ts`), the MCP server takes tool registrations from
    `compose-fs-tools-mcp.composition.ts` and the HTTP server the app router from
    `compose-shop-http.composition.ts` (a `.server.ts` may not import a `.use-case.ts`).
    `references/entry-cli.md` and `examples.md` show the new wiring.

  **Migration:** In a package bound to 0.3.x whose composition layer imports a workspace package, bind profile 0.4.0; where a layer whose cell is `*` imports another workspace package, add a row to the package doc's Approved Packages table. The architecture check's `layer-packages` rule shows it is done.

- **Enforced by: architecture-check.**
  - Profile: the rows the architecture checker judges name it: `library-roles`, `context-access`,
    `acyclic`, `public-entry-only`, `composition-root`, `directory-allow-list`, `layer-packages`,
    `block-allow-list` and `no-testing-in-prod` (were `dependency-cruiser`), `private-blocks` (was
    `planned`) and `originating-declaration` (was `planned`; `block-allow-list` judges the declaration
    a barrel re-exports). No rule changed, so the version stays 0.3.2; the kept `versions/0.2.0/`,
    `0.3.0/` and `0.3.1/` copies keep their values, which both engines still read.
  - dependency-cruiser is the fallback for a repository without the architecture checker: the
    architecture-profile skill's `dependency-cruiser-rules.cjs` builds the rows marked
    `architecture-check` that a file-level rule can judge (the same rules as before), and nothing
    for `private-blocks` and `originating-declaration`. The skill's reference repository keeps its
    `.dependency-cruiser.cjs` as that fallback's example.
  - References: `enforcement.md` ("architecture-check, and dependency-cruiser as the fallback") and
    `linting.md` name the engine and the fallback.
- **The product tier of the package template is `private`.** `new-package node … --tier product` writes `"private": true`, so a new product package needs no `CHANGELOG.md` until it is published; remove `private` and add the changelog (the `changelog` skill) then.
- **TSDoc syntax through the `tsdoc-syntax` wrapper.**
  - `references/linting.md`: the rule is `architecture-skills/tsdoc-syntax`, `tsdoc/syntax` through
    `eslint-rules.cjs`' `tsdocSyntaxPlugin`, which accepts a root row link. The package skeleton's
    and the reference repository's `eslint.config.js` use it; the reference repository declares
    `@gergelyszerovay/architecture-skills` `^0.1.1` and has an `.npmrc` for the scope.
  - The references cite the constitution's rows by relative links instead of prose.

## 0.3.2

### Changed

- **An input may name a port type.**
  - Profile 0.3.2: the `.input.ts` row's "May depend on" cell gains `port` (`port, model, input,
util`); nothing else changes. An input may carry a port instance the caller passes per call;
    the import is of the type. Renaming such a port to a `.model.ts`, to satisfy the old cell,
    evades the `port-has-contract` row (the type is still a port in substance: a gateway implements
    it); with the cell, the `.port.ts` stays and its contract is judged. The 0.3.1 profile is kept in
    `versions/0.3.1/`, so the packages bound to 0.3.1 keep judging against it until they move.
    A rule or a model that needs a port's result type gets that type as a `.model.ts`, never the
    port renamed. No constitution row changes.

## 0.3.1

### Added

- **The entry block.**
  - Constitution: new D59 (Contracts): a published entry of a package, built from a library by
    the package's build config, is a `.entry.ts` block at the library's `src/` root beside
    `index.ts`: named re-exports that select the published names, no declaration or logic.
  - Profile 0.3.1: new block `.entry.ts` (layer `composition`, no required tags, no spec kinds,
    may depend on `*`; D26, D59); `block-placement` gains `entry=src/`. Additive: no cell changes
    meaning, so a package bound to 0.3.0 needs no change; its profile stays in `versions/0.3.0/`
    until none binds it. The `suffixes` rule of architecture-check stops reporting the file.
  - Also in 0.3.1 (additive, so the version stays): `block-placement` reads `entry=src/` (a trailing slash matches only the file's parent folder, so an entry sits directly in `src/`), and new structural rule `entry-only | blocks=entry | eslint | D59` (an entry holds only `export … from` declarations; `buildEntryOnly` in `eslint-rules.cjs`). D59 is checked by `tool:block-placement, tool:entry-only`.
  - References: `blocks.md` (the row, a paragraph, the choosing list), `enforcement.md`.

## 0.3.0

### Added

- **Steps, pure bridges, contract blocks and areas.**
  - Constitution: D54 (a `.step.ts` is an internal operation use cases and flows compose: not a
    primary port, never in the library's entry, never called by a driving adapter or a bridge),
    D55 (a bridge imports only workspace packages, library entries and `node:path`; file-system,
    process and network adapters are gateways of the feature whose port they implement), D56 (the
    `.dto.ts` contract between processes, owned by the package both sides depend on), D57 (a
    package of `.dto.ts` libraries only is a contract package), D58 (areas under `core/`, listed
    in the lib doc). D9, D14 and D26 clarified in place (a bridge does no I/O; use cases and flows
    compose steps; `.config.ts` reads the raw sources and calls no feature).
  - Profile 0.3.0: Layers `bridging` (`workspace, node:path`) and `contracts` (`none`); blocks
    `.step.ts` (application; the `.use-case.ts` and `.flow.ts` cells gain `step`) and `.dto.ts`
    (contracts; the `.mapper.ts` and `.format.ts` cells gain `dto`); `.bridge.ts` moves to
    `bridging`; `block-placement` gains `bridging=app; contracts=core`; new
    `private-blocks | blocks=step`, `planned`. Nothing is renamed: a package without I/O in its
    bridges, helper chains or contract files needs only the version bump. The 0.2.0 profile stays
    in `versions/0.2.0/` for the packages that still bind it.
  - Templates: `node-lib` gains an optional **Areas** section (its refine checks that areas are
    unique).
  - References: `blocks.md` (steps, the bridge's layer, contracts between processes, a util with
    listeners is state, when `.events.ts` earns its place), `layout.md` (steps, areas),
    `architecture.md` (a block two packages need becomes a package; contract packages),
    `operations.md` (layered configuration is a feature), `frameworks.md` (one composition per
    context before a container), `entry-cli.md` (the homes of the driving helpers),
    `entry-trpc.md` and `declarations.md` (`trpc.middleware.ts`, `router`/`procedure` as a
    coupled pair), `examples.md`, `documentation-and-testing.md`, `enforcement.md` (0.3.0).
  - Reference repo: bound to 0.3.0; `place-order` composes the new
    `price-order-lines.step.ts`; the lib docs' Owned Records cite their writers in the
    `<package>:<lib>#Symbol` form the template requires.
  - Tooling (architecture-profile skill): the `workspace` token of the Layers vocabulary (read by
    the dependency-cruiser builder from the package's `workspace:` dependencies), the
    `private-blocks` rule type in the vocabulary and the template's refine, and `load-profile.cjs`
    reading `versions/<version>/` when a package binds an older version.
- **`node:test` to Vitest codemod.**
  - Assets: `assets/codemods/node-test-to-vitest.mjs`, with its `node --test` tests beside it,
    rewrites a `node:test` spec file to the Vitest form: the imports, `test` to `it`,
    `before`/`after` to `beforeAll`/`afterAll`, and a `TODO`-tagged `meta` with a slug on each
    spec, for the hand pass to complete. `t.mock`, `t.plan`, subtests and options are reported,
    not converted. A dry run prints the converted, marked and unconvertible counts; `--write`
    rewrites the files.
  - References: `testing.md` gains "Converting `node:test` suites"; `setup.md` gains "Moving a
    package from `node:test` to Vitest".

## 0.2.0

### Changed

- **Features grouped by bounded context.**
  - Constitution: D52 (features grouped by bounded context in `libs/<context>/<feature>`, with
    `libs/shared/` for what two contexts use and a context's own `shared` or `shared-<name>`
    libraries; the package doc's Contexts table is the context map; a flat `libs/` is one
    implicit context), D53 (a bridge in `app/` connects two contexts' features only where the
    Contexts table allows; checked in review).
  - Profile 0.2.0: `library-roles` takes `role-source=context-path; shared-dir=shared;
default-role=feature; shared-role=shared` (the role still follows from the path, D7); new
    `context-access | contexts=package-doc; shared-dir=shared`. For a flat package the generated
    rules are the old ones plus `context-access:shared` where `libs/shared/` exists. Packages
    bound to 0.1.0 update their binding (the reference repo's too).
  - Templates: `node-package` gains an optional **Contexts** section (its refine checks that
    contexts are unique); `node-lib`'s title accepts `<context>/<feature>`.
  - References: `architecture.md` gains "Contexts" and cites the architecture-profile skill's
    `references/grouping.md`; `layout.md` gains "Contexts"; `enforcement.md`'s binding example is 0.2.0.

## 0.1.0

### Added

- **`.util.ts` helper block and the shared naming rule.** New block `.util.ts` (layer `utility`, spec kind
  `invariant`): a product-independent pure helper that every other block may depend on; unsuffixed helper
  files are no longer allowed, so `block-allow-list` covers every implementation file. `references/declarations.md`
  adopts the architecture-source-organization naming rule (file stem derived 1:1 from the primary declaration)
  and documents `make` as the one factory prefix the file names omit.
- **MCP tool templates.** New templates `mcp-tool` and `mcp-tool-registry` in `markdown-schema-templates/`: the
  registry's `tool` column is a `key` (rows citable as `#<tool>`), and `mcp-tool` gains an `Access` field
  (`read-only` by default). `references/entry-mcp.md` points at them.
- **Time sources, touched blocks, messaging, batches and CLI cancellation.** D4: no code inside the hexagon
  reads the clock, randomness or identity sources directly; D49: a change brings the blocks it creates or
  changes up to the rules and reports gaps in other blocks rather than fixing them. New guidance in
  `entry-messaging.md` (a consumer example, job policies named with D21's `@concurrency` values), `blocks.md`
  (inbound consumer messages are `.schema.ts`), `operations.md` (batch use cases) and `entry-cli.md`
  (cancellation through one `AbortController` aborted on SIGINT). `no-unused-labels` is off for `*.contract.ts`.
- **Contract slugs, first-wins concurrency, the coverage binding.** D42 and D46: a contract suite declares each
  spec once, with the port's spec kinds and a slug, shared by its runs against the fake and each adapter. D21: a
  new policy, `first-wins`, for triggers racing to the same end state. D51: `"coverage": "specified"` goes in the
  `architecture` binding of the package's `package.json`.
- **Phase metadata, skeletons and fast-forward coverage.** Specs carry their arrange, act and assert
  descriptions as literal `meta` strings, which reach Vitest's JSON report. A skeleton is
  `it.todo(title, { tags, meta })` with full metadata; a package with `"coverage": "specified"` lets skeletons
  satisfy coverage rules, and coverage reports list them as debt. The Decisions table has a `Status` column
  (`active` or `pending`).
- **Constitution, profile, documentation and testing.** `constitution.md` (requirements R1–R13, non-goals
  N1–N6, decisions D1–D50) and `profile.md` (version 0.1.0), the machine-readable copy of the checkable
  rules; the `node-lib` and `node-package` templates with refine rules and examples;
  `references/documentation-and-testing.md`; `enforcement.md` builds the dependency-cruiser config from the
  profile. Decisions that change guidance: a `.bridge.ts` may also wrap another package's application (D9);
  `.mapper.ts` is used on both sides of the hexagon (D16); a `.state.ts` block may read from a port that
  feeds it (D15); a library's role (feature or shared) follows from its path (D7); specs run on Vitest with the
  spec kinds as tags, and `node:test` suites don't count for coverage (D48).
- **Logging.** The logging rules in `operations.md` are rewritten: the composition root creates one pino
  logger; driving adapters log each call once with its call ID and driven adapters log infrastructure
  failures; use cases never get a logger and record business facts through a narrow port named after the fact.
  They also cover redaction, stderr or stdout, CLI output versus logging, and testing log output. Notes in
  `entry-trpc.md`, `entry-mcp.md`, `entry-cli.md` and `testing.md`. The reference repository gains pino, a
  tRPC logging middleware, `withToolLogging` for MCP tools and an audit port for `delete-files`.
- **Build and package checks.** `setup.md` says when to build: private apps run from source, published binaries
  are built with tsdown without type files, published libraries with type files, and published packages are
  checked with `publint --strict`; it also covers `isolatedDeclarations`. tsdown and publint join the default
  stack for published packages.
- **Explicit types.** `explicit-function-return-type` and `explicit-module-boundary-types` at `error`, with
  `allowHigherOrderFunctions: false`; tRPC procedures and routers are exempt. `declarations.md` replaces the
  `ReturnType<typeof makeX>` convention: each use case's contract is written as its own function type.

### Changed

- **One Prettier config per repository.** `references/linting.md` says a monorepo keeps the settings in one root `.prettierrc` (nested configs replace the root, they don't extend it) and only a copied-out package carries its own copy.
- **The reference repository follows the declaration and naming rules.** Multi-declaration files are split
  into one file per primary declaration and every file is named after its primary declaration (`make` stripped).
- **Documents everywhere.** `constitution.md` and `profile.md` are now `node-block-architecture.constitution.md`
  and `node-block-architecture.architecture-profile.md`, so they bind to the `constitution` and
  `architecture-profile` templates by name. The templates folder is `markdown-schema-templates/` (was
  `layered-doc-templates/`), and the `node-lib` and `node-package` key columns make rows citable (`#D26`).
  No rule changed.
- **Shared docs and specs conventions.** `references/documentation-and-testing.md` keeps only what is specific
  to Node; the shared conventions moved to the new architecture-docs-and-specs skill.
- **markdown-schema is a published package.** The profile loader resolves
  the markdown-schema package from the bound package (the legacy `markdown-schema` still
  works as a fallback), so a package adds it as a devDependency.
- **Contract suites reach every adapter; D26 is checked.** D46: a library exposes its fakes, fixtures and
  contract suites to other libraries' and `app/` tests through a test-only entry, `src/testing.ts` (alias
  `#libs/<lib>/testing`); the profile's `public-entry-only` and `no-testing-in-prod` rules take
  `test-entry=src/testing.ts`. D26 is checked by ESLint's `n/no-process-env`, off only for `*.config.ts` and
  tests. `blocks.md` says which imports the profile forbids for `.main.ts`, `.server.ts` and `.router.ts`.
- **Progressive disclosure: one home per rule.** No rule changed. `SKILL.md` is a router (1,455 → 499 words)
  with the constitution as the only statement of the rules and a table from task to references and decision
  topics; the hexagon explanation moved to `references/architecture.md`, the default stack to
  `references/setup.md`; which test each block gets is one table in `references/testing.md`.
- **Formatting and TSDoc returns.** Prettier: `printWidth` 100, `tabWidth` 2, `useTabs` false, `singleQuote`
  true, shared with the Angular architecture. TSDoc: `@returns` describes a returned value, so a function that
  returns nothing has none (`jsdoc/require-returns-check` stays on); `async` functions always have one.
  `references/linting.md` points at the reference repository's config files and explains only where the setup
  departs from the standard presets.
