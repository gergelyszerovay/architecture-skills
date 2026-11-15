# Changelog: citations

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.2.2

### Changed

- **Examples name the package folder `packages/architecture-skills/`.** The skill's documents named the folder the package had in a different repository; they name the folder of this one.

## 0.2.1

### Changed

- **The resolution reference names `.reviewermanifestignore`.** The manifest policy file was renamed from `.reviewerignore`.

## 0.2.0

### Added

- **Rows: a row of a document is cited by a link from the repository root.**
  - The rule moved here from the layered-documentation-authoring skill's "Citing a row": a link to the
    document's path from the repository root with the key as its text, in Markdown and in TSDoc
    (`[D21](/<path>.md#D21)`, `{@link /<path>.md#D21 | D21}`), never in prose; a row of the same
    document by its fragment; a skill cites a row of its own files relatively.
  - `references/tsdoc-form.md` says how to register the `architecture-skills/tsdoc-syntax` wrapper;
    `references/resolution.md` how a row link resolves, what `reference-resolution`, `row-citations`
    and `private-citation` report, and what each workspace's scope leaves unchecked.

### Changed

- **A `.notes/` folder is historical like `planning/notes/`.**
  `references/resolution.md` says that a source under either is historical for `reference-resolution` and not
  judged by `row-citations`.
- **Breaking:** **The skill is named `citations`; it was `symbol-citations`.**
  It holds both citation forms, a declaration (**Symbols**, as before) and a row of a document
  (**Rows**), and its description triggers on either.

  **Migration:** Rename it wherever you name it: an `AGENTS.md`, a `CLAUDE.md`, a link into the skill's folder
  (`skills/symbol-citations/` is now `skills/citations/`). `install-skills` installs `citations` and
  removes `symbol-citations`; a copy of the old skill you edited fails the run until `--force`.

## 0.1.0

### Added

- **The skill.** Write or resolve a `<package-name>#<SymbolName>` citation to a TypeScript declaration, from a doc or from a TSDoc comment: the grammar, the `{@link}` form, resolution and the private-citation rules. Earlier changes were not recorded; this is the version the skill was at when its changelog was written.
- **"Rows of documents" says a row is cited by a root link, not a symbol citation.**
