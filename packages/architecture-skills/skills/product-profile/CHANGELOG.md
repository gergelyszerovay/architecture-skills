# Changelog: product-profile

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.2.1

### Changed

- **The examples bind the profile only.** The bindings in `references/documents.md`
  and `references/journeys.md` name no `version`.

### Removed

- **The kept copies of earlier profile versions.** `versions/` is gone: a binding
  names no version and every package is checked against the installed profile (the architecture-profile skill,
  "Versioning").

## 0.2.0

### Added

- **A region's screenshot is derived by a fixture: decision D34.**
  The end-to-end package's `annotate` fixture, called where a journey asserts a region's state,
  draws the Structure rows' keys on the running UI and writes a PNG and a JSON per region and
  state under the test results, attached to the report; it asserts nothing, and a plan's
  implementation notes link its files instead of pasting screenshots. A product bound to the profile
  derives its regions' screenshots the same way. `references/journeys.md` gains "Annotating a
  region": the fixture's contract (its arguments and options, the scope by `data-region` and the
  page object's root, the files under `test-results/regions/` and their attachments, the JSON's
  outcomes and row statuses) and the Role grammar it reads.
- **Rules may carry a Topic, and a sketch calls out its S keys.** The
  `region` template's Rules table gains an optional `Topic` column (a short noun a view folds
  the rules by, untopiced rules last), its Layout guide names the placement words a derived
  wireframe reads (`in a row`, `below`, `above`, `fills`, `over the …`, `at the right edge`),
  and its Wireframes guide asks a sketch's elements to carry their S keys in brackets (`[S4]`).
  `references/documents.md` describes the overviews a tool derives from the rows. Existing
  documents stay valid: the column is optional.

### Changed

- **Breaking:** **States rows cite their elements by S key: decision D35.**
  A region document's States row names in its Shows cell, by S key, every element the state
  changes, at least one (the region's root, the Structure row with Parent `—`, for a state of the
  whole region), so the state matrix derived from the rows has a row for each element a state
  changes. The `region` template's States `Shows` column gets the pattern
  `(^|[\s(,])#?S[1-9][0-9]*\b`: it accepts an in-page link (`[S4](#S4)`), a key in parentheses
  or a list (`(S4)`, `(S2, S3)`) and a bare key (`S4`), and refuses a cell with no S key, one whose
  only S key is in a link to another document's row, and a key glued to a word (`NS4`). The
  States guide says a cross-region state cites both rows, that a range names its two ends only and
  that a key in a code span is quoted, not cited; the template's and the `valid-toolshed-tool-list`
  example's States rows cite S1; `references/documents.md` says the matrix's element rows come
  from these keys. A document whose States rows name their elements in words alone
  no longer validates: add each element's key to the row's Shows cell.

  **Migration:** In every region document, add the S key of each element a state changes to that States row's Shows cell; `validate-md` names each row that lacks one.

- **The fixture's own tests are `*.selftest.ts` beside the fixture.** `references/journeys.md`
  ("Annotating a region") says where a fixture's own tests go: `fixtures/<name>.selftest.ts`, not a
  `.spec.ts` (which a manifest reads as the product's journeys and scenarios), with no kind tag,
  no `spec` annotation and no `regions/…` attachment name, run as a Playwright project of their own.
  No rule of the constitution or the architecture profile changes.
- **D18 names what it keeps on failure only.** Traces and failure
  screenshots; a region's annotation (D34) is an attachment of a passing step. Clarified in place.

## 0.1.1

### Changed

- **Profile 0.1.1.** The version rises with the skill's changes (the
  architecture-profile skill, "Versioning"); no row changes. `versions/0.1.0/` keeps profile 0.1.0 for a
  package still bound to it.
- **The citations skill holds the row form.** D32 (clarified in place),
  `references/documents.md` and `references/journeys.md` cite the citations skill (**Rows**, and its
  TSDoc form for `@drives`) instead of the layered-documentation-authoring skill's "Citing a row" and
  the `symbol-citations` skill; the `domain-model` template's guide names it.

## 0.1.0

### Added

- **The skill.** The group-level documentation of a product (brief, domain model, permission matrix, information architecture, use-case registry, package roles, glossary) and its Playwright end-to-end tests (journeys, page objects, seeds): the constitution, the architecture profile 0.1.0, the templates for each document, and the references.
- **Surfaces beyond the UI: decisions D30 to D32 (pending).**
  - D30 (Documents): a product's surfaces are what an actor touches (a region of a UI place, a
    command, a link, an API procedure, a CLI command, an MCP tool, resource or prompt, a database
    table, policy or function). The information architecture is the UI's surface catalogue, an MCP
    tool registry and an API document are the catalogues of theirs, and each surface kind names its
    behaviour document, how its structure is derived and the rule that tells whether it is built.
  - D31 (Journeys): a journey drives the surface its use case touches with the runner that surface
    needs (Playwright through page objects for a UI region, an MCP client for a tool, an HTTP or
    tRPC client for a procedure, a spawned process for a CLI command, a database client for a
    table or policy); the kinds, the literal metadata and the Given, When and Then steps of
    D10 to D12 hold for every runner.
  - D32 (Documents): the information architecture also holds the product's navigation, its modes
    and its commands, each row keyed and cited; a region document holds its limits and its messages
    and cites a row of another document by a link to the row.
  - The three decisions are `pending`: decided, not built yet; the templates that carry them are
    the subject of later releases.
  - `references/documents.md` ("Dynamic docs") says the units a dynamic doc joins are the product's
    surfaces (D30).
