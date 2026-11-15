# Changelog: angular-block-architecture

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.8.6

### Removed

- **The kept copies of earlier profile versions.** `versions/` is gone: a binding
  names no version and every package is checked against the installed profile (the architecture-profile skill,
  "Versioning").

## 0.8.5

### Changed

- **`_`-prefixed type aliases are schema checks.** The spartan-ui boilerplate's `eslint.config.mjs` exempts a
  `_`-prefixed type alias from `jsdoc/require-jsdoc` and sets `no-unused-vars` to `varsIgnorePattern: '^_'`, for the
  type-only schema checks of the source-organization skill.

## 0.8.4

### Changed

- **The spartan-ui boilerplate skips `.notes/` folders.** Its `eslint.config.mjs` ignores
  `**/.notes/**` and its `.prettierignore` holds `.notes/`.
- **Prettier in a monorepo.** `references/linting.md`: where a root `.prettierrc.json` exists,
  each Angular package carries its own copy with the `*.html` override.
- **The spartan boilerplate's README names no port.** It said to open
  the dev server by its port; it now says to open the address `ng serve` prints.
- **Profile 0.8.4.** The version rises with the skill's changes (the
  architecture-profile skill, "Versioning"); no row changes. `versions/0.8.3/` keeps profile 0.8.3 for a
  package still bound to it; no skeleton binds it.
- **The citations skill.** The "What to read" row for docs names the citations
  skill for citing declarations and rows of documents, and the templates' guides name it at their
  first symbol citation (it was unnamed). No profile row changes.
- **The spartan boilerplate declares `@gergelyszerovay/architecture-skills` `^0.2.0`.** It
  was `^0.1.1`, a version that is never published; the `tsdoc-syntax` wrapper it uses ships in 0.2.0.

## 0.8.3

### Added

- **Prototype doc sections in the package template.**
  - `markdown-schema-templates/angular-app/angular-app.template.md` gains the sections of a prototype doc as
    optional sections: Purpose, Origin, Run, Status and Structure before `1. Boundaries`, and Open
    questions last, so that a prototype doc is a strict subset of it; a doc rebound to this template fails
    only on the sections that are required here.
  - New example `examples/valid-prototype-sections.md`.

### Changed

- **No fallback engine.**
  - References: `enforcement.md`, `linting.md`, `vendors.md` and `documentation-and-testing.md` name
    the architecture checker the one engine of the import rules; `layer-packages` reads `*` as external
    packages only, so an application's import of another workspace package needs an Approved
    Packages row. The `angular-app` template's Vendor Roots guide says the checkers and ESLint skip the root.
  - The meaning of `*` in the Layers table changes with the engine (presentation, state,
    data-access, routing and testing are `*`): it no longer covers a workspace package. No row's
    text changes, so the version stays 0.8.3; a package that imports a workspace package from one of those layers adds
    an Approved Packages row.
- **Wiring blocks replace the Withheld Declarations and Lazy Places tables.**
  - Profile 0.8.3: the `contract-only` row drops `withheld=package-doc`, the `lazy-places` row
    drops `places=package-doc` (its parameters are `none`), and the `.providers.ts` row of the
    Blocks table gains `providers` in May depend on, so a place's providers block includes a
    capability's. A package bound to 0.8.2 moves its withheld names into a `.providers.ts` block
    of their library, drops both tables from its package doc and updates its binding. No
    `versions/0.8.2/` copy is kept.
  - Constitution: D51 widened in place: a `.providers.ts` block is a library's wiring surface, a
    place's route providers or a capability's provider consts that the composition root and the
    places' providers blocks include; what it wires leaves the index when only the wiring uses it.
    D45 and D53 lose their last sentences (the two tables): the rules stay, read off the blocks and
    the `import()` edges.
  - Template: `angular-app` loses its sections 8 (Lazy Places) and 9 (Withheld Declarations), the
    two uniqueness checks of its refine and their rows in the example.
  - References: `blocks.md` (a capability's providers block, with the example of a place including
    one), `architecture.md`, `enforcement.md` and `linting.md` say where the two facts live now.

  **Migration:** In a package bound to profile 0.8.2, move the names of the package doc's Withheld Declarations table into a `.providers.ts` block of their library, delete the Lazy Places and Withheld Declarations sections from the package doc, and update the binding; the architecture check shows it is done.

