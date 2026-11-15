# Changelog: architecture-docs-and-specs

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.1.1

### Changed

- **Citations point to the citations skill.** "Levels" cites declarations and
  rows of documents as the citations skill's **Symbols** and **Rows** say (it was the
  `symbol-citations` skill and the layered-documentation-authoring skill's "Citing a row").

## 0.1.0

### Added

- **The skill.** The documentation and spec conventions shared by node-block-architecture and angular-block-architecture, in one home: where each fact lives, levels, behaviour tags, spec kinds, slugs, phase metadata, skeletons and fast-forward coverage. The rules stay decisions in each architecture's constitution; a change to one is made in both constitutions and in this skill.

### Changed

- **The prototype doc.** The Levels table names the prototype doc: one `layered-docs/1.<name>.prototype.md` per prototype, whose sections the package templates carry as optional sections.
- **three.js block architecture.** Names three-block-architecture's decision range (D46–D56) and its documentation reference beside Node's and Angular's.
- **TSDoc cites a row by a root link.** `SKILL.md`, "Levels": `{@link /<path>.md#<Key> | <Key>}`, never prose such as `constitution D21`
  or `(I14, L1)`; `@region` stays bare.
- **The fact-home table names the new sections of the region and IA documents.** A region document's Limits and Messages, and the information architecture's Navigation, Modes and Commands.
- **Spec metadata may interpolate a module-level string constant.** `${REGION}#R2` over `const REGION = '…'` is read as part of the literal; any other
  expression is not, and the manifest reports the field as unreadable.
