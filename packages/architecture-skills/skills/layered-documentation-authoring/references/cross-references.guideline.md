# Cross-references

> Normative rules for citations between docs. Symbol citations
> (`<package-name>#<SymbolName>`) and row citations (`[D21](/<path>.md#D21)`) are
> owned by the `citations` skill — route to it for grammar and resolution rules;
> this file only says where they may appear and how they interact with
> doc-to-doc links.

Companion to `../SKILL.md`. Template binding is in `templates-and-tiers.guideline.md`.

## RFC 2119 keywords

MUST, MUST NOT, SHOULD, MAY are used per RFC 2119.

## Three doc-to-doc mechanisms

| Mechanism               | Where it appears                                  | Blocking?              | Expresses                             |
| ----------------------- | ------------------------------------------------- | ---------------------- | ------------------------------------- |
| **Prerequisite**        | One line after the summary line in non-index docs | Yes                    | Reader MUST read the cited doc first. |
| **Cross-Domain table**  | An index doc's `## Cross-Domain` section          | No                     | Related material in another domain.   |
| **Template-field link** | Inside a template-bound section                   | No, but refine-checked | Typed citation of a doc or symbol.    |

Plain inline links MAY also appear but carry no semantic weight beyond "this is
related". Prefer one of the three mechanisms when expressing structure.

## Prerequisite citations

A non-index doc MAY declare zero or more prerequisites immediately after the
`> summary` line:

```markdown
# Title

> One-line summary.

**Prerequisite:** Read [<title>](path) first for <brief reason>.
```

Rules:

1. Prerequisites MUST follow the link-path rules in "Cross-tier links" below.
2. Prerequisites MUST point to a single file. Multiple prerequisites are multiple
   `**Prerequisite:**` lines, one per file.
3. Prerequisites MUST NOT form cycles.
4. A doc MUST NOT duplicate content from its prerequisite — only reference it.
5. A `.spec` SHOULD declare its paired `.concept` (if any) as a prerequisite.
6. A `.workflow` SHOULD declare the `.spec` files it depends on as prerequisites.
7. A `.fix` SHOULD declare the relevant `.spec` as a prerequisite.

## Cross-Domain table

Index files MAY include a `## Cross-Domain` section listing related material in
other domains. Rules:

1. Cross-Domain entries MUST link to index files at the other domain when
   possible, not to deep content.
2. Cross-Domain entries are non-blocking.
3. The `Domains` column names the other domains touched, comma-separated.
4. The section is present ONLY when it has ≥1 row — an empty Cross-Domain section
   is an error.

## Symbol references — delegated to the citations skill

Every reference to a TypeScript symbol exported from a workspace package uses
the `<package-name>#<SymbolName>` form (member paths and, within one package,
a private-declaration qualifier are also supported). The full grammar,
resolution rules, and private-citation access policy live in the
**`citations` skill** (**Symbols**) — route to it whenever you write or resolve one
of these citations rather than re-deriving the rule here. The essentials this
file needs:

- The citation is written in **backticks** (it has no URL) — see
  "Template-field citations" below.
- `<package-name>` is verbatim from `package.json#name`, including its npm
  scope; everything left of `#` is a copy-pasteable import specifier.

Example:

```text
The favorites query factory is @terv-dev/frontend#favoritesKeys.
```

**Why package + symbol, not a file path:** files move frequently — `destiny`
relocates files by import-graph LCA on every run, and `validate-fractal-tree`
triggers further moves. File paths in docs rot within days. Package + symbol
is the stable contract: the package name is set in `package.json`, and an
exported symbol's identity does not change when its file moves.

## What MUST NOT appear in docs

| Forbidden form                                             | Why                                   |
| ---------------------------------------------------------- | ------------------------------------- |
| `apps/<app>/frontend/src/...path/to/file.ts`               | Rots on file move.                    |
| `apps/<app>/frontend/src/...file.ts:42`                    | Path + line both rot.                 |
| `/path/to/file.ts#SymbolName`                              | Same — path-anchored.                 |
| Bare symbol names without package (`Page`, `useSession`)   | Ambiguous across packages.            |
| `@pkg · Symbol` (middle-dot separator, legacy form)        | Use `#` separator per current rule.   |
| `@pkg.Symbol`, `@pkg::Symbol`, `@pkg/Symbol`               | Non-canonical. Only `#` is permitted. |
| Host-absolute filesystem paths (`/workspace/…`, `/home/…`) | Use a relative Markdown link.         |
| External GitHub URLs to files in this repo                 | Use a relative Markdown link instead. |
| Bare references like "see the feature spec"                | Use an explicit link.                 |