- **TSDoc syntax through the `tsdoc-syntax` wrapper.**
  - `references/linting.md` and the spartan boilerplate's `eslint.config.mjs`: `tsdoc/syntax` runs
    through `eslint-rules.cjs`' `tsdocSyntaxPlugin`, which accepts a root row link; the boilerplate
    declares `@gergelyszerovay/architecture-skills` `^0.1.1` and has an `.npmrc` for the scope.
  - The references cite the constitution's rows by relative links instead of prose.

## 0.8.2

### Added

- **Withheld declarations, and lazy places checked by the architecture checker.**
  - Profile: every row the manifest engine judges names `architecture-check`: `library-roles`,
    `acyclic`, `public-entry-only`, `block-allow-list`, `layer-packages`, `context-access` and
    `no-testing-in-prod` (were `dependency-cruiser`), `max-facades-per-component` (was `eslint`)
    and `originating-declaration` (was `planned`). dependency-cruiser and ESLint are the
    fallback for a repository without the architecture checker.
  - Profile 0.8.2: the `contract-only` row gains the optional parameter `withheld=package-doc`,
    and the `lazy-places` row leaves `planned` for `architecture-check`, whose `dependencies` rule
    now sees the dynamic `import()` edges: it reports a static import of a lazy place from another
    library (an `import type` and a spec included) and checks the Lazy Places table both ways.
    Additive: a package bound to 0.8.1 updates its binding.
  - Constitution: D45 clarified in place: an index export the package doc's Withheld Declarations
    table lists is for the package's wiring alone, whatever its block.
  - Template: `angular-app` gains an optional **Withheld Declarations** section (Library,
    Declarations, Why; libraries unique), beside Lazy Places.
  - Tooling (architecture-profile skill): `rules.md` documents `withheld=package-doc` and marks
    `lazy-places` as implemented by architecture-check.
  - References: `enforcement.md` names architecture-check for the import rules, barrels, facades
    per component, contract surfaces and lazy places; `linting.md` says which rules ESLint still checks.

## 0.8.1

### Added

- **A lazy place is imported statically by no library.**
  - Constitution: new D53 (Libraries): a library a `.routes.ts` loads through `import()` (a lazy
    place) is imported statically by no other library (every `import` and `export … from`
    counts, `import type` and specs included; only `import()` does not); what the shell or
    another place needs of it lives in a composition library under `libs/places/` that both
    import, with no route, page or facade, which is not a place. D47 clarified in place: a
    place's facade also reads the stores of that shared composition library.
  - Profile 0.8.1: new structural rule `lazy-places` (`places=package-doc`, Enforced by
    `planned`, D53). Additive: a package bound to 0.8.0 lists its lazy places and updates its binding.
  - Template: `angular-app` gains an optional **Lazy Places** section (Library, Loaded by as a
    path from the package root, Why; libraries unique), with a row in the example.
  - Tooling (architecture-profile skill): the profile template's vocabulary and refine know
    `lazy-places`; `rules.md` documents it and `grouping.md`'s places paragraph names the shared composition library.
  - References: `architecture.md` ("Contexts, contracts and places"), `enforcement.md`.

## 0.8.0

### Changed

- **One barrel per library: the contract entry goes.**
  - Constitution: D45 reworded in place, same meaning: a capability has one public surface, its
    `src/index.ts`, and another capability imports from it only stores, flows, commands, models,
    rules, formats, tokens, events and utils, judged by the declaration it imports; its
    components, facades and routes are for composition and shell libraries. D47 says "what they
    offer their peers" for "their contracts".
  - Profile 0.8.0: `contract-only` drops `contract=src/contract.ts` and keeps `blocks`,
    `contract-roles` and `index-roles`; `public-entry-only` drops `contract-entry=src/contract.ts`,
    so `src/contract.ts` is no entry any more. A package bound to 0.7.1 deletes its contract
    entries, imports their libraries through `#libs/<context>/<lib>`, drops the
    `#libs/*/contract` imports pattern and updates its binding, after checking that no eager
    importer of a library also lazy-loads its index (one barrel serves both, so the lazy chunk
    folds into the initial bundle). It also marks the package's modules side-effect free, with a
    `sideEffects` list naming the entry and the stylesheets, refuses imports with no bindings in
    ESLint (`no-restricted-syntax`), and compares the production build before and after.
  - Tooling (architecture-profile skill): `dependency-cruiser-rules.cjs` builds no rule for a
    `contract-only` row without `contract=`, and still validates the row; the architecture checker judges it.
  - Profile 0.8.0, the `contract-only` row: Enforced by is now `architecture-check`. The architecture-profile
    template's two Enforced by enums accept `architecture-check`; `rules.md` and `SKILL.md` say so. No rule
    changes, so the profile keeps its version.
  - References: `architecture.md`, `enforcement.md`, `linting.md`, `blocks.md`, `SKILL.md`,
    `README.angular-block-architecture.md`, and the `angular-app` template with its example; the
    architecture-profile skill's `rules.md` and `grouping.md`.

