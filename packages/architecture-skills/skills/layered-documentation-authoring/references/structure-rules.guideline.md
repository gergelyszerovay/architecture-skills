# Structure rules — naming, levels, indexes, splitting

> MUST/SHOULD rules for adding or editing files in any `layered-docs` tree.

Companion to `../SKILL.md`. For scopes see `scopes.guideline.md`; for template
binding see `templates-and-tiers.guideline.md`.

## RFC 2119 keywords

MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY, OPTIONAL.

## Directory and file naming

**Pattern:** `<level>.<domain>/<level>.[<topic>.]<scope>.md`

| Segment  | Required in dir | Required in file | Format                    |
| -------- | --------------- | ---------------- | ------------------------- |
| `level`  | REQUIRED        | REQUIRED         | `0–9`                     |
| `domain` | REQUIRED        | NEVER            | kebab-case                |
| `topic`  | n/a             | OPTIONAL         | kebab-case                |
| `scope`  | n/a             | REQUIRED         | see `scopes.guideline.md` |

The domain appears in the directory name only — never in filenames within that directory.

## Levels

| Level | Content                          | Size budget  |
| ----- | -------------------------------- | ------------ |
| `0`   | Root entry, TL;DR of all domains | 30–50 lines  |
| `1`   | Domain index or terminal spec    | 50–80 lines  |
| `2`   | Topic detail or sub-index        | 80–150 lines |
| `3+`  | Granular detail                  | 50–150 lines |

## Scopes

| Scope      | Diátaxis    | Use when                                 |
| ---------- | ----------- | ---------------------------------------- |
| `index`    | —           | Navigation, summaries, links to children |
| `tutorial` | Tutorial    | Learning journeys, "build X"             |
| `workflow` | How-to      | Task steps to achieve a goal             |
| `fix`      | How-to      | Troubleshooting, problem → solution      |
| `concept`  | Explanation | Why, context, architecture, design       |
| `spec`     | Reference   | Facts, configs, APIs, rules              |
| `example`  | (any)       | Code samples, demonstrations             |
| `template` | (any)       | Reusable starting points                 |
| `schema`   | (any)       | XML/JSON schemas (in `templates/`)       |

Full scope semantics and picking rules are in `scopes.guideline.md`.

## Normative rules

### Directory organization

1. Each domain MUST have its own directory with a level prefix.
2. Domain directories MUST contain an index file named `<level>.index.md`, except a
   **single-doc tree**: a tree whose root holds exactly one template-bound doc and no
   subdirectories (typically a library's or package's own tree) has no index. Its one
   doc is the tree's level-1 entry (`1.<artifact>.<template-name>.md`), and its title and
   summary line serve as the index. Add an index when a second doc or a subdirectory
   arrives, and renumber the existing doc to level 2.
3. Subdomain directories MUST be nested within parent domain directories.
4. Non-documentation assets (templates, images) MAY omit the level prefix.

### File content

5. Index files MUST contain only summaries and links to child files.
6. Index files MUST NOT contain detailed content.
7. Non-index files SHOULD be self-contained for their topic.
8. Files MUST NOT exceed 300 lines; RECOMMENDED maximum is 150 lines.
9. Files exceeding limits MUST be split; the parent MUST become an index.

### Naming

10. Level MUST reflect actual navigation depth from root.
11. Domain MUST appear in directory name, NOT in filename.
12. Two-domain intersections SHOULD use `domain+domain` directory format.
13. Topics spanning 3+ domains SHOULD use `xcut` (cross-cut) as domain.
14. Topic MUST be kebab-case, descriptive, and concise.
15. Topic MUST NOT use vague or generic terms.

**Banned topic terms:** `quickstart`, `guide`, `overview`, `misc`, `other`, `various`, `stuff`, `things`, `utils`. Use a specific name describing the actual content.

### Linking

16. Index files MUST link to all direct children.
17. Index files SHOULD link to relevant cross-domain files.
18. Links MUST use relative paths, whether same-tree or crossing into another tree. See `cross-references.guideline.md`.
19. Cross-domain links SHOULD target index files, not deep content.

### Cross-domain files

20. Cross-domain files MUST be linked from all relevant domain indexes.
21. The primary domain SHOULD be listed first in the `domain+domain` pattern.

### Prerequisites

22. When a file depends on concepts from another file at the same level, it MUST declare a prerequisite.
23. Prerequisites MUST be declared immediately after the summary line.
24. Prerequisite links MUST use the link-path rules in `cross-references.guideline.md`.
25. `.spec` files SHOULD declare `.concept` files as prerequisites when they implement the concept.
26. Files MUST NOT duplicate content from their prerequisites; they SHOULD reference it.

**Format:**

```markdown
# Title

> Summary line.

**Prerequisite:** Read [filename.md](./filename.md) first for [brief reason].
```

## Index file template

Plain indexes bind to the `index` template. The shape:

```markdown
# [Domain/Topic Name]

> One-line summary for LLM context

## Key Points

- [2–4 bullet points capturing essentials; no links inside Key Points]

## Contents

| Topic | File            | Summary              |
| ----- | --------------- | -------------------- |
| ...   | [link](file.md) | One-line description |

## Cross-Domain

| Topic | File                            | Domains        |
| ----- | ------------------------------- | -------------- |
| ...   | [link](../other-domain/file.md) | domain, domain |
```

Rules the `index` template + its refine enforce: summary line is 10–200 chars;
Contents has ≥1 row with unique Topic and unique File; the `## Cross-Domain`
section is present ONLY when it has at least one row (an empty Cross-Domain
section is an error). Contents `File` cells are relative Markdown links whose
label ends in `.md`.

## Splitting checklist

When a file exceeds 150 lines:

1. Create subdomain directory `<level+1>.<topic>/`.
2. Create index file `<level+1>.index.md`.
3. Extract sections into `<level+1>.<subtopic>.<scope>.md` files.
4. Update parent index links.
5. Verify all links resolve.
