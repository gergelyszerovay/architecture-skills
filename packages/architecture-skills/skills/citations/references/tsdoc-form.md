# TSDoc form

How a citation is written inside a TSDoc comment: a symbol citation, then a row. The grammars
and the Markdown forms are in the citations skill's `SKILL.md`.

## A symbol

**In scope or not.** Most references in a TSDoc comment aren't citations. When the
declaration is in scope in the file (declared there or imported), write a plain
`{@link Name}` (`{@link LIVE_STREAM_GRACE_PERIOD_MS}`): TypeScript resolves it, the IDE
follows it, and a rename updates it. Use the citation form below only when the
declaration isn't in scope and can't be imported, for example:

- a declaration in another package that this package mustn't depend on, such as an
  end-to-end page object's `@drives` tag citing the frontend container it drives;
- another library's lib-private declaration;
- a declaration a tool must resolve by name, from a tag its checker reads.

Imports, code and test names never use citations.

Inside a TSDoc comment, a citation is written as a standard `{@link}` declaration
reference, never as bare text or inline code. A bare scoped package name starts a new
TSDoc tag (`@terv-dev` after `@drives` is parsed as a tag), and inline code hides the
reference from TSDoc tools. TSDoc's declaration-reference grammar has no `:`, so the
library goes in the reference's import path:

```text
@terv-dev/frontend#favoritesKeys                       {@link @terv-dev/frontend#favoritesKeys}
@terv-dev/frontend:cart#injectCartResource             {@link @terv-dev/frontend/cart#injectCartResource}
@terv-dev/frontend:domain/cart#CartEvents.lineAdded    {@link @terv-dev/frontend/domain/cart#CartEvents.lineAdded}
@terv-dev/frontend:checkout#/CheckoutFacade            {@link @terv-dev/frontend/checkout#CheckoutFacade}
```

(Markdown citation on the left, TSDoc form on the right.)

```ts
/**
 * The shelf's tool list.
 * @drives {@link @toolshed/web/shelf#ToolListContainer}
 */
```

- The mapping is one to one: `<package>:<lib>#<Name>` ⇄ `package/lib#Name`. The import path
  is always a lib id, never a package subpath export; our resolver reads it that way,
  while generic TSDoc tools (API Extractor, TypeDoc) would look for an entry point and
  may not resolve it.
- The lib-scoped private marker `#/` has no TSDoc equivalent and is dropped: the lib is
  explicit, and whether the declaration is exported is derivable from the lib's public
  entry.
- The owner/private form (`#owner/privateDeclaration`) has no TSDoc form; cite the
  private declaration through its lib instead (`package/lib#privateDeclaration`).
- `tsdoc/syntax` rejects a malformed reference, such as one that keeps the `:`.
- The slash form is valid only inside `{@link}` in TSDoc. In Markdown the forbidden forms
  in `SKILL.md` still apply.

## A row

A row of a document is cited in TSDoc by the same root link as in Markdown, as a `{@link}` with
the key as its text (the citations skill's **Rows**):

```ts
/**
 * Keeps the selection while the tree reloads, as the file tree's
 * {@link /products/reviewer2/layered-docs/2.reviewer2.browser.file-tree.region.md#L1 | L1} asks.
 */
```

- The target is the document's path from the repository root, then `#` and the key; the text after
  `|` is the key. A row of a file in the same folder is still written from the root: a TSDoc comment
  has no Markdown file to be relative to.
- `@region` stays bare (`@region browser/file-tree`): it names a region, not a row.
- **The wrapper.** The TSDoc parser rejects every `{@link}` target that starts with `/`
  (`tsdoc-reference-malformed-import-path`, or `tsdoc-reference-missing-hash` without a `#`), and
  `@microsoft/tsdoc` has no setting to silence one message. The architecture-profile skill's
  `eslint-rules.cjs` exports `tsdocSyntaxPlugin(tsdoc)`, which takes the package's
  `eslint-plugin-tsdoc` and returns a plugin whose rule is `tsdoc/syntax` except for a root link's
  target (`/<path>.<extension>`, optionally `#<key>`, then nothing or one `| text`). Register it and
  use its rule in place of `tsdoc/syntax`:

  ```js
  import tsdoc from 'eslint-plugin-tsdoc';
  import { tsdocSyntaxPlugin } from '@gergelyszerovay/architecture-skills/eslint-rules.cjs';

  export default [
    {
      plugins: { 'architecture-skills': tsdocSyntaxPlugin(tsdoc) },
      rules: { 'architecture-skills/tsdoc-syntax': 'error' }, // replaces 'tsdoc/syntax'
    },
  ];
  ```

- A prose row citation in a comment (`constitution D21`, or a parenthesised key list `(I14, L1)`
  that one `@region` resolves) is a `row-citations` finding, as in Markdown.
