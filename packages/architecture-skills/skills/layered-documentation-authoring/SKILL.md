---
name: layered-documentation-authoring
description: Add, edit, split, or validate files in any `layered-docs/` tree (repository root, package, library, or group). Use when creating or changing a layered-docs doc — picking the doc kind (template-bound fill vs prose vs index), choosing a Diátaxis scope, naming the file, binding a template, writing cross-references, and validating a fill against its template with `validate-md`. Routes template-grammar mechanics to the `markdown-schema` skill and citation rules (symbols and rows of documents) to the `citations` skill.
metadata:
  version: '0.1.2'
---

# Skill: layered-documentation-authoring

Canonical procedure for **authoring** the repo's layered documentation. It is the
single source of truth for the generic structure, scope, template, cross-reference,
and validation rules that apply to every `layered-docs` tree.

Read the reference files in `references/` for the full normative detail:

| Topic                                                    | File                                              |
| -------------------------------------------------------- | ------------------------------------------------- |
| Directory/file naming, levels, index template, splitting | `references/structure-rules.guideline.md`         |
| Diátaxis scopes: pick `.concept`/`.spec`/`.workflow`/…   | `references/scopes.guideline.md`                  |
| Template catalog, binding by proximity, refine contract  | `references/templates-and-tiers.guideline.md`     |
| Cross-references (delegates citations by skill name)     | `references/cross-references.guideline.md`        |
| `validate-md` contract + authoring steps                 | `references/validation-and-workflow.guideline.md` |

To **read/navigate** docs, use the `layered-documentation-reading` skill. For the
`*.template.md` directive grammar and how to _fill_ a template, use the
`markdown-schema` skill — this skill does not duplicate that mechanics. For
`<package-name>#<SymbolName>` symbol citations and row citations, use the `citations` skill.

## Only one authored name

Every documentation tree uses `layered-docs/` for docs, and templates live in
`markdown-schema-templates/` folders, regardless of whether they sit with the
repository root, a package, a library, or a group. There is no
tier-specific name to pick — see `references/structure-rules.guideline.md` for where a
new tree's owner comes from (its position, never its name).

## Decide the doc kind

Ask in order:

1. Is the doc bound to a known template (e.g. `feature`, `view-component`,
   `index`)? → **Template-bound fill.**
2. Is the doc free-form prose? → Pick a Diátaxis scope
   (see `references/scopes.guideline.md`).
3. Is the doc pure navigation? → **Index** (`<n>.index.md`, binds to the
   `index` template, shipped in this skill's `markdown-schema-templates/index/`;
   found by name and proximity, nothing is installed).

## Quick card

**Filename patterns** (full rules in `references/structure-rules.guideline.md` /
`references/templates-and-tiers.guideline.md`):

| Doc kind            | Pattern                             | Example                             |
| ------------------- | ----------------------------------- | ----------------------------------- |
| Template-bound fill | `<n>.<artifact>.<template-name>.md` | `4.favorites.feature.md`            |
| Prose               | `<n>.<topic>.<scope>.md`            | `3.architecture.concept.md`         |
| Plain index         | `<n>.index.md`                      | `2.index.md`                        |
| Specialized index   | `<n>.index.<template-name>.md`      | `4.index.mdx-component-registry.md` |

- `<n>` is navigation depth from the tree's root index; in a single-doc tree (no index,
  see `references/structure-rules.guideline.md`) the one doc is level `1`. `<artifact>` / `<topic>`
  are kebab-case, specific and descriptive.
- **Directory pattern:** `<level>.<domain>/` — the domain appears in the
  directory name only, never in filenames within it.

**Level size budgets** (hard cap 300 lines, RECOMMENDED ≤150):

| Level | Content                          | Budget       |
| ----- | -------------------------------- | ------------ |
| `0`   | Root entry, TL;DR of all domains | 30–50 lines  |
| `1`   | Domain index or terminal spec    | 50–80 lines  |
| `2`   | Topic detail or sub-index        | 80–150 lines |
| `3+`  | Granular detail                  | 50–150 lines |

