# Product documents

What each group-level document holds, when to write it, and how the documents connect to
code and specs (constitution [D1](../product-profile.constitution.md#D1)–D8). The templates are in this skill's `markdown-schema-templates/`; use the
layered-documentation-authoring skill for file placement and naming, and the
markdown-schema skill to fill and validate them.

## The group tree

A group is a directory holding the packages of one product (for example `products/reviewer2/`).
The group directory is itself a private workspace package (D25): its `package.json` has no
dependencies, binds the group to this profile, and holds scripts that run the whole
product:

```json
{
  "name": "@scope/reviewer2",
  "private": true,
  "architecture": { "profile": "product-profile" },
  "scripts": { "dev": "…", "test:e2e": "…" }
}
```

Register it in `pnpm-workspace.yaml` like any package. Tools that assign files to the most
specific containing package keep each inner package's files with that package; files
directly under the group (its docs and plans) belong to the group package. A package
whose root contains other workspace packages is a group, so its `layered-docs/` tree is a
group tree.

Its documentation is the group's `layered-docs/` tree:

```
<group>/layered-docs/
  1.index.md                                  # links every document below
  2.<group>.constitution.md                   # constitution skill's template, Kind: product
  2.<group>.product-group.md
  2.<group>.product-brief.md
  2.<group>.domain-model.md
  2.<group>.permission-matrix.md              # only with more than one role
  2.<group>.information-architecture.md       # only with a UI
  2.<group>.<place>.<region>.region.md        # one per region that needs more than a line
  2.<group>.use-case-registry.md
```

Write only the documents the product needs (D23). Once a group has more than one package,
the index, the constitution and the `product-group` doc are the minimum. A single-package
product with one role and a handful of use cases may need no more than the constitution
and the use-case registry.

## One home per fact

| Fact                                                                                                 | Home                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Requirements, non-goals, product-wide decisions                                                      | group constitution                         |
| Package roles, allowed dependencies between packages, glossary                                       | `product-group`                            |
| Problem, audiences, outcomes                                                                         | `product-brief`                            |
| Objects, relationships, core attributes                                                              | `domain-model`                             |
| Roles and who may do what, and where it's enforced                                                   | `permission-matrix`                        |
| Places, regions, navigation, modes, commands, wireframe links                                        | `information-architecture`                 |
| A region's structure, states, interactions, rules, limits and messages, with their reasons           | its `region` document                      |
| Use cases, their journeys and extensions                                                             | `use-case-registry`                        |
| The steps of a use case                                                                              | the journey's `test.step` titles           |
| A package's own boundaries and decisions                                                             | the package's doc (its architecture skill) |
| The package graph, the journey catalogue, which places and libraries a journey touches, walkthroughs | generated on demand, never committed       |

## The documents

- **`product-group`**: one row per package with its role and the group packages it may
  depend on; the `package-allow-list` rule reads it. A package's architecture profile is
  its `package.json` binding, and its actual dependencies are derivable, so neither is
  repeated. Neither is each package's responsibility: that is its package doc's summary
  line. A dynamic view of this document shows all of them together (see below). The
  glossary holds terms a newcomer would get wrong; domain objects are defined in the
  domain model instead.
- **`product-brief`**: the problem in prose, the audiences with what they need (and,
  where useful, a need the product deliberately doesn't serve), and outcomes with a
  measure and a target. Scope limits are the constitution's non-goals.
- **`domain-model`**: the object map. Objects are named as users say them, and code,
  UI labels and page-object methods follow those names. Each object's owner is the package
  holding its authoritative records. Actions on objects are in the permission matrix.
- **`permission-matrix`**: one row per object, action and role, including the visitor
  without a session. The refine rule requires a row for every role of every object action,
  so no cell is implicit. `own` means only on records the user owns. `Enforced by` names
  the package whose check is authoritative; client checks only shape the UI. Per-role
  authorization tests (for example one database policy test per cell, in the Supabase
  skill) iterate over these rows.
- **`information-architecture`**: the places a user can be, with their route, purpose
  and the objects they show; the regions inside a place that a user moves between; the
  navigation between them (`N`: from, to, by what gesture, carrying what); the modes that
  more than one region reads (`M`); the command palette's commands (keyed by their id); and
  links to wireframes kept elsewhere. Each row is keyed so region documents, journeys and
  specs cite it (D32). Page objects are named after places and regions.
- **`region`**: a region whose behaviour takes more than the information architecture's one
  line, such as a picker with a tree, paging and loading states. See "Regions" below.
- **`use-case-registry`**: each use case reads "As <actor>, I want to <goal>, so that
  <benefit>", and names the journey that is its main success scenario. Extensions list
  alternative and failure paths, each covered by an end-to-end spec, a unit spec
  (`<package>:<lib>#<slug>`) or `review`. The steps are never written here: they are the
  journey's step titles, and walkthroughs are generated from them.

## Regions

The information architecture names a region and says in one line what it shows. When a
region's behaviour needs more (an order, a limit, paging, states that must not resize it,
keyboard handling) it gets a region document (D29), named after its ID:
`2.<group>.<place>.<region>.region.md`. A region shared by every place, such as a header,
belongs to a place of its own (`app-shell`, route `none`).

The document holds the requirements and their reasons, in keyed rows so a single one can
be cited (`2.reviewer2.app-shell.revision-picker.region.md#R2`):

| Section      | Rows                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure    | `S`: the element tree, one row per kind of element: its ARIA role and name, its parent, what it shows, binding layout constraints, what selecting it does |
| States       | `T`: first load, refreshing, empty, error, stale: what each shows, and whether the size may change; each cites by S key the elements it changes (D35)     |
| Interactions | `I`: each input and its effect                                                                                                                            |
| Rules        | `R`: ordering, sizes, anything a change must keep, with **Why**, **Checked by** and an optional **Topic**                                                 |
| Limits       | `L`: the numbers the region keeps, each the home of a constant in code (`@region <place>/<region> L3` in its TSDoc), with the value and the reason        |
| Messages     | `W`: the copy the region shows, exact, with when it shows; a Shows cell or a States row cites the row instead of quoting the text                         |
| Limitations  | what it deliberately doesn't do yet, with the roadmap item that will                                                                                      |
| Wireframes   | a sketch or a picture, its elements called out by their S keys (`[S4]`); screenshots once built                                                           |

**Cross-region references are links.** A row of another region document, of the information
architecture or of any other document is cited as the citations skill's **Rows** says: a link
from the repository
root with the key as its text, `[I5](/products/reviewer2/layered-docs/2.reviewer2.browser.editor.region.md#I5)`,
in Markdown and in TSDoc (`{@link /… | I5}`); the prose form `(browser/editor I5)` is not
written, because nothing can check prose and the manifest's reference check reports a renamed
or removed row. The keys `L` and `W` join `S`, `T`, `I`
and `R`; keys are unique across the document (D40).

**Code points to the region.** The behaviour of one region is usually decided in several
places: a UI component, a facade, a backend use case, a port. Each of those declarations
carries `@region <place>/<region>` in its TSDoc (declare the tag in the package's
`tsdoc.json`), and its TSDoc keeps only what is local to the code. When the region is only
a part of a component's template, that element carries `data-region="<place>/<region>"`
(a bare `<region>` is accepted when no other place has a region of that name); extract a
component instead when the part is worth one for its own sake. A region ID resolves to the
region document of the group whose title is that ID, or, for a region without a document, to
the information architecture that lists it. A tool can then list, for a
region, every declaration that implements it, and for a declaration, the regions and
rules it serves.

**Structure is the accessibility tree.** Each Structure row names the element's ARIA role and
accessible name and its parent, so the rows form the tree a user agent exposes and page
objects locate by (D15). Only layout constraints that are requirements go in its Layout
column, each pointing to the rule with the reason; styling that needs no reason stays in
the code, and screenshots are the visual record.

**Overviews are derived, never drawn by hand.** The rows already hold the views a designer
reads a specification through, so a tool derives them (D28): the element tree and a
low-fidelity wireframe from the Structure rows (Parent nests them, Role decides a box's style,
Layout its placement when it uses the placement words the template's guide lists, `—`
stacking it), the state matrix from the States rows and the S and R keys their cells name (its
element rows come from the S keys every state cites, D35; an element named in words only has no
row), and
the interaction map from the Interactions rows grouped by the element their input names, with
the information architecture's Navigation rows and Commands for the region. Two things are
authored for them: the Rules' optional **Topic** column, a short noun (drawing, keyboard,
selection, operations, read-only, paging) by which a view folds the rules, untopiced ones last;
and the callouts of a hand-drawn sketch, each element carrying its S key in brackets (`[S4]`),
so the sketch and the table name the same thing. A sketch is kept beside the derived wireframe
only while it says more; reviewer2's region view (its editor's R41) is one such tool.