## 0.7.1

### Added

- **The loader block.**
  - Constitution: new D52 (Blocks): a lazy import of a heavy module, a vendor or a component is
    a `.loader.ts` block: an async function that `import()`s it and returns it, holding no state
    and deciding nothing; a `.token.ts` factory is its one consumer.
  - Profile 0.7.1: new block `.loader.ts` (layer `presentation`, no required tags, spec kind
    `scenario`, may depend on `container`, `ui`, `format`, `model` and `util`); the
    `.token.ts` cell gains `loader`. Additive: a package bound to 0.7.0 only updates its binding.
  - `block-allow-list` cites D52.
  - References: `blocks.md` (the row and a paragraph; a layout over a vendor is a `.format.ts`).

## 0.7.0

### Changed

- **Components may use rules and events; route providers are a block.**
  - Constitution: D11 clarified in place: a rule (`.rules.ts`) and an event's payload contract
    (`.events.ts`) are not state, so a page, container or UI block may evaluate the one and name
    the other. New D51 (Blocks): a place's route-level providers are a `.providers.ts` block
    beside its `.routes.ts`, which imports it and never what it provides; the block calls nothing
    but `makeEnvironmentProviders`, `provideEnvironmentInitializer` and `inject` (in a
    factory), holds no function body and writes nothing.
  - Profile 0.7.0: `.page.ts`, `.container.ts` and `.ui.ts` may depend on `rules` and `events`;
    new block `.providers.ts` (layer `routing`); `.routes.ts` may depend on `providers` and no
    longer on `realtime` or `connector` (a route provides them through its providers block);
    new structural rule `providers-only` (`blocks=providers`, enforced by ESLint). Packages bound to 0.6.0 update their binding.
  - Tooling (architecture-profile skill): `eslint-rules.cjs` gains `buildProvidersOnly`; the profile
    template's refine knows `providers-only`; `rules.md` documents it.
  - References: `blocks.md`, `state-and-operations.md`, `linting.md`, `enforcement.md`.

## 0.6.0

### Added

- **Vendor roots.**
  - Constitution: D50, beside D22: a kit vendored in its upstream layout (spartan-ng's helm
    `libs/ui`) is a vendor root, named once in the package doc's Vendor Roots table; every tool
    treats it as the package its imports name, an import into it is judged by `layer-packages`
    only, the edges inside it are not judged, and it never imports a library of its package.
  - Profile 0.6.0: `library-roles` gains `vendor-roots=package-doc` and cites D50, as does
    `layer-packages`. Packages bound to 0.5.0 update their binding.
  - Template: `angular-app` gains an optional **Vendor Roots** section (Directory, Package,
    Owner, Why); the example gains the table and an Approved Packages row for `@spartan-ng/helm`.
  - Tooling (architecture-profile skill): `dependency-cruiser-rules.cjs` reads the vendor
    roots from the table instead of the removed `vendorRoots` option, and exports
    `vendorRootExclude`; `check-tsdoc-tags.mjs` and `check-block-placement.mjs` skip the files under a vendor root.
  - References: `vendors.md` ("Vendor roots"), `linting.md`.

### Changed

- **Role names are profile parameters; the grouping is written once.**
  - Profile rows (version unchanged, 0.5.0: the rules are the same): `library-roles` names
    `default-role=capability; places-role=composition`, and `contract-only` names
    `contract-roles=capability; index-roles=composition, shell`, the roles the
    dependency-cruiser builder used to hard-code.
  - `references/architecture.md` ("Contexts, contracts and places") cites the
    architecture-profile skill's new `references/grouping.md` for the general grouping and keeps
    the Angular specifics; D44's Why cites it too.
  - Tooling (architecture-profile skill): the builder takes every role from the profile row;
    without `places-dir` a package has no places; `role-source=path` is removed; the profile
    template's refine checks that a role parameter names a row of Library roles.

