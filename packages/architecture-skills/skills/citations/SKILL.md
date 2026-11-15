---
name: citations
description: Write or resolve a citation — a `<package>#<Symbol>` citation of a TypeScript declaration, or a link to a row of a document (a decision, a requirement, a region's rule, a use case) as `[D21](/<path from the repository root>.md#D21)` or `{@link /<path>.md#D21 | D21}` — in a doc, a TSDoc comment, a plan, a changelog or a skill. Covers both grammars and their TSDoc forms, how each resolves, private-citation rules, the skill-folder exception, and what `reference-resolution`, `row-citations` and `private-citation` report.
metadata:
  version: '0.2.2'
---

# Skill: citations

How to cite a TypeScript declaration or a row of a document, from documentation or from a TSDoc
comment. A citation resolves from the repository root with no local context and survives a move
of the citing file. Where a link to a whole document may appear in a doc is the
layered-documentation-authoring skill's subject.

| You cite                                                     | Write                                                                             | In TSDoc                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------- |
| A declaration (a symbol of a package)                        | a symbol citation in inline code, never a link: `` `<package>#<Name>` ``          | `{@link <package>/<lib>#<Name>}` |
| A row of a document (`D21`, `R16`, `UC7`: a table row's key) | a link from the repository root with the key as its text: `[D21](/<path>.md#D21)` | `{@link /<path>.md#D21 \| D21}`  |

| You need                                                                                       | Read                                      |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| To cite a declaration in a doc                                                                 | **Symbols**, below                        |
| To cite a row of a document                                                                    | **Rows**, below                           |
| To cite either from TSDoc                                                                      | [tsdoc-form.md](references/tsdoc-form.md) |
| How a citation resolves, a library's `lib-id`, private-citation access, what the checks report | [resolution.md](references/resolution.md) |

## Symbols

A symbol citation names only the package, an optional library and the declaration, never a file.

### Grammar

```
citation          := package-name (':' lib-id)? '#' (owner ('/' private-declaration)? | '/' private-declaration) ('.' member)*

package-name       verbatim from package.json#name, scoped or unscoped
lib-id             the library's canonical detected id (see "Surfaces and library
                   detection" below) — never a filesystem path, and never
                   reconstructed from one
owner              the cited exported (or, with a private-declaration, enclosing) declaration's identifier;
                   omitted in the lib-scoped private form `#/private-declaration`
private-declaration  an identifier private to owner's library, cited only under the access rules below
member             a property-access identifier; repeatable for nested members
```

| Char | Role                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/`  | npm scope (before `#`); package/owner → private declaration (after `#`, at most one; directly after `#` when there is no owner) |
| `:`  | package → library (at most one)                                                                                                 |
| `#`  | surface → declaration (exactly one, required)                                                                                   |
| `.`  | declaration/private-declaration → member (repeatable)                                                                           |

Always inline code (backticks). Never a Markdown link — a symbol citation has
no URL.

`:` and not `/` for the library: `@pkg/domain/cart` would look like an npm
subpath export and is not one. `:` marks "an internal unit of this package"
and greps cleanly (`@terv-dev/frontend:` finds every library citation of that
package).

### Examples

```
`@terv-dev/frontend#favoritesKeys`                       package surface
`@terv-dev/api-types#Page.frontmatter.type`              member

`@terv-dev/frontend:cart#injectCartResource`             library
`@terv-dev/frontend:domain/cart#injectCartResource`      library under a grouping directory
`@terv-dev/frontend:domain/cart#CartEvents.lineAdded`    member

`@terv-dev/frontend#checkoutFacade/checkoutVm`           private declaration (same-package, package/library-tier doc only)
`@terv-dev/frontend#checkoutFacade/checkoutVm.status`    private declaration, member
`@terv-dev/frontend:checkout#/CheckoutFacade`             lib-scoped private declaration, no owner
```

In prose:

> The cart line model is cited as follows (a union over `kind`):

```text
@terv-dev/frontend:domain/cart#CartLine
```

### Private declarations

A citation targets a public declaration by default. A private one may be cited only from
a doc of the **same package, at package or library tier**; root and group docs, and other
packages, cite public surfaces only.

- `owner/privateDeclaration` when the private declaration belongs to an exported one (a
  type used by an exported function, say);
- `<package>:<lib>#/<Name>` for a lib-private block that stands on its own, such as a facade,
  store or VM that no exported declaration encloses. Don't borrow an unrelated exported
  declaration as `owner`.

Details and resolver status are in [resolution.md](references/resolution.md#private-declarations).

### In TSDoc

Most references in a TSDoc comment aren't citations: for a declaration in scope in the
file, write a plain `{@link Name}`. Only a declaration that isn't in scope and can't be
imported gets a citation, written as `{@link <package>/<lib>#<Name>}`
([tsdoc-form.md](references/tsdoc-form.md)). Imports, code and test names never use
citations. A row is cited from TSDoc by its root link (**Rows**, below).

## Rows

A symbol is a package's; a **row** is a document's. A row of a document (a decision, a
requirement, a region's rule: any table row with a key, `D21`, `R16`, `UC7`) is cited by a **link
to the document's path from the repository root and the row key, with the key as the link text**,
in the same form in Markdown and in TSDoc:

```markdown
the file tree's [L1](/products/reviewer2/layered-docs/2.reviewer2.browser.file-tree.region.md#L1)
```

```ts
/** … the file tree's {@link /products/reviewer2/layered-docs/2.reviewer2.browser.file-tree.region.md#L1 | L1}. */
```

- **Why:** one form in both places; the link stays right when the citing file moves (only a
  move of the cited document changes it, and the planning skill's `move-plan` rewrites it); and
  the manifest's references layer resolves it to the row, so a renamed or removed row is reported
  (`reference-resolution`; in a living file the finding fails the repository's architecture gate,
  in a historical source it is an `info` prefixed `historical:`), and a declaration's TSDoc link
  is an edge from the declaration to the row.
- **Never in prose:** `constitution D21`, `browser/file-tree R16`, `(I14, L1)` name a row that
  nothing reads. `reviewer2-check --rule row-citations` reports a prose citation whose document
  has the key, and a row link written with a relative path; as a `warning` for a living file,
  which fails the repository's architecture gate (`pnpm --dir products/reviewer2 check:architecture`),
  and as an `info` prefixed `historical:` in a historical source, which does not.
- **Not converted:** a row of the same document is linked by its fragment alone (`[R16](#R16)`),
  and a document's own keys in its cells stay bare (`(S9, R16)`): they name no path.
- **TSDoc:** the TSDoc parser rejects a target that starts with `/`; the architecture-profile
  skill's `eslint-rules.cjs` wraps `tsdoc/syntax` (`tsdocSyntaxPlugin`, the rule
  `architecture-skills/tsdoc-syntax`) so this form passes ([tsdoc-form.md](references/tsdoc-form.md)).
  `@region` stays bare (`@region browser/file-tree`).
- **The exception, files a package ships into other repositories:** a skill (installed into
  `.claude/skills/`) cites a row of its own files with a relative link
  (`[D12](../node-block-architecture.constitution.md#D12)`), since `/packages/architecture-skills/…`
  does not exist where it is installed.

## Text that only looks like a citation

An inline code span with a `#` is read as a citation and checked, so write text that is not
one so that it can't be read as one:

- **A placeholder** names its parts in angle brackets, `<package>#<Name>` or
  `{@link <package>/<lib>#<Name>}`; that never parses as a citation.
- **A declaration key** (`<libId>#<qualifiedName>`, as the declaration graph keys it) is plain
  text or in a fenced block, not in an inline code span: it has a citation's shape.
- **A file's field** (`package.json#name`) is not a citation: a file name with an extension
  before the `#` is read as a reference to the file.
- **An illustrative citation of a made-up package** goes in a fenced code block, which is
  not read.

## Forbidden forms

| Form                                                                       | Why                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/x/src/app/libs/domain/cart/cart.resource.ts`, with or without `:42`  | Path rots on move.                                                                                                                                                                  |
| `injectCartResource`                                                       | Bare, ambiguous — no package.                                                                                                                                                       |
| `@app/libs/domain/cart#X`                                                  | tsconfig alias, app-local.                                                                                                                                                          |
| `@pkg/domain/cart#X`                                                       | Slash-style fake subpath — use `:` for a library. (Inside a TSDoc `{@link}`, the slash form is the required form; see [tsdoc-form.md](references/tsdoc-form.md).)                   |
| `@pkg::X`, `@pkg.X`, `@pkg:cart:X`, more than one `#` or `/` after it      | Non-canonical separators, rejected by the parser.                                                                                                                                   |
| `@pkg:libs/manifest-loading/src#X`                                         | Pre-normalization raw physical path — parses, but does not resolve; use the library's canonical `lib-id` (e.g. `manifest-loading`).                                                 |
| A Markdown link around a symbol citation                                   | It has no URL — use inline code (backticks), not a link.                                                                                                                            |
| `constitution D21`, `browser/file-tree R16`, `(I14, L1)` in prose or TSDoc | A prose row citation: nothing resolves it. Link the row from the repository root; `row-citations` reports it.                                                                       |
| `[D21](../layered-docs/2.reviewer2.constitution.md#D21)`                   | A relative row link: it breaks when the citing file moves. Write the path from the repository root; `row-citations` reports it (a skill's link to a row of its own files excepted). |
| A row cited as a symbol citation (`` `<package>#D21` ``)                   | A row is a document's, not a package's: it has a URL, so it is a link.                                                                                                              |

Path exceptions (file paths that are legitimately fine to cite) are
unchanged from `cross-references.guideline.md`: SQL functions, migrations,
config/build/deploy scripts, generated artifacts, `package.json`, routes,
HTTP endpoints.
