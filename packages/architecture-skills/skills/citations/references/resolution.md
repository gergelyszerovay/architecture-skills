# Resolution

How a citation resolves: a symbol citation to a declaration (the steps, when a private
declaration may be cited, how a library's `lib-id` is derived), a row link to a row of a
document, what the checks report, and what is implemented today. The grammars are in the
citations skill's `SKILL.md`.

## Resolution

1. Split on `#` (exactly one required); split the part before it on `:` (at
   most one); split the part after `#` on `/` (at most one) and then `.`
   (repeatable).
2. **Package:** the workspace package whose `package.json#name` matches
   verbatim.
3. **Surface:** no `lib-id` → the package's own public entry point
   (`package.json#exports` / its declared entry). A `lib-id` → look it up
   verbatim in that package's detected library table (see "Surfaces and
   library detection" below); never interpret a `lib-id` directly as a
   filesystem path, and never derive one by reconstructing a path from it.
4. **Owner declaration:** looked up on that surface by name.
5. **Private declaration** (when present): looked up within the owning
   library/package's own subtree — see "Private declarations" below for when
   this is even permitted.
6. **Member path:** resolved against the owning declaration and threaded
   through as navigation context — **not type-checked**. A member path is
   parsed and carried through resolution, but nothing validates that the
   member actually exists on the declaration's type; do not claim or rely on
   member-level validation. (Implementation: `resolveSymbolLocator`/
   `resolveSymbolCitation` mark a resolved member path `status: "unchecked"`.)

The citing doc's own location never participates in resolution — a citation
resolves identically wherever it appears.

## Private declarations

By default a citation resolves to a **public** declaration (one that is part
of the package's — or library's — public surface). A citation MAY instead
target a **private** declaration, using the `owner/privateDeclaration` form,
but only under this access policy (as implemented in
`@gergelyszerovay/package-manifest`'s citation resolution):

| Citing doc's package                  | Citing doc's tier      | Private citation allowed?                                                          |
| ------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| A _different_ package than the target | any                    | **Never** — cross-package private citations are always denied, regardless of tier. |
| The _same_ package as the target      | `root` or `group`      | **Never** — root/group documents may cite public surfaces only.                    |
| The _same_ package as the target      | `package` or `library` | **Allowed.**                                                                       |

Use `owner/privateDeclaration` when the private declaration really belongs to
an exported one (a type used by an exported function, say). For a lib-private
block that stands on its own, such as a facade, store or VM that no exported
declaration encloses, use the **lib-scoped private form** `<package>:<lib>#/<Name>`.
It is resolved within that library's own files, under the same access policy
as above, and requires a `lib-id`. A name declared more than once in the
library is an error; under the one-primary-declaration-per-file policy that is
rare. Don't borrow an unrelated exported declaration as `owner`: it misleads
readers about ownership and breaks when that declaration is renamed.

The lib-scoped form is not resolved by `@gergelyszerovay/declaration-graph2`
or `@gergelyszerovay/package-manifest`, and their parser rejects it. reviewer2's parser,
`parseCitation` in `@gergelyszerovay/reviewer2-documents`, is the reference for the
syntax: it accepts this form and the TSDoc `{@link}` form, and gives the first rule a
text breaks. reviewer2 resolves a parsed citation with `resolveSymbolCitation` of
`@gergelyszerovay/reviewer2-declaration-graph` in its references layer. That resolver also
resolves the lib-scoped form. The resolver says where a citation points and
applies no access policy: whether a private citation is allowed is checked separately over the
generated manifest. A TSDoc citation of a name that is private to its library
(`{@link <package>/<lib>#<Name>}`, which has no private marker) is looked up among the library's
private declarations.

## Text that is not a citation

An inline code span with a `#` that doesn't parse is not a citation and isn't checked, so a
placeholder with angle brackets (`<package>#<Name>`), a file field (`package.json#name`) and
a document row (`roadmap.md#12`) are safe. A declaration key and an illustrative citation
of a made-up package parse, so they are written as plain text or in a fenced block
(see the conventions in [SKILL.md](../SKILL.md#text-that-only-looks-like-a-citation)).

## Rows

A row link (`[D21](/<path>.md#D21)` in Markdown, `{@link /<path>.md#D21 | D21}` in TSDoc) is a
link, not a symbol citation, so it is resolved as a link: by the repository manifest's references
layer (`resolveLink` of `@gergelyszerovay/reviewer2-repository-manifest`), which reads a path that
starts with `/` from the repository root, fragment included. The fragment is the row's key; a
document's row keys are anchors as its headings are. A TSDoc `{@link}` to a root path is read as a
path, resolved the same way, and is an edge from the declaration to the row.

What the architecture gate (`reviewer2-check`, which `pnpm --dir products/reviewer2 check:architecture` runs
for every workspace with bound packages) reports:

| Check                  | Reports                                                                                                                                                                                                                                                                      | Severity                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-resolution` | A row link whose document or key is gone (a renamed or removed row: "The link … resolves to nothing"), and a symbol citation that resolves to nothing or to more than one declaration                                                                                        | a `warning` for a link, an `error` for a symbol citation; an `info` prefixed `historical:` in a historical source (an implemented plan, a released changelog section) |
| `row-citations`        | A row link written with a relative path (a skill's link to a row of its own files excepted), a prose citation that names its document (`constitution D21`, `browser/file-tree R16`, `UC7`) for a key it has, and in TSDoc a key list `(I14, L1)` that one `@region` resolves | a `warning`; an `info` prefixed `historical:` in a historical source                                                                                                  |
| `private-citation`     | A resolved symbol citation of a private declaration from where "Private declarations" above does not allow it                                                                                                                                                                | an `error` at the citation                                                                                                                                            |

A warning or an error of a living file fails the gate; a `historical:` info does not. A source
under `.notes/` or `planning/notes/` (the person's notes) is historical for `reference-resolution` and not judged by `row-citations`;
a skill's `assets/` folder and the files of a template folder (a template and its examples) are not
judged by `reference-resolution` and `private-citation`.

**What is not checked.** A workspace's scope is its own folder plus the skills
(`packages/architecture-skills/skills/` and `.claude/skills`). A path outside it resolves as `external` and is
not judged, so a root link from one workspace into another (from `products/reviewer2/` into `products/lab/` or `products/three-demos/`,
from `products/three-demos/` or `products/lab/` into `products/reviewer2/`) is not checked, as a relative one would not be; nor is a link
into a folder the workspace's `.reviewermanifestignore` scope leaves out (a lab's `planning/`,
`artifacts/`, `discovery/`). Every workspace resolves and checks a link into the skills.

## Surfaces and library detection

Whether a symbol is on a library's public surface, and what counts as a
library root versus a grouping directory that merely contains libraries, is
determined by `@gergelyszerovay/declaration-graph2`'s scan of the package
(path-depth visibility, barrel/index-based visibility, and fractal-tree
feature visibility are all recognized layouts). The citation itself never
names a file — only the package, optional library id, and the declaration's
own name — because _that_ is what survives a move; consult
`reviewer/toolkit/declaration-graph2`'s own package docs for how a given
package's layout is scanned when you need that detail.

A library's `lib-id` is a canonical identity, separate from both its physical
location and its TypeScript import alias — resolve it by exact-match lookup
in the package's detected library table, never by reading it as a directory
path. `@gergelyszerovay/detect-lib-layout` derives it from the physical
location at detection time:

| Layout                     | Physical location           | `lib-id`                       |
| -------------------------- | --------------------------- | ------------------------------ |
| Nx-like                    | `libs/manifest-loading/src` | `manifest-loading`             |
| Nx-like, nested            | `libs/admin/users/src`      | `admin/users`                  |
| Nx-like, no terminal `src` | `libs/admin/users`          | `admin/users`                  |
| Path-depth                 | `libs/orders/checkout`      | `orders/checkout`              |
| Fractal-tree               | resolved feature directory  | exact `fractalTs.features` key |

The rule for `nx-like`/`path-depth` layouts: drop the leading structural
`libs` segment, then — for `nx-like` only — drop one trailing `src` segment;
every other segment (including one literally named `libs` or `src`) is kept
verbatim. `path-depth` libraries never drop a trailing `src` (`libs/orders/src`
stays `orders/src`). A fractal-tree library's id is always the exact
`package.json#fractalTs.features` key — never reconstruct it from the
feature's resolved source directory.

```
`@terv-dev/frontend:manifest-loading#loadManifest`   nx-like, terminal src stripped
`@terv-dev/frontend:admin/users#AdminUsersFacade`    nx-like, nested
`@terv-dev/frontend:checkout#Checkout`               fractal-tree feature key
```

A citation using a library's old, pre-normalization identity (e.g. a raw
physical path such as `libs/manifest-loading/src`, from before this
normalization existed) does not resolve — it fails as an ordinary unresolved
citation (`symbol-not-found`), the same as any other stale reference. There is
no automatic translation from an old identity to the current one.

## Implemented-behavior summary

| Behavior                                                           | Status                                                                                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<package-name>#<owner>` (public surface citation)                 | Implemented.                                                                                                                                                                    |
| `<package-name>:<lib-id>#<owner>` (library citation)               | Implemented.                                                                                                                                                                    |
| `owner.member` / `owner.member.member` (member path)               | Parsed and carried through resolution; **not type-checked**.                                                                                                                    |
| `owner/privateDeclaration` (private declaration)                   | Implemented — parser supports it; access gated per the table above.                                                                                                             |
| `owner/privateDeclaration.member`                                  | Implemented (member rules on privateDeclaration same as on owner).                                                                                                              |
| Cross-package private citation                                     | Always rejected (`private-access-denied`).                                                                                                                                      |
| Same-package private citation from a root/group-tier doc           | Rejected (`private-access-denied`).                                                                                                                                             |
| Same-package private citation from a package/library-tier doc      | Allowed.                                                                                                                                                                        |
| TSDoc form `{@link <package>/<lib>#<Name>}`                        | Parsed by TSDoc (`tsdoc/syntax`); resolved by reviewer2's references layer, not by `declaration-graph2`.                                                                        |
| Row link `[D21](/<path>.md#D21)` / `{@link /<path>.md#D21 \| D21}` | Resolved from the repository root by `resolveLink`; a key that is gone is a `reference-resolution` finding; a relative or prose row citation a `row-citations` finding.         |
| Citation in free text (a terminal line)                            | Found by `findCitations` of `@gergelyszerovay/reviewer2-documents/citation`: the grammar's own pattern, every match accepted by `parseCitation`; the TSDoc form is not matched. |

## Future work — not yet implemented

These are proposals, not current capabilities. Do not write documentation or
tooling that assumes them:

- A dedicated disambiguation syntax for a same-name private declaration
  collision beyond the existing `owner/privateDeclaration` qualification.
- Reverse-direction (source → doc) citations, i.e. code pointing back at the
  documentation that describes it.
- A configurable source-root convention beyond whatever
  `@gergelyszerovay/declaration-graph2`'s own package docs currently document
  for locating a package's source root.