## 0.5.0

### Added

- **Contexts, contracts and places.**
  - Constitution: D44 (libraries grouped by bounded context, `libs/<context>/<lib>`, with
    `shared/` and `places/`), D45 (a capability's two surfaces: `src/contract.ts` for other
    capabilities, `src/index.ts` for composition and shell), D46 (the `infrastructure` role), D47
    (the composition facade of a place), D48 (one facade per instance of an interaction area,
    container-provided), D49 (a facade owns presentation state only and starts no read). D2 and D10
    clarified in place.
  - Profile 0.5.0: the `infrastructure` role; `.container.ts` may depend on `token`;
    `library-roles` with `role-source=context-path`; `public-entry-only` with
    `contract-entry=src/contract.ts`; `layer-packages` with `approved=package-doc`; new rules
    `context-access` and `contract-only`; `max-facades-per-component` enforced by ESLint.
    Packages bound to 0.4.0 update their binding.
  - Tooling (architecture-profile skill): `dependency-cruiser-rules.cjs` builds the two new
    rules and the context-path role source, accepts a `severities` override for gradual
    adoption, and exports `discoverLibraries` and `libraryRoles`; `eslint-rules.cjs` gains
    `buildMaxFacades`; `rules.md` documents them and the `preserveSymlinks` setting workspace
    packages need for `layer-packages`.
  - Templates: `angular-app` gains optional **Approved Packages** and **Contexts** sections;
    `angular-lib`'s Role enum gains `infrastructure`.
  - References: `architecture.md`, `blocks.md` (blocks named by substance: adapter, dialog, paths,
    token; `.format.ts` vs `.rules.ts`; what `.resource.ts` maps to), `state-and-operations.md`,
    `enforcement.md` and `linting.md`.
- **`.util.ts` helper block.**
  - New block `.util.ts` (layer `utility`, approved pure packages only, spec kind `invariant`):
    a product-independent pure helper, local to its only consumer until a second unrelated
    consumer promotes it to a utility library (D6). Every other block may depend on `util`.
    `references/blocks.md` no longer exempts helpers from the suffix: every implementation file
    carries one, which the architecture-source-organization naming rule relies on.

### Changed

- **One Prettier config per repository.** `references/linting.md` says a monorepo keeps the
  settings in one root `.prettierrc`, with the `*.html` Angular-parser override scoped to the
  Angular packages' paths, and only a copied-out package (the boilerplate) carries its own copy.
- **Browser specs in the boilerplate.** The spartan-ui boilerplate's specs run in Vitest's
  browser mode, in headless Chromium through Playwright, instead of jsdom: its `angular.json` test
  target sets `browsers` and `browserViewport`, its `package.json` drops `jsdom` and adds
  `@vitest/browser-playwright` and `playwright`, and its README says how to install Chromium or
  point `CHROME_BIN` at one already installed. `references/testing-setup.md` shows the two options
  and says why: layout, focus, scrolling and measuring are real in a browser and faked in jsdom.
- **Documents everywhere.**
  - `constitution.md` and `profile.md` are now `angular-block-architecture.constitution.md` and
    `angular-block-architecture.architecture-profile.md`, so they bind to the `constitution` and
    `architecture-profile` templates by name like any document. No rule changed.
  - The templates folder is `markdown-schema-templates/` (was `layered-doc-templates/`), and
    the `angular-lib` and `angular-app` key columns make rows citable (`#D26`).
  - Tooling (architecture-profile skill): `load-profile.cjs` finds
    `<profile>.architecture-profile.md` (`profile.md` for skills installed from older
    versions) and templates in `markdown-schema-templates/`. It needs `@gergelyszerovay/markdown-schema`
    0.4.0 or later, which reads the `key` modifier.