## Exceptions — when a file path is allowed

These references MAY use file paths because they are not movable exported TS
declarations:

| Kind                         | Format                                  | Example                                                        |
| ---------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| Supabase SQL functions       | `<schema>.<function_name>`              | `public.deduct_api_cost`                                       |
| Supabase migration files     | `supabase/migrations/<timestamped>.sql` | `supabase/migrations/20260414000000_content_and_favorites.sql` |
| Config files                 | repo-relative path                      | `apps/terv-dev/frontend/vite.config.ts`                        |
| Build scripts                | repo-relative path                      | `apps/terv-dev/frontend/scripts/prerender.ts`                  |
| Deploy scripts               | repo-relative path                      | `apps/terv-dev/deploy-staging.sh`                              |
| Generated artifacts          | repo-relative path                      | `apps/terv-dev/content-json/image-manifest.json`               |
| `package.json` and lockfiles | repo-relative path                      | `apps/terv-dev/frontend/package.json`                          |
| URL routes                   | route pattern                           | `/:tier/p/:pageType/:slug`                                     |
| HTTP endpoints               | method + path                           | `POST /functions/v1/llm-proxy`                                 |

In every exception the file/path is not produced by `destiny` and not subject to
fractal-tree relocation.

## Template-field citations

Template fields that cite other docs or code use one of three forms:

| What you cite                                  | Form                                                                          | Example                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Another doc, same tree or another              | **Markdown link** `[<basename>](<path>)`, always relative to the citing file. | `[4.favorites.feature.md](../3.features/4.favorites.feature.md)` |
| A TS symbol                                    | `<package-name>#<SymbolName>` in **backticks** (no URL exists)                | `` `@terv-dev/frontend#favoritesKeys` ``                         |
| A SQL function / file path / route (exception) | The exception form above, in backticks                                        | `` `public.deduct_api_cost` ``                                   |

Rules:

1. Doc-path cells MUST be Markdown links `[<basename>](<path>)`. The URL is
   always a relative path from the citing file — including when the target
   sits in a different documentation tree, package, or tier. The label
   SHOULD be the target's basename (full, ordinal included).
2. Doc paths MUST resolve at validation time (file exists; anchor, if any,
   exists).
3. Symbol citations (`<package-name>#<SymbolName>`) MUST be validated by the
   template's refine (regex on shape; package + symbol existence via shared
   util).
4. A `required` citation field MUST NOT be left blank. If no real citation
   exists, write the literal string `n/a` — `validate-md` accepts it.
5. Backticks are scoped to **symbol** citations and the exception forms
   (SQL functions, file paths, routes) — tokens that have no URL. Doc paths
   use link syntax, not backticks. `n/a`, `inline`, and other literals stay
   plain.

### How link extraction works

`markdown-schema`'s fill-value extractors (`cell-text.ts`) stringify a `link`
node to its **url**. A cell written as
`[4.favorites.feature.md](../3.features/4.favorites.feature.md)` reaches the
refine as the bare path `../3.features/4.favorites.feature.md` — so a refine's
path-shape regex (`^(\.{1,2}/|/)?[A-Za-z0-9_./-]+\.md$`) validates it, GitHub and
spec-viz render a native link, and the label is free to be human-readable.
External `https://` URLs in refine-checked cells are links too (their url is the
target). Autolinks are unaffected (url equals label).

The **legacy backticked plain-path form** (`` `../3.features/4.favorites.feature.md` ``)
is still valid — it is `inlineCode`, whose value is the bare path — but it is
deprecated: GitHub renders it as inert text and spec-viz needs a special
inline-code linkify heuristic to make it clickable. Prefer the link form for
every new doc-path citation.

### Rendering: spec-viz handles both forms

The spec-viz doc reader renders a real Markdown link natively (resolved through
the backend). For backwards compatibility it _also_ linkifies an inline-code
span that is exactly a `<package-name>#<SymbolName>` token or a `*.md` doc path.
So a legacy backticked path still becomes clickable, and a symbol citation
(which has no URL and stays backticked) is linkified the same way. Template
example rows and guide comments SHOULD model the link form for doc paths and the
backtick form for symbols so authored fills inherit both.