- **Navigation, Modes and Commands in the information architecture, Limits and Messages in a region.**
  - The `information-architecture` template gains the keyed sections Navigation (`N`), Modes (`M`)
    and Commands, with a refine rule; the `region` template gains Limits (`L`, the home of a
    constant in code) and Messages (`W`, the exact copy). `references/documents.md` describes them.
- **Region ids are unique per repository: decision D33.** No two product groups of a repository
  document a region with the same `<place>/<region>` id, in a region document's title or in an
  information architecture's Regions table, because `@region` tags, `data-region` attributes,
  `covers` entries and the region view name a region by its id alone. Checked in review for now.

### Changed

- **Enforced by: architecture-check.**
  - Profile: `acyclic`, `block-allow-list` and `layer-packages` name `architecture-check` (were
    `dependency-cruiser`). architecture-check judges a `.spec.ts` as the `spec` block, though the
    manifest classifies it as a test, so the three rows cover the specs as the cruiser did, and
    `e2e`'s `.dependency-cruiser.cjs` and `lint:deps` script go. No rule changed, so the version
    stays 0.1.0.
  - `references/journeys.md`: the checks name the architecture gate.
- **Documents everywhere.**
  - `constitution.md` and `profile.md` are now `product-profile.constitution.md` and
    `product-profile.architecture-profile.md`, so they bind to the `constitution` and
    `architecture-profile` templates by name like any document. The profile's Identity
    section names its constitution by the new file name. No rule changed.
  - The templates folder is `markdown-schema-templates/` (was `layered-doc-templates/`), and
    the `domain-model`, `information-architecture` and `use-case-registry` key columns make rows citable (`#D26`). Documents bind to templates by
    name and proximity; nothing is installed beside them.
  - Tooling (architecture-profile skill): `load-profile.cjs` finds
    `<profile>.architecture-profile.md` (`profile.md` for skills installed from older
    versions) and templates in `markdown-schema-templates/` (falling back to
    `layered-doc-templates/`). It needs `@gergelyszerovay/markdown-schema` 0.4.0 or later,
    which reads the `key` modifier.
- **Progressive disclosure.** No rule changed. `SKILL.md` follows the Node and Angular skills: a "Rules" section that names the constitution's topics (Documents, Journeys, Enforcement) and a task-to-reference table, in place of the numbered procedure; its "one home per fact" step is left to `references/documents.md` and the constitution. The description is shorter and keeps its trigger phrases.
- **Journey conventions after the first real end-to-end package.**
  The conventions in `references/journeys.md` were first used by a real package, and these
  corrections came out of it:
  - **Skeletons:** a skeleton is an ordinary `test` ending with
    `test.fixme(true, "skeleton")`, not `test.fixme` as the outer call, which never runs the
    body and so drops the step titles from the JSON report. The description is always
    `"skeleton"`, and the body requests no fixtures, because it runs. Constitution D12 is
    clarified in place.
  - **Seed state before the system starts:** the `webServer` command that starts the system
    creates the seed state first, instead of relying on the order of `globalSetup` and
    `webServer`.
  - **Seed teardown:** a failed cleanup is logged and followed by a fallback cleanup, never
    swallowed and never failing a passing test.
  - **Pitfalls:** readiness of a server that isn't plain HTTP (`port`, not `url`); native
    `<option>` elements are never "visible" (wait for `attached`); no parameter properties
    under `erasableSyntaxOnly`.
  - **Page-object example:** a field assigned in the constructor, for packages that run
    TypeScript without a build step.
- **Tooling of the architecture-profile skill.**
  - `check-tsdoc-tags.mjs`: a file whose only export is a `const` (such as a seed bound to an
    object literal) now has that `const` as its primary declaration, so its tags are checked.
  - `dependency-cruiser-rules.cjs`: `node:` package patterns are matched against Node's list
    of built-in modules, so `node:*` and `node:fs` also cover submodules such as
    `node:fs/promises`, and never match a package path.
- **D32 is `active`, and cites a row by a root link.** D32's wording: a
  row of another document is cited by a link from the repository root with the key as its text
  (the layered-documentation-authoring skill, "Citing a row"); `references/documents.md`
  ("Cross-region references are links") cites that section.
- **A `covers` entry may interpolate a module-level string constant.**
