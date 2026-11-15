---
name: architecture-docs-and-specs
description: Document and specify a package that follows a block architecture (Node, Angular, three.js): which fact goes in code, TSDoc, a layered doc or a spec; lib and package docs; behaviour tags; spec kinds, slugs, phase metadata, skeletons and fast-forward coverage. Use when writing or reviewing a lib or package doc, TSDoc behaviour tags, or unit specs in such a package.
metadata:
  version: '0.1.1'
---

# Architecture docs and specs

The documentation and spec conventions that the block-architecture skills share. The rules
are decisions in each architecture's constitution (Node D35–D51, Angular D26–D41, three.js
D46–D56); this skill explains them once. The architecture skill supplies what differs per platform: its
doc templates, its behaviour tags, which spec kind each block gets, and the test runner's
setup (node-block-architecture's `references/documentation-and-testing.md`,
angular-block-architecture's `references/documentation-and-testing.md` and
`testing-setup.md`, three-block-architecture's `references/documentation-and-testing.md`).

Documentation is built on layered-docs and markdown-schema: use the
layered-documentation-authoring skill to place and name files, and the markdown-schema
skill to fill and validate templates. Product-level documents and end-to-end journeys
belong to the product-profile skill.

## Where each fact lives

Every fact has exactly one home, chosen by who can produce it:

| Fact                                                                                                      | Home                                                                             |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Derivable from code: exports, blocks, dependencies, wiring, routes, provider scopes                       | Generated on demand by tools; never written by hand or committed                 |
| About one declaration                                                                                     | TSDoc on that declaration                                                        |
| Spanning files, and not expressible in code: responsibility, boundaries, ownership, decisions             | An authored layered-docs doc                                                     |
| Behaviour: scenarios, edge cases, invariants                                                              | Specs                                                                            |
| What a UI region shows and does, and why: its structure, states, interactions, rules, limits and messages | The region's document (product-profile skill, "Regions"); code carries `@region` |

Don't repeat a fact in a second home: a doc never lists what a TSDoc tag or the code
already says. UI behaviour usually spans a component, a facade and a backend use case, so
its home is the region the user sees, not any one declaration. A behaviour change shows up as an edited spec, invariant or decision, not as
a changelog entry; git is the changelog. (A published package and a skill are the exception: what a
consumer of a version would notice goes into its `CHANGELOG.md`, see the `changelog` skill.)

## Levels

| Level                                 | Authored                                                                     | Template                               |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| Group (a product of several packages) | constitution, boundaries between packages, glossary                          | the product profile's templates        |
| Prototype (a lab's)                   | purpose, origin, how to run it, status, optionally structure, decisions      | the `lab` skill's `prototype` template |
| Package                               | boundaries, approved packages or provider scopes, rule exceptions, decisions | the architecture's package template    |
| Lib                                   | responsibility, boundaries, ownership no tag declares, decisions             | the architecture's lib template        |
| Block                                 | required TSDoc tags                                                          | none                                   |

- A feature is a lib; there is no separate feature level.
- A prototype's one doc is the strict subset of the package doc: the package template carries its
  sections as optional sections, so promoting the prototype rebinds the doc and `validate-md` names
  the sections the package still needs (`1. Boundaries`).
- Each lib's doc is the single doc of the lib's own `layered-docs/` tree
  (`1.<name>.<template>.md`), so it moves with the lib. Install the architecture's
  templates into a template tier the docs resolve from.
- Decisions use the constitution skill's table form. A package gets a constitution of its
  own only when it has decisions of its own.
- Cite declarations as the citations skill's **Symbols** says: `<package>:<lib>#<Name>`, or
  `<package>:<lib>#/<Name>` for a lib-private declaration.
- Cite a row of a document (a decision, a region's rule) from a doc or from TSDoc as the
  citations skill's **Rows** says: a link from the repository root
  with the key as its text, `{@link /products/reviewer2/layered-docs/2.reviewer2.constitution.md#D21 | D21}`
  in TSDoc, never prose such as `constitution D21` or `(I14, L1)`. A declaration of a region
  keeps its bare `@region <place>/<region>` and links the rows it implements.

## Behaviour tags

Stateful and asynchronous blocks declare their behaviour (ownership, lifetime, cleanup,
concurrency, failure) as plain TSDoc block tags on their primary declaration. A file has
one primary declaration (the source-organization skill's declaration policy), so each tag
has exactly one owner.

- The profile lists the required tags per block; a tag with a fixed value set starts
  with one of its values (`@lifetime process — …`). The architecture-profile skill's
  `check-tsdoc-tags.mjs` checks presence and values.
- Declare the custom tags in `tsdoc.json` next to the package's `tsconfig.json`, or
  `tsdoc/syntax` rejects them:

  ```json
  {
    "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
    "tagDefinitions": [{ "tagName": "@failure", "syntaxKind": "block" }]
  }
  ```

- Writing a tag is a design check. A `@failure` that says "swallowed" or "only logged",
  or a `@reset` that has to say "never cleared as a whole", often points at a gap worth a
  spec or a decision.

## Specs

Specs are the documentation of behaviour. Each declares a **kind** and a **slug**:

| Kind        | Is                                       | Structure                                                          |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `scenario`  | a caller- or user-visible behaviour      | arrange, act, assert, with exactly one act                         |
| `edge-case` | behaviour at a boundary or under failure | as `scenario`                                                      |
| `invariant` | a rule that holds for all inputs         | a statement in the title, plus an example table or a property body |

- **No `regression` kind:** a fixed bug adds the invariant or edge case it revealed. "Use
  case" is reserved for product use cases, whose main scenario is an end-to-end journey
  (the product profile's `journey` kind).
- **Slugs** are unique among the lib's spec declarations and cited as
  `<package>:<lib>#<slug>`. A spec declared once and run several times (a port's contract
  suite against its fake and each adapter, or an `it.each` row) shares its slug; the suite
  name or the row tells the runs apart.
- **Metadata is literal:** the kind is a Vitest tag, and `meta` holds the slug and, for
  scenarios and edge cases, the three phase descriptions, so they appear in the JSON
  report for implemented, skipped and todo specs alike.
  A spec that checks rows of a product's region document also lists them in `meta.covers`
  (`['2.reviewer2.graph.graph-canvas.region.md#R2']`; product-profile skill, "Regions").
  A module-level string constant interpolated into the literal (`` `${REGION}#R2` `` over
  `const REGION = '…'`) is read as part of it; any other expression (a concatenation, an
  imported name, a call) is not, and the manifest reports the field as unreadable.
- **Phases in the body** are bare labeled blocks, `arrange:`, `act:` and `assert:`, with
  exactly one `act`. Values shared between phases are declared with `let` before
  `arrange`; shared setup goes in a local `setUp` function, and what it starts is released
  in `afterEach`. Turn off ESLint's `no-unused-labels` for spec files and contract suites.

```ts
it(
  'a folder added by a live update starts collapsed',
  {
    tags: ['edge-case'],
    meta: {
      spec: 'new-folders-start-collapsed',
      arrange: 'the user expanded the `src` folder',
      act: 'a live update adds a `test` folder',
      assert: '`test` is collapsed and `src` stays expanded',
    },
  },
  async () => {
    let tree: TreeHarness;
    arrange: {
      tree = await renderTree(groupsWith('src'));
      await tree.click('src');
    }
    act: {
      await tree.setGroups(groupsWith('src', 'test'));
    }
    assert: {
      expect(tree.isExpanded('test')).toBe(false);
    }
  },
);
```

### Skeletons and fast-forward coverage

- A spec written before its code is a **skeleton**: `it.todo(title, { tags, meta })` with
  its full metadata, phase descriptions included. Implementing it turns `it.todo` into
  `it` and adds the body; the metadata stays.
- Coverage rules are enforced per lib, and by default only implemented specs count: a todo
  for code that already exists hides a gap.
- **Fast-forward:** a package that declares `"coverage": "specified"` in the
  `architecture` binding of its `package.json` lets skeletons satisfy coverage, and the
  coverage report lists each one as debt. Switching back to `"implemented"` turns every
  remaining skeleton into a coverage failure.

## Checks

- `validate-md <path>` on every authored doc or its folder (it binds each doc to its
  template; `--template <t> <doc>` only for a doc outside any catalog).
- `check-tsdoc-tags.mjs` from the architecture-profile skill.
- Vitest's `strictTags` and the spec-kind type augmentation (the architecture skill shows
  its setup).
- Coverage and spec-structure checkers where the profile marks them enforced; `planned`
  rules are checked in review until then.

## Changing these conventions

The rules live in both architectures' constitutions. A change to one of them (a spec kind,
the slug rule, the phase metadata, fast-forward) is made in both constitutions and in this
skill in the same change, with an entry in each skill's `CHANGELOG.md` (the `changelog` skill).