Where doc-path link form also applies:

- **Prose body of a spec doc** (outside template-bound cells) — already used
  `[label](path)` Markdown links; keep them.
- **Cross-Domain tables in indexes** — use Markdown link form; the URL doesn't
  need refine-level validation.

## Citing a row

A row is cited as the citations skill's **Rows** says.

## Links across trees

Local Markdown-to-Markdown references other than a row citation (the `citations` skill) use a
**relative Markdown link**
from the citing file — whether the target sits in the same tree, a different
tier's tree, or another package's tree entirely (`./foo.md`,
`../../other-package/layered-docs/2.bar.spec.md`). There is no separate
repo-root-absolute form reserved for crossing a tier boundary: a relative
path resolves the same way regardless of how many `layered-docs`/
`markdown-schema-templates` directories it crosses. GitHub, most IDEs, and this
repo's own doc viewer all resolve a relative Markdown link from the file that
contains it, so this is also what stays portable if a tree is ever moved or
copied elsewhere.

A relative link does still rot if the _citing_ file itself moves without its
target moving too (the `../../` count changes) — that is an ordinary
consequence of relative linking, not specific to crossing a tier boundary.
When `destiny`/`validate-fractal-tree` relocate a doc, update its outgoing
relative links to match; this is the same discipline already required for
same-tier links.

## Referencing skills

Agent skills (this one, `layered-documentation-reading`, `markdown-schema`, …)
are addressed **by name, never by file path** — except in tooling wiring. A
skill's `name` is its stable public identifier (like a package name); its
`.claude/skills/…` location is an install detail that changes per agent
(`.claude/`, `.cursor/`, …) and per consumer (`npx skills add` copies it around).
Skills also load by their `description` trigger, so a link is never needed for
discovery and only rots.

| Context                                                                                                         | How to reference a skill                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layered-docs content (indexes, specs, prose, template cells)                                                    | By **name** only — `the layered-documentation-authoring skill`. Never a `.claude/skills/…` link, in prose or in a Cross-Domain / template-field cell.                                                           |
| Skill → skill (routing between skills)                                                                          | By **name** — `route to the markdown-schema skill`.                                                                                                                                                             |
| Harness / tooling wiring (CLAUDE.md, package README, the `.agents/skills` links `install-skills --link` writes) | A **path** is fine — it is the actual wiring. Use the skill's actual source location (e.g. `packages/architecture-skills/skills/<skill>/`, `reviewer/toolkit/markdown-schema/.claude/skills/markdown-schema/`). |

Corollaries:

- A Cross-Domain row or template-field cell MUST NOT point at a skill file. If a
  reader genuinely needs a machine-navigable jump, point at a **real doc** (a
  surviving `.spec` / index in a layered-docs tree), not at the skill.
- Do not mirror skill content into a doc just to make it linkable — that
  reintroduces the duplication the skills exist to remove. If the content needs
  to live in a linkable doc, it belongs in a layered-docs tree, not a skill.
- Sibling files **within** one skill (e.g. this skill's `scopes.guideline.md`)
  are referenced by bare relative filename — that is internal to the skill
  package and stays portable.

## Anchors

A link MAY target a heading anchor (kebab-cased heading):

```markdown
[templates.guideline.md#refine-contract](./templates-and-tiers.guideline.md#refine-contract)
```

The anchor MUST exist in the linked file.

## Authoring checklist

Before committing a spec change:

- [ ] Every code citation follows the `citations` skill's rules (name
      verbatim from `package.json#name`, scope included) or an exception form.
- [ ] Every cited package exists in `pnpm-workspace.yaml`.
- [ ] Every cited symbol is exported from the cited package's public entry point.
- [ ] Every doc link is a relative Markdown link and resolves, whether or not
      it crosses into another tree, except a row citation, which is a link from the
      repository root with the key as its text (`[D21](/<path>.md#D21)`; the `citations` skill).
- [ ] Template-field doc paths are Markdown links `[basename](path)`; symbol
      citations stay in backticks; prose links use `[label](path)`.
- [ ] Skills are referenced by name, never by a `.claude/skills/…` file path.
