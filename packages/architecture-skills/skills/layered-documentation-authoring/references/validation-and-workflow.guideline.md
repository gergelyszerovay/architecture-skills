# Validation and authoring workflow

> What `validate-md` checks per file, what every `refine.ts` must implement,
> the tree-level rules authors currently enforce by review, and the
> step-by-step for adding or editing a doc.

Companion to `../SKILL.md`. Template binding is in `templates-and-tiers.guideline.md`;
citations in `cross-references.guideline.md`.

## RFC 2119 keywords

MUST, MUST NOT, SHOULD, MAY are used per RFC 2119.

## Scope split

| Layer      | Tool                        | Scope                                                          |
| ---------- | --------------------------- | -------------------------------------------------------------- |
| Per-file   | `validate-md` + `refine.ts` | One file vs its template. Structural + per-section invariants. |
| Tree-level | _(none yet — see below)_    | Multiple files: registry-sibling drift and other tree rules.   |

`validate-md` (bin from the `markdown-schema` package) binds each document to its
template, parses the template + fill, asserts structural conformance, and runs the refine.
Add it as a devDependency and run `validate-md <path>` on the files or folders you write;
use `--template <t> <file>` only for a file no template binds to.

**There is currently no tree-level validator command.** A manifest-based
whole-tree validator (replacing the retired `ldocs` CLI) is planned but not
yet implemented — do not invoke or assume a `ldocs`/whole-tree command exists.
Until it does, the "Tree-level lint rules" below are checks an author MUST
still satisfy, verified by manual review rather than a CLI.

## What `validate-md` MUST check (per file)

1. The doc resolves to exactly one template.
2. Section headings match the template, in order.
3. Required sections are present and non-empty.
4. Optional sections marked `remove-if X=Y` are absent when the condition holds.
5. Required fields are present and match their declared type.
6. Tables marked `row; min-rows: N` have at least N rows.
7. Section groups marked `min-groups: N` have at least N groups.
8. Enum fields hold an allowed value.
9. Regex-constrained string fields match.
10. The refine module exports a `refine` function and runs against the parsed doc.

Prose docs (`.spec`/`.concept`/`.workflow`/`.fix`/`.tutorial`) are not template-
bound and are reported as `(prose)` — they are not structurally validated.

## What `refine.ts` MUST check (every template)

Every template's refine MUST implement at least these cross-cutting rules:

1. **Symbol-citation existence** — each `<package-name>#<SymbolName>` cited in a
   field resolves to a package in `pnpm-workspace.yaml` AND an exported symbol in
   that package's public entry point (`package.json#exports` or `src/index.ts`).
2. **Internal link resolution** — each link in a template-bound field resolves to
   an existing file; an anchor, if present, is a heading in the target. Doc-path
   citations are written as Markdown links `[basename](path)`; the fill-value
   extractor yields the link's **URL**, so the refine's path-shape regex runs on
   the path (a legacy backticked plain path yields the same string).
3. **`n/a` literal** — a required citation field MAY contain the literal string
   `n/a` (verbatim), meaning "no citation applies".
4. **Exception-list path existence** — file paths permitted by the
   symbol-references exception list (configs, scripts, migrations) MUST exist.
5. **No banned topic terms** — doc filenames MUST NOT use the banned topic terms
   (see `scopes.guideline.md`).

Template-specific rules go on top. A shared utility exposes the cross-cutting
checks so each refine calls them in one line, then adds its own.

### What `refine.ts` MUST NOT do

- Read or fetch from the network.
- Mutate the doc.
- Throw — issues are reported via `ctx.addIssue(...)` only.
- Depend on order-of-evaluation of sibling refines.

```ts
import type { z } from 'zod';

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  // 1. Apply the cross-cutting rules above (factored into a shared util).
  // 2. Apply template-specific invariants.
};
```

## Tree-level lint rules

Several rules span multiple files and cannot live in one template's refine.
No tool currently enforces these — an author MUST check them by review until
a manifest-based validator exists. The full rule set:

### L1 — Parent index lists every direct child

A directory MUST contain exactly one index file (plain `<n>.index.md` binds to
`index`; specialized `<n>.index.<template-name>.md` binds to that template). The
index's `## Contents` table MUST link to each sibling file and each subdirectory's
index. Files listed but missing on disk are flagged. Zero or >1 index is a hard
error.

### L2 — No orphan docs

Every non-index doc MUST be reachable from the tree's root index by following
Contents links.

### L3 — Cross-Domain targets are indexes

Entries in any `## Cross-Domain` table SHOULD target an index file at the other
domain. A non-index target MAY warn (not block).

### L4 — Citation graph

For every Markdown link in every doc: the link MUST resolve, always as a
relative path from the citing file's directory — a `../` chain crossing into
another documentation tree, package, or tier is expected and valid, not an
error; an anchor MUST exist as a heading in the target.

### L5 — Banned topic terms