- **Shared docs and specs conventions.** `references/documentation-and-testing.md` keeps only what is specific to Angular, and `testing-setup.md` only the Angular CLI setup; the shared conventions moved to the new architecture-docs-and-specs skill. A change to a documentation or testing decision (D26–D41) is made in the Node constitution and that skill too.
- **Progressive disclosure: one home per rule.** No rule changed.
  - `SKILL.md` is a router (686 → 432 words): a one-paragraph overview, the constitution as
    the only statement of the rules, and a table from task to references and decision
    topics.
  - The two seams moved to `references/architecture.md` ("The two seams"); the component
    conventions to `references/blocks.md`.
  - References cite decisions instead of restating them.
  - **D41:** `"coverage": "specified"` goes in the `architecture` binding of the package's
    `package.json`.

## 0.4.0

### Added

- **Linting.**
  - Skill: added `references/linting.md`: ESLint with typescript-eslint's type-checked
    presets and angular-eslint's TypeScript, template and accessibility presets (inline
    templates included), the same TSDoc, explicit-type and export rules as the Node
    architecture, and standalone Prettier. `lint.md` is renamed `enforcement.md`, as in the
    Node skill.
  - TSDoc: `@returns` describes a returned value, so a function or method that returns
    nothing has none (`jsdoc/require-returns-check`); `async` functions always have one.
    The Node architecture and the shared declaration policy changed the same way.
  - Prettier: `printWidth` 100, `tabWidth` 2, `useTabs` false, `singleQuote` true, and the
    Angular parser for templates, shared with the Node architecture.
  - Demo (`assets/spartan-ui-boilerplate`): `eslint.config.mjs`, `.prettierrc.json`
    (replacing `.prettierrc`), `.prettierignore` for the vendor root, `tsdoc.json`, and the
    `lint` and format scripts with their dev dependencies (declared, not installed).
  - Decisions: D42 (the lint stack) and D43 (TSDoc on every top-level declaration, explicit
    return types, named exports, classes named after their block).
  - Profile 0.4.0: `no-symbol` (components and facades don't subscribe, D12) is enforced by
    ESLint, through the architecture-profile skill's new `eslint-rules.cjs`, which builds
    the entries from the profile. Packages bound to 0.3.0 update their binding.

## 0.3.0

### Added

- **Phase metadata, skeletons and fast-forward coverage.**
  - Specs carry their arrange, act and assert descriptions as literal `meta` strings; an
    implemented body keeps bare phase labels. The descriptions now reach Vitest's JSON report
    for implemented, skipped and todo specs alike.
  - A skeleton is `it.todo(title, { tags, meta })` with full metadata. A package that
    declares `"coverage": "specified"` in its profile binding (fast-forward) lets skeletons
    satisfy coverage rules; coverage reports list them as debt.
  - Constitution: the Decisions table has a `Status` column (`active` by default, or
    `pending`).
  - Decisions: D33, D34 and D36 clarified in place; D41 added (fast-forward coverage).
- **Constitution and profile.**
  - Skill: added `constitution.md`, the architecture's numbered requirements, non-goals and
    decisions, and made it the first thing `SKILL.md` points to.
  - Skill: added `profile.md` (0.3.0), the only machine-readable copy of the checkable
    rules: layers, library roles, block allow-lists, required TSDoc tags, spec kinds,
    coverage rules, and the doc template per level. `blocks.md` no longer lists permitted
    collaborators; it links to the profile.
  - Skill: `lint.md` gained evidence rows for the profile-driven checks.
- **Documentation and testing.**
  - Skill: added `references/documentation-and-testing.md`: where each fact lives, the
    documentation levels, TSDoc tags, spec kinds (`scenario`, `edge-case`, `invariant`), and
    where each kind belongs.
  - Skill: added `references/testing-setup.md`: the Angular CLI and Vitest setup for spec
    tags and metadata, including the builder's source-root test discovery and the tsconfig
    changes it needs.
  - Skill: added the `angular-lib` and `angular-app` templates in `layered-doc-templates/`,
    with refine rules and examples.
- **Subscriptions.**
  - Skill: a long-lived subscription derives its identity from owned state and its lifetime
    from its provider scope; commands never subscribe or unsubscribe (constitution D40,
    `state-and-operations.md`). `.routes.ts` may depend on realtime and connector blocks to
    wire their providers.

### Changed

- **Shared profile tooling.**
  - Tooling: `public-entry-only` also checks importers outside the libraries (such as
    `src/app`), and treats a directory under the libs root without `src/` as a grouping
    directory.
  - Tooling: `check-tsdoc-tags.mjs` accepts an exported type as the primary declaration of a
    type-only file, and skips `.test.ts` files.
