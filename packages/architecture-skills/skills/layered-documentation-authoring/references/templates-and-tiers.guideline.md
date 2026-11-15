# Templates and binding

> Why docs bind to templates, how a document finds its template (the catalog and
> proximity binding), and the normative rules for template-bound files.

Companion to `../SKILL.md`. Scope rules for prose are in `scopes.guideline.md`;
citation rules in `cross-references.guideline.md`; validation in
`validation-and-workflow.guideline.md`.

## Why template-bound docs

The layered-docs system turns specifications into a structured, machine-validated
artifact tree. Each doc is either:

1. **Template-bound** — its structure follows a named template (e.g. `feature`,
   `view-component`, `supabase-table`). Validated by `markdown-schema` plus a
   Zod-based `*.refine.ts` rule file.
2. **Prose** — free-form documentation with a Diátaxis scope suffix. Used for
   rationale, how-to, troubleshooting, and material that does not fit a template.

Template binding buys three things that free prose loses: a cap on file size and
mode-mixing, stable cross-references (symbols cited as `<package-name>#<SymbolName>`, checked by
refines), and drift detection (template + refine bind doc structure to
code-derivable facts, and `validate-md` is a CI gate).

## The catalog

Templates live in `markdown-schema-templates/` folders (`layered-doc-templates/`
is still read as a legacy name). Every such folder uses the same name wherever it
sits; there is no tier-specific name to pick. Each folder holds one directory per
template, named after the template: the template source
(`<name>/<name>.template.md`), the refine rules (`<name>/<name>.refine.ts`), and
optionally filled sample docs (`<name>/examples/*.md`). The template-folder
anatomy is owned by the `markdown-schema` skill (`template-structure.guideline.md`).

The **catalog** is every `markdown-schema-templates/<name>/<name>.template.md` in
scope. A folder whose stem does not match its name, or a symbolic link, is not a
template. A skill can ship its templates in its own folder, a group next to its
docs, an app or package in its own tree.

## Binding by name and proximity

Every Markdown file is a document, and binding knows nothing about layered-docs
trees. A file `[<n>.][<artifact>.]<template>.md` binds to the closest template of
that name:

- The **template name** is the last segment of the file name after dropping a
  leading `<n>.` level number: `2.reviewer2.constitution.md` → `constitution`,
  `plan.md` → `plan`, `README.md` → `README`. A specialized index
  `<n>.index.<template>.md` binds to `<template>`; a plain `<n>.index.md` to
  `index`.
- **Proximity:** walk up from the document's directory. At each ancestor, only
  its own templates folder is looked in (not its subtree); the first ancestor
  that has a template of that name decides.
- A canonical and a legacy folder at the same level resolve to the canonical one,
  so a name never clashes.
- Templates themselves (`*.template.md` in a catalog folder) and their
  `examples/` bind to nothing but their own template, and only through
  `validate-md`.