**Citing rows from specs.** A spec names the region rows it checks in a `covers` list of
`<document>#<key>` entries: `meta.covers` in a unit spec, and an annotation of type `covers`
per row in a journey. `<document>` is the region document's file name, found among the
group's documents (or a path relative to the spec file when it holds a `/`), and `<key>` one
of its row keys. That is the only link from a row to its tests; the row's **Checked by**
says only which kind of check it has. An entry may interpolate a module-level string constant
(`` `${REGION}#R8` `` over `const REGION = '…'`), which is read as part of the literal; any
other expression is not read, and the manifest reports the entry as unreadable.

**Checking a rule.** `spec`: a unit spec checks it and names the row in `covers`.
`journey`: an end-to-end journey covers it; the Structure rows, being the accessibility tree,
are checked by a journey step with Playwright's `toMatchAriaSnapshot`, whose `covers` names
the S rows it checks. `visual`: styling such as a fixed size or an
overlay that must not reflow is not worth a unit test; the plan that builds it checks it by
eye and puts screenshots in its implementation notes. `review`: everything else.

**Before it is built.** A region document is written when the design is decided, usually
together with the plan that builds it (planning skill), and describes the committed target
from then on. Undecided points go in an **Open questions** section of its own until they
are settled; uncommitted ideas stay in planning documents.

