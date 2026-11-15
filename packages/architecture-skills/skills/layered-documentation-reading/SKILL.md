---
name: layered-documentation-reading
description: Navigate and consult the repo's layered-docs trees. Use when reading, looking up, or answering a question from any `layered-docs/` tree (repository root, package, library, or group) — which index to open, how much context to load, how to follow prerequisite and cross-tree links, and how to tell template-bound docs from prose. Read this before opening layered-docs files so you load the minimum, not everything.
metadata:
  version: '0.1.1'
---

# Skill: layered-documentation-reading

The procedure for **reading** the repository's layered documentation. To add or edit docs,
use the layered-documentation-authoring skill; for a `*.template.md` directive, the
markdown-schema skill; to resolve a `<package-name>#<SymbolName>` citation or a row link
(`[D21](/<path>.md#D21)`), the citations skill.

## Trees

Docs live in `layered-docs/` directories, and the templates they bind to in
`markdown-schema-templates/` folders anywhere near them. A tree's owner is set by where it sits, not by
its name:

| Parent of the `layered-docs` directory           | Owner   |
| ------------------------------------------------ | ------- |
| Repository root                                  | Root    |
| A package root that contains other package roots | Group   |
| A package root                                   | Package |
| A library root                                   | Library |
| Any other directory                              | Group   |

A group's docs apply to every package under it. What each owner's tree holds, the
directory names older commits use, and the link forms are in
[trees-and-links.md](references/trees-and-links.md).

## Mental model

Each domain is a directory with one index file (`<level>.index.md`) that links to its
children. **Indexes carry no detail**: they summarize and link. A **single-doc tree**, whose
root holds exactly one template-bound doc, has no index; that doc
(`1.<artifact>.<template-name>.md`) is the entry point.

Detail lives in non-index files, each with one **scope** suffix or a template binding:

| Scope                    | Answers                                   |
| ------------------------ | ----------------------------------------- |
| `.spec`                  | "What are the exact rules / facts / API?" |
| `.concept`               | "Why does this exist? What's the model?"  |
| `.workflow`              | "How do I achieve a specific goal?"       |
| `.fix`                   | "Something is broken — how do I fix it?"  |
| `.tutorial`              | "Walk me through building X from zero."   |
| `.index`                 | "What lives in this domain?" (navigation) |
| `.example` / `.template` | Demonstration / reuse starting point.     |

- **A prose doc** (`.spec`, `.concept`, `.workflow`, `.fix`, `.tutorial`) reads top to
  bottom; its summary line and prerequisites give its scope.
- **A template-bound doc** has a template name instead of a scope
  (`<n>.<artifact>.<template-name>.md`, e.g. `4.favorites.feature.md`). Its sections come
  from the template; to learn what a section means, open the matching
  `<template-name>.template.md`, found by name and proximity (walk up from the doc,
  looking in each ancestor's own templates folder), or run `documents bind <doc>`.

## Load the minimum

| Goal                         | Load                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Orient — what domains exist? | The tree's root index (`0.index.md` or `1.index.md`), or a single-doc tree's one `1.*.md` |
| Get the lay of the land      | Root index + every `<n>.*/<n>.index.md`                                                   |
| Drill into one domain        | That domain's `<n>.index.md` + its sub-indexes                                            |
| Answer a specific task       | Follow index links to the relevant `.spec` / `.workflow`                                  |

**Never read every file in a domain "to be safe"**: the indexes already filter. Useful
globs: `**/[0-9].index.md` (every index), `1.<domain>/**/*.md` (one domain),
`**/*.spec.md` and `**/*.workflow.md` (by scope).

## Prerequisites and links

A non-index file may name a prerequisite right after its summary line:

```markdown
**Prerequisite:** Read [filename.md](./filename.md) first for [brief reason].
```

**Read the prerequisite first**; the file assumes you have. A `.spec` often names its
`.concept`. Links between docs are relative Markdown links, across trees too; symbol
citations are in backticks.