The result per file is `bound` (with the template's path), `unbound` or `template` (a catalog file). `documents bind` reports it.

Consequences:

- **A template must sit in an ancestor's own folder.** A template in a sibling or a
  distant folder never captures a document. To use templates that live elsewhere (in a
  skill, say), put a `markdown-schema-templates/` folder in an ancestor of the docs and
  fill it with relative symlinks, one per template.
- **There is no override.** A nearer ancestor with its own template of the name wins
  over a farther one, and the nearer template is a standalone source that inherits
  nothing.

## When to put a template where

Put a template next to the docs it serves when only they use it, and give it a
name no other template has. Put it in a skill or a shared folder when many
packages fill it. When in doubt, start with the smallest field set; add fields
only if multiple filled docs would otherwise leave a section empty.

## What does NOT belong in a templates folder

- **Filled docs** live only in a `layered-docs/` directory (or, for any other
  Markdown file, where its name binds). They never appear in a templates folder.
- **Refine rule files** stay with their template.

## Discovering the available templates

Do not memorize a fixed list; ask the catalog:

```bash
documents templates --root <repo>       # every template, and name clashes
documents bind <file> --root <repo>     # which template a document binds to
```

## File-name patterns

| Kind                | Pattern                                       | Example                                              |
| ------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Template source     | `<template-name>/<template-name>.template.md` | `feature/feature.template.md`                        |
| Template-bound fill | `<n>.<artifact>.<template-name>.md`           | `4.favorites.feature.md`                             |
| Prose doc           | `<n>.<topic>.<scope>.md`                      | `3.architecture.concept.md`                          |
| Plain index         | `<n>.index.md`                                | `2.index.md` — binds to `index`                      |
| Specialized index   | `<n>.index.<template-name>.md`                | `4.index.mdx-component-registry.md`                  |
| Refine rule file    | `<template-name>/<template-name>.refine.ts`   | `feature/feature.refine.ts` (in the template folder) |

`<n>` is navigation depth from the tree root. Filename segments are kebab-case.
`<template-name>` MUST NOT contain a dot. Template sources and their refines have
no `<n>` prefix — they resolve by name, not tree position.

## Binding rules

1. A file whose last name segment (after dropping `<n>.`) names a template in the
   catalog binds to the closest such template (see above). A file ending
   `<template-name>.md` that names no template in the catalog is unbound; for
   `.spec.md`, `.concept.md`, `.workflow.md`, `.fix.md` and `.tutorial.md` that is
   the normal prose case. `<n>.index.md` binds to the `index` template;
   `<n>.index.<template-name>.md` to the named template.
2. Only the nearest ancestor's own templates folder decides, so a template name
   never clashes.
3. A filled doc MUST conform to the bound template: section order, required
   fields, table headers, row schemas, key uniqueness.
4. `validate-md --template <path> <doc>` validates any doc against an explicit
   template; `documents bind` says which template a doc binds to.

## Index variants

| Filename                       | Binds to          | When to use                                                    |
| ------------------------------ | ----------------- | -------------------------------------------------------------- |
| `<n>.index.md`                 | `index`           | Default — pure navigation.                                     |
| `<n>.index.<template-name>.md` | `<template-name>` | Index also carries structured payload (e.g. a registry table). |

Rules:

1. A directory MUST contain exactly one index file (plain OR specialized).
2. A specialized index template MUST include the same required nav sections as
   the plain `index` template — Title, summary, `## Key Points`, `## Contents`,
   and `## Cross-Domain` (optional). Reader experience MUST stay consistent.
3. A specialized index template MAY add further sections below the nav sections.
4. The specialized template's refine MUST enforce the index-shape rules plus its
   own invariants.
5. Use a specialized index only when the combined file stays ≤300 lines.
   Otherwise split the payload into a sibling spec doc and keep the index plain.

## Template source structure

A template source is a markdown file with `<!-- TEMPLATE-ONLY: ... -->`
directives; the directive grammar is owned by the **`markdown-schema` skill**.
Conventions this system adopts:

1. Whether sections are numbered is the template's choice. A fill's H2 text MUST
   match the template exactly — including numbering when the template numbers its
   sections.
2. Section names MAY be parameterised with `string; required` only when the field
   is intrinsically variable (e.g. "Visual State name").
3. Tables MUST declare row schemas via `row` directives with field types and
   constraints.
4. Cross-section invariants MUST live in the sibling `<template-name>.refine.ts`,
   not in the template comments.
5. Every template MUST include a freetext `## N. Notes` (or equivalent) section
   for irreducible prose — exceptions and rationale.

## Refine contract

For each template `<name>.template.md` there MUST be a `<name>.refine.ts`
exporting:

```ts
export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => { ... };
```

Key cross-cutting rules every refine SHOULD enforce (details in
`validation-and-workflow.guideline.md`):

- All `<package-name>#<SymbolName>` citations resolve.
- All internal doc links resolve.
- Required sections are non-empty.

## Custom template renderers

A template MAY have a custom React renderer that draws its parsed payload
directly instead of the generic markdown fallback (e.g. a diagram for
`overview-diagram`, a token gallery for `design`). Rendering is orthogonal to the
template grammar — a template validates and fills the same way whether or not a
renderer exists.

- The **default** for every template is the markdown fallback. Most templates
  have no renderer.
- The **canonical template-to-renderer mapping** is the renderer-registry spec at
  `/packages/template-views/template-view-contract/layered-docs/2.renderer-registry.spec.md`.
  It is the single source of truth for which template maps to which renderer.
- Adding or removing a renderer is a coordinated change: update the registry spec
  **and** both registration sites it names (the preview app's `VIEWS` map and the
  spec-viz frontend's `registerTemplateView` calls). A renderer wired into one
  site but not the other silently diverges between shells.

Authoring a template or a fill never requires touching a renderer; consult the
registry spec only when you are adding rendering for a new template.

## Size constraint

A filled doc SHOULD stay ≤150 lines and MUST stay ≤300 lines. If a fill exceeds
150 lines, split the underlying artifact (e.g. one feature becomes two) rather
than stretch the template.