**Banned topic terms** (MUST NOT appear in a `<topic>` segment): `quickstart`,
`guide`, `overview`, `misc`, `other`, `various`, `stuff`, `things`, `utils`. Use
a specific kebab-case name. (`overview` has one grandfathered exception —
`overview.concept.md` — do not introduce new ones.)

## Routing to the markdown-schema and citations skills

This skill owns _where_ docs live and _which_ kind to write. Route to the
other two skills — do not reimplement — for:

| Task                                                            | Skill             |
| --------------------------------------------------------------- | ----------------- |
| Directive grammar (`enum:`, `field`, `row`, `section`, `guide`) | `markdown-schema` |
| Filling a template (replacing `TEMPLATE-ONLY` directives)       | `markdown-schema` |
| Writing / debugging a `*.refine.ts`                             | `markdown-schema` |
| Interpreting a `validate-md` error message                      | `markdown-schema` |
| Writing or resolving a `<package-name>#<SymbolName>` citation   | `citations`       |
| Citing a row of a document (`[D21](/<path>.md#D21)`)            | `citations`       |
| Picking the doc kind, scope, filename, location                 | This skill        |
| Cross-references generally (link form, prerequisites)           | This skill        |

## Validation

`markdown-schema` ships `validate-md`, which binds each document to its template by file
name and tree proximity and validates every bound document under a path:

```sh
validate-md <path/to/doc.md-or-folder>...
validate-md --template <path/to/name.template.md> <path/to/doc.md>   # one document, no binding
```

There is currently no whole-tree/manifest-based validator command in this
repo — that is deferred future work, not something to invoke. Validate each
template-bound fill individually with `validate-md` as you write it; for
tree-wide consistency (broken links, orphaned files, missing index entries),
review manually against `references/structure-rules.guideline.md` and
`references/cross-references.guideline.md` until a manifest-based validator exists. Do
not invent or assume a `ldocs`/whole-tree command — see
`references/validation-and-workflow.guideline.md` for what is and is not currently
checked.

Prose docs (`.spec`/`.concept`/`.workflow`/`.fix`/`.tutorial`) are not template-
validated — only indexes and template-bound fills are.

## Pre-commit checklist

- [ ] Filename matches a pattern above; `<topic>` uses no banned term.
- [ ] Required prerequisites declared right after the summary line, as a
      relative link.
- [ ] All template-required sections present (for fills / indexes).
- [ ] Every code citation uses `<package-name>#<SymbolName>` or an
      exception form (see the `citations` skill).
- [ ] Doc-path citations in template cells are relative Markdown links
      `[basename](path)` (the extractor yields the URL).
- [ ] Symbol citations `<package-name>#<SymbolName>` stay wrapped in inline
      code (backticks) so viewers linkify them; validation is unaffected.
- [ ] All internal Markdown links are relative and resolve, except a row citation:
      `[D21](/<path from the repository root>.md#D21)`, the key as its text, and
      relative only between files a package ships into other repositories (a
      skill's own files; the `citations` skill, **Rows**).
- [ ] Parent `<n>.index.md` links the new/renamed file.
- [ ] File is ≤300 lines (preferably ≤150).
- [ ] Every template-bound fill validates locally with `validate-md`.

## Editing existing docs

- **Editing a fill:** keep section structure intact — do not rename or reorder
  sections; that breaks template binding. Re-validate with `validate-md`.
- **Editing a template:** affects every fill that binds to it. Update the
  matching `<template-name>.refine.ts` if a cross-section invariant changes, then
  re-validate every existing fill. See `references/templates-and-tiers.guideline.md`.
- **Adding a sub-domain** (a domain outgrows ~6–8 files): create
  `<n+1>.<sub-domain>/`, add its `<n+1>.index.md` (navigation only), move files
  in, update the parent index and any moved files' prerequisite links, re-validate.

The full step-by-step for each case is in `references/validation-and-workflow.guideline.md`.
