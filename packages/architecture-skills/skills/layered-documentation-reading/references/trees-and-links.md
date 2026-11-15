# Trees, owners and links

Details behind the layered-documentation-reading skill: what each kind of tree covers, the
directory names older commits use, and the link forms you may meet.

## Owners

A `layered-docs` directory's owner is set by where it sits (the table in `SKILL.md`), never
by its name. What each owner's tree holds:

- **Root:** one tree for the whole monorepo: repository-wide rules (`/layered-docs/`,
  architecture and design).
- **Group:** one tree per directory that contains several packages, carrying what those
  packages share without duplicating any one package's own tree. For example,
  `reviewer/layered-docs/` covers every package nested under `reviewer/`, at any depth,
  because `reviewer/` isn't a workspace package. A nested grouping directory scopes its
  docs to its own descendants; siblings outside it don't inherit them. A group may itself
  be a registered workspace package (`products/reviewer2/`, which binds the group to a profile and
  holds whole-product scripts); it is still a group, because its root contains other
  packages.
- **Package:** one tree per workspace package or app: its own filled docs and, where it
  defines its own templates, a `markdown-schema-templates/` directory.
- **Library:** one tree per library root inside a package, when that library has
  documentation of its own.

Each `layered-docs` and `markdown-schema-templates` directory is its own tree for linking.

## Names in older commits

A commit from before the migration may use a tier-prefixed name: `root-layered-docs`,
`package-layered-docs`, `group-layered-docs`, or the older plural `layered-docs-templates`.
Reviewer still reads them when browsing history. Never author a new tree under one of
them. Where a canonical and a
legacy tree sit at one owner, Reviewer reads the canonical one, ignores the legacy one and
reports a collision.

A package or library may itself be named `layered-docs` (this repository has
`libs/layered-docs/`); its tree is then `libs/layered-docs/layered-docs/`, and a
`layered-docs` directory that holds a `package.json` or a tree of its own is never read as
a tree.

## Link forms

- **Between documents,** including across trees, packages and tiers: a relative Markdown
  link from the citing file (`./foo.md`, `../../other-package/layered-docs/2.bar.spec.md`).
  There is no repository-root-absolute form; a relative path resolves the same way however
  many tree boundaries it crosses.
- **In template-bound table cells,** a document path is still a Markdown link,
  `[basename](path)`: the fill-value extractor yields the link's URL, so the path is both
  clickable and validated.
- **Symbol citations** stay in backticks, since they have no URL; the citations
  skill resolves them (**Symbols**), and a row link from the repository root too (**Rows**).
- **Older fills** may carry the deprecated backticked plain path
  (`` `../foo/3.bar.spec.md` ``); treat the bare path as the link.