## Planned and built

The product documents describe the committed target product (constitution [D27](../product-profile.constitution.md#D27)): every
row is in scope, whether or not it is built yet. Ideas that aren't committed stay in
planning documents.

Whether a row is built is never written by hand. It is derived through the row's link to
code or tests, and generated views and reviewer2 show it:

| Row           | Link                                                 | Built when                                                                   |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Use case      | Journey slug                                         | its journey is implemented (a `test.fixme` skeleton means planned)           |
| Extension     | Covered by                                           | its spec is implemented, or it is covered by `review`                        |
| Place         | Route, and page objects whose `@place` names it      | the route exists in the app's route map                                      |
| Region        | page objects whose `@place` names `<place>/<region>` | a page object covers it                                                      |
| Region rule   | `@region` declarations; specs citing the row         | a declaration implements the region and, for `spec`, its spec is implemented |
| Package       | Package name                                         | the package exists in the workspace                                          |
| Domain object | Modeled by                                           | the cited declaration exists; an empty cell means planned                    |

Rows that describe the problem rather than a feature (audiences, outcomes, the glossary,
relationships and attributes) have no built state. Decisions that aren't built yet are
marked `pending` in the constitution, because most are checked in review and nothing can
derive their state.

With fast-forward coverage, a planned use case gets its journey skeleton when it is added
to the registry, so the registry and the coverage report show the same planned work.

## Dynamic docs

Authored documents hold only what nothing else holds (D21). A dynamic doc is a view,
generated on demand and never committed, that joins an authored document with the facts
derived about it: for example `product-group` with each package's responsibility (from its
package doc), profile, public API and actual dependencies, and whether each row is built
(constitution [D28](../product-profile.constitution.md#D28)). The units a dynamic doc joins are the product's surfaces (D30): a
region, a tool, a procedure, a command, a table. This is a concept only: the view mechanism,
sources and rendering are not decided yet. The current ideas are in reviewer2's `.notes/docs/tooling.md`, the person's notes.

## Traceability

| From            | To                 | Through                                                        |
| --------------- | ------------------ | -------------------------------------------------------------- |
| use case        | journey            | the registry's Journey slug and the spec's `spec` annotation   |
| journey         | places and regions | the page objects it uses, through their `@place` tags          |
| page object     | library            | its `@drives` tag, citing the container it drives              |
| region          | code               | the `@region` tags and `data-region` attributes that name it   |
| region rule     | spec               | the spec's metadata citing the row                             |
| permission cell | authorization test | the cell's object, action and role                             |
| domain object   | code               | its Modeled by citation; names in code and UI follow the model |

The refine rules check each document on its own. Checks across documents (an actor that
isn't a role, a page object whose place isn't listed, a registry journey with no spec)
belong to reviewer2's checker and are `planned` in the profile until it exists.
