# Changelog: layered-documentation-authoring

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.1.2

### Changed

- **Examples name the package folder `packages/architecture-skills/`.** The skill's documents named the folder the package had in a different repository; they name the folder of this one.

## 0.1.1

### Changed

- **Citing a row is the citations skill's rule.**
  - `references/cross-references.guideline.md` keeps its "Citing a row" heading with a pointer to the
    citations skill's **Rows**, which holds the rule unchanged and says what the checks do: a
    `row-citations` warning (a prose or relative row citation) or a `reference-resolution` finding (a
    renamed or removed row) fails the architecture gate in a living file; in a historical source
    each is an `info` prefixed `historical:`.
  - The description, the routing table and the checklists route both citation forms, a declaration
    and a row of a document, to the `citations` skill (it was `symbol-citations`).
- **The tooling-wiring row names `install-skills --link`.** In
  `references/cross-references.guideline.md`, the context where a skill is referenced by path is the
  `.agents/skills` links `install-skills --link` writes, and
  its example path is the skills package's folder.

## 0.1.0

### Added

- **The skill.** Add, edit, split or validate files in a `layered-docs/` tree: the doc kind, the Diátaxis scope, the file name, the template binding, cross-references, and validating a fill with `validate-md`; the `index` template. Earlier changes were not recorded; this is the version the skill was at when its changelog was written.
- **"Citing a row" in `references/cross-references.guideline.md`.**
  - A row of a document is cited by a link to the document's path from the repository root with the
    key as the link text, in Markdown and in TSDoc (`[D21](/<path>.md#D21)`,
    `{@link /<path>.md#D21 | D21}`), never in prose; a row of the same document by its fragment; a
    skill cites a row of its own files relatively. The checklists name the exception to "links are
    relative".