No filename `<topic>` segment may contain `quickstart`, `guide`, `overview` (with
the single grandfathered exception), `misc`, `other`, `various`, `stuff`,
`things`, `utils`.

### L6 — Symbol citations resolve

Across every template-bound doc, every `<package-name>#<SymbolName>` MUST cite a
package in `pnpm-workspace.yaml` and a symbol exported by it. Run tree-wide.

### L7 — Template name clash

Binding looks only in each ancestor's own templates folder, and a canonical folder
wins over a legacy one in the same directory, so two templates of one name cannot
clash. There is nothing to report.

### L10 — Index doc shape

Every index MUST resolve to a template, have a one-line summary as the first line
after the title, a `## Key Points` section with 2–4 bullets, a `## Contents`
table listing direct children, and a `## Cross-Domain` section only when at least
one cross-domain link exists (never empty). Specialized indexes MAY add sections
after the nav sections.

### L11 — Specialized index payload matches siblings

For a specialized index whose payload-table rows correspond to per-artifact fills
in the same directory: every row MUST have a sibling fill on disk, and every
matching sibling fill MUST appear as a row. Row-vs-file order mismatches are
warnings. The applicable templates are declared via a `siblingArtifactTemplate`
constant in each template's `refine.ts` — the linter reads that constant.

> Note: none of L1–L11 is currently enforced by a tool — only per-file
> validation (`validate-md` + `refine.ts`) is. Author to the full rule set
> anyway: broken links, orphans, and drift are still defects even though
> nothing flags them automatically yet.

## Authoring workflow

### Decide kind, location, filename

1. **Kind:** template-bound fill / prose (pick a scope) / index. See `../SKILL.md`.
2. **Location:** the doc's directory is its domain. Use the parent's
   `<n>.index.md` to choose where it fits. `<n>` MUST reflect navigation depth
   from the tree root. If adding the doc pushes a directory past ~6–8 entries,
   create a sub-domain first.
3. **Filename:** per the patterns in `../SKILL.md` / `templates-and-tiers.guideline.md`.
   Pick a **specialized index** when the index must carry a structured payload
   (e.g. a registry table) beyond nav, AND the combined doc stays ≤300 lines.

### Adding a template-bound fill

1. Confirm the template exists at one of the tiers.
2. Create the file at the chosen path.
3. Copy the template's section structure (headings + table headers + any section
   numbering the template uses) into the new file. The `markdown-schema` skill can
   scaffold this.
4. Fill required fields. Use `n/a` only when the field genuinely doesn't apply.
5. Cite TS code and rows of documents per the `citations` skill; cite other docs by a
   relative path — see `cross-references.guideline.md`.
6. Run `validate-md <file>` on the new file (`--template <t>` if no catalog binds it). Fix issues.
7. Update the parent `<n>.index.md` to link the new file.
8. Stage + commit.

### Adding a prose doc

1. Pick the scope (see `scopes.guideline.md`).
2. Create the file with the standard skeleton:

   ```markdown
   # <Title>

   > One-line summary.

   **Prerequisite:** Read [<title>](path) first for <reason>. <!-- optional -->

   ## <Sections per the doc's purpose>
   ```

3. Cap the file at ~150 lines (hard cap 300).
4. Avoid duplicating content from prerequisites — link to them.
5. Update the parent `<n>.index.md`.

### Adding a sub-domain

When a domain grows beyond ~6–8 files:

1. Create the sub-domain directory `<n+1>.<sub-domain>/`.
2. Add `<n+1>.index.md` summarising it (navigation only).
3. Move (or create) sub-domain files into it.
4. Update the parent index to link the sub-domain index.
5. Update prerequisite links in moved files.
6. Manually check L1–L4 above (parent index completeness, no orphans, link
   resolution) — no tool does this yet.

### Editing an existing fill

1. Change the relevant section. Keep section structure intact — do not rename or
   reorder sections; that breaks template binding.
2. Re-run `validate-md <file>` on it.

### Editing a template

Template edits affect every fill that binds to it. Treat them carefully.

1. Edit the template at the right tier.
2. Update the matching `<template-name>.refine.ts` if a cross-section invariant
   changes.
3. Re-run `validate-md` over every existing fill that binds to the template;
   some fills may need updates.
4. If editing a farther-tier template that a nearer tier overrides, check for
   L7 drift manually; update the override or note the divergence explicitly.

## Pre-commit checklist

- [ ] Filename matches the patterns; `<topic>` uses no banned term.
- [ ] Required prerequisites declared after the summary line.
- [ ] All template-required sections present.
- [ ] All citations follow the `citations` skill's rules or an exception form.
- [ ] All internal links are relative Markdown links and resolve, except a row citation, a link
      from the repository root (the `citations` skill, **Rows**).
- [ ] Parent index links the new/renamed file.
- [ ] File is ≤300 lines (preferably ≤150).
- [ ] Every template-bound fill validates locally with `validate-md`.
- [ ] Tree-level rules (L1–L11 above) checked by manual review — no tool
      enforces them yet.
