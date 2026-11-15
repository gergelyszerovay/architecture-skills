# Journeys and the end-to-end package

How a group's end-to-end specs are written (constitution [D9](../product-profile.constitution.md#D9)–D19, D24, D26, D34). The checkable
parts (blocks, required tags, spec kinds) are in [product-profile.architecture-profile.md](../product-profile.architecture-profile.md). The
conventions assume Playwright 1.42 or later, for `tag` and `annotation` in test details;
check the installed version before copying an example.

## What goes end to end

Only what needs the integrated system (D13): the live connection between packages,
routes, several containers working together, real layout and scrolling, keyboard focus
moving between regions. Lib-level scenarios stay in unit specs, and timing-sensitive races
stay where timing is controllable.

| Kind        | Is                                                        | Structure                                                  |
| ----------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `journey`   | a use case's main success scenario                        | exactly one `Given`, then `When` and `Then` steps in order |
| `scenario`  | whole-system behaviour outside a use case (layout, focus) | `Given` steps, exactly one `When`, `Then` steps            |
| `edge-case` | whole-system behaviour at a boundary or under failure     | as `scenario`                                              |

Aim for one journey per user goal, typically three to six per group (D14). Each use case
in the registry names its journey, and each extension names a spec or `review` (D19).

## The package

One private package per group, `<group>/e2e`, next to the packages it tests, because a
journey runs the whole product. It binds to this profile:

```json
"architecture": { "profile": "product-profile" }
```

Each block kind has its own folder at the package root (D24, checked by
`block-placement`):

```
<group>/e2e/
  package.json          # private, bound to this profile
  playwright.config.ts  # starts the system; JSON reporter; artifacts on failure only
  tsdoc.json            # @place, @drives, @world
  specs/                # *.spec.ts: journeys, scenarios, edge cases
  page-objects/         # *.page-object.ts, one per place or region
  seeds/                # *.seed.ts, one named start state each
  fixtures/             # *.fixture.ts: the running system, a fresh seed copy per test, page objects, annotate
```

The package has no `libs/` and no package-level doc. Run it as a task of its own,
depending on the builds of the packages it starts, and keep it out of the fast unit-test
task and the pre-commit checks.

| Block             | Holds                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `.page-object.ts` | one place or region: locators by role and accessible name, methods in the product's vocabulary |
| `.seed.ts`        | one named start state, and how to create it                                                    |
| `.fixture.ts`     | Playwright fixtures: the running system, a fresh copy of a seed, page objects                  |
| `.spec.ts`        | journeys, scenarios and edge cases                                                             |

Specs import fixtures and page objects, never raw locators (D16): `page.locator`,
`getByRole` and the like live in page objects only. A fixture file exports its extended
`test`; specs import `expect` from `@playwright/test`.

## Spec shape

```ts
test(
  'borrow a tool',
  {
    tag: ['@journey'],
    annotation: { type: 'spec', description: 'borrow-a-tool' },
  },
  async ({ app, seed }) => {
    await test.step('Given a member and a drill on the shelf', async () => {
      await seed.start('member-and-drill');
      await app.signIn('member');
    });
    await test.step('When the member borrows the drill', async () => {
      await app.shelf.open('Drill');
      await app.tool.borrow();
    });
    await test.step('Then the drill is on their loans, due in seven days', async () => {
      await expect(app.myLoans.items()).toHaveText(['Drill, due in 7 days']);
    });
  },
);
```

- **Metadata** is literal (D11): one kind tag, and a `spec` annotation whose slug is
  unique in the group, cited as `<group>#<slug>`.
- **Steps** are `test.step` calls with literal titles starting with `Given`, `When` or
  `Then`, in that order (D12). The titles are the use case's steps: they appear in the
  trace viewer, the HTML report and the JSON report, and walkthroughs are generated from
  them.
- Playwright can't restrict tag names by type; the `spec-structure` checker will.

## Skeletons

A spec written before its code is a **skeleton** (D12): an ordinary `test` with its full
metadata and its steps with empty bodies, ending with `test.fixme(true, "skeleton")`.

```ts
test(
  'borrow a tool',
  {
    tag: ['@journey'],
    annotation: { type: 'spec', description: 'borrow-a-tool' },
  },
  async () => {
    await test.step('Given a member and a drill on the shelf', async () => {});
    await test.step('When the member borrows the drill', async () => {});
    await test.step('Then the drill is on their loans, due in seven days', async () => {});
    test.fixme(true, 'skeleton');
  },
);
```

- **Why not `test.fixme` as the outer call:** that form never runs the body, so the step
  titles don't reach the JSON report. Called last inside the body, `test.fixme` still gives
  the test Playwright's fixme status, and the empty steps, which run instantly, are
  reported with their titles.
- **The description is always `"skeleton"`.** It is what tools look for (a `fixme`
  annotation described `skeleton`), and it tells a skeleton apart from an implemented test
  that someone marked `fixme` because it is broken.
- **The body requests no fixtures.** The body runs, so any fixture it names is set up,
  which for an end-to-end fixture means starting real work. Hooks such as `beforeEach` in
  the same file run too; keep them cheap, or keep skeletons in files without them.
- **Implementing a skeleton** means filling the step bodies, requesting the fixtures they
  need, and removing the `test.fixme` line. The metadata and step titles stay.
- **Coverage:** by default only implemented specs satisfy coverage. An e2e package that
  declares `"coverage": "specified"` in its profile binding (fast-forward, D26) lets
  skeletons satisfy it, and the coverage report lists each one as debt.

## Page objects

```ts
/**
 * The shelf's tool list.
 * @place shelf/tool-list
 * @drives {@link @toolshed/web/shelf#ToolListContainer}
 */
export class ToolListPageObject {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Opens a tool by its name. */
  async open(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click();
  }
}
```

One page object per place or region of the information architecture (D15), named after
it. `@place` names what it covers by its information-architecture IDs: `shelf` for a
whole place, `shelf/tool-list` for a region. That link lets tools derive whether a place
or region is built, and which places a journey visits. `@drives` cites the container the
page object drives as a `{@link}` in the citations skill's TSDoc form
(`package/lib#Name`), so following journey → page object → container → library shows
which libraries a journey touches.

## Seeds

A seed is a named start state whose `@world` tag describes the state a `Given` refers to
(D17). Each test gets a fresh copy and removes it on teardown, so tests never see each
other's changes:

- for a Git-backed tool, a tag per seed and a new worktree per test;
- for a database-backed product, a seed script per state and a fresh schema or
  transaction per test.

```ts
/**
 * @world One member, Ada, and one drill on the shelf, not lent out.
 */
export const memberAndDrill: Seed = { name: "member-and-drill", create: async (db) => { … } };
```

Teardown that removes a copy (removing a worktree, dropping a schema) can fail for
reasons outside the test, such as a lock or a still-open handle. Don't let that fail an
otherwise passing test, and don't swallow it either: log it, and attempt a fallback
cleanup (deleting the directory, dropping the schema directly).

## Configuration

Declare the custom tags in `tsdoc.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "tagDefinitions": [
    { "tagName": "@place", "syntaxKind": "block" },
    { "tagName": "@drives", "syntaxKind": "block" },
    { "tagName": "@world", "syntaxKind": "block" }
  ]
}
```

In `playwright.config.ts`, keep screenshots and traces on failure only (D18), and write a
JSON report, which records each test's tags, annotations and steps for documentation and
coverage tools. The region annotations ([below](#annotating-a-region)) are not failure
artifacts: they are attachments of passing steps, written on every run.

```ts
export default defineConfig({
  reporter: [['list'], ['json', { outputFile: '<path>/e2e.json' }]],
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
```

**Seed state before the system starts.** When the system under test needs the seeds at
startup (for example a backend given a repository or a database), let the `webServer`
command that starts it create the seed state first, in the same shell command, and write
where it is to a file the fixtures read. Don't rely on the relative order of `globalSetup`
and `webServer`, which is easy to get wrong across Playwright versions. `webServer`
entries start in parallel; only the test run waits for all of them.

## Annotating a region

A region's screenshot is derived, never pasted (D34): the step that asserts a region's state
calls the package's `annotate` fixture where it stands, and the fixture draws the region
document's Structure rows on the running UI. It asserts nothing: the ARIA snapshot stays the
check of structure (D29), and the picture is the evidence beside it. Call it after an
assertion that waits for the region (`toBeVisible`, `toHaveText`, an ARIA snapshot): the
fixture does not wait for a state, it only gives a region still rendering a moment (about a
second and a half) before it answers `hidden`.

```ts
await test.step('Then the drill is on their loans, due in seven days', async () => {
  await expect(app.myLoans.items()).toHaveText(['Drill, due in 7 days']);
  await annotate('member/loans', { state: 'T2', root: app.myLoans.root() });
});
```

**The contract.** `annotate(region, { state?, root? })`:

- `region` is the region's id, `<place>/<region>`; its document is the one named
  `<…>.<place>.<region>.region.md` in the group's `layered-docs/` (the `regionDocuments` option
  names another folder). A region without a document is answered `no-document`, with no shot.
- `state` is the key of the T row the step is in; without it the state is the default one.
- the scope is every element that carries `data-region="<place>/<region>"`, together with
  `root`, the region's root from its page object (a `root()` method): `root` is required when no
  element carries the attribute, and adds the region's container when only its parts carry it.
  A scope with nothing shown is answered `hidden`, with no shot.
- each Structure row is located inside the scope by its Role cell (the grammar below), drawn as
  a box with its key in a callout, in one fixed-position overlay appended to `body` (nothing
  reflows) and removed after the shot;
- the screenshot is the scope's box with a margin, and the files are
  `test-results/regions/<place>/<region>/<state>.png` and `<state>.json` (`default` for the
  default state), both attached to the test as `regions/<place>/<region>/<state>.png` and
  `.json`, so the Playwright report shows them; the `regionResults` option names another folder
  than `test-results/regions/`, and `regionAttachments` another first segment than `regions` for
  the attachments' names (the fixture's own tests use both, to keep their sample regions apart
  from the product's; see the paragraph on them below);
- the file under `test-results/regions/` is the last annotation of that region and state in the
  run: when two tests annotate the same one, the later overwrites it. The report's attachments
  pair each annotation with the test that made it, so a reader that needs the test reads them;
- the JSON holds the region, the state (`null` for the default), the journey's slug (its `spec`
  annotation) and the test's title, the document's path, the outcome (`annotated`, `hidden`,
  `no-document`, or `failed` with an `error` when the page could not be read), the scope, the
  screenshot's file name and its rectangle on the page, the pixel ratio, and per row its key,
  its Role cell, its boxes (relative to the screenshot) and its status: `found`,
  `representative`, `not-located` or `absent`.

A failing locator never fails the step: the fixture records the row and moves on, and
`annotate` never throws. A row absent in the state is the expected answer for the dialogs,
menus and overlays a state does not show.

**The Role grammar** the fixture reads:

| Role cell                                                               | Located as                                                                               | Status                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| `none`, or a cell starting `none:`                                      | nothing: the element has no role                                                         | `not-located`                              |
| `` `role "name"` ``                                                     | `getByRole(role, { name, exact: true })`, its first shown match                          | `found`; `representative` if several match |
| `` `role "<placeholder>"` ``, `` `role "Select <name>"` ``              | by role, the name's literal parts exact and each placeholder any text                    | `representative`                           |
| `` `role` ``                                                            | by role only                                                                             | `found`; `representative` if several match |
| several forms before the first `;`, `with`, `holding` or `described by` | each form; the row drawn once per element; `` `"Name"` `` alone takes the role before it | the row's, from its forms                  |
| `` `group` holding `button "Select <name>"` `` (or `with`)              | the outer element, which must hold the inner one                                         | as the outer form                          |
| `level N` right after a form                                            | its level (heading, list item, row, tree item)                                           | —                                          |
| anything else (prose, a link to another region)                         | nothing                                                                                  | `not-located`                              |

A code span that names no role (`aria-pressed`, `title`) is skipped. A form is searched inside
the scope, and the scope's own elements count as inside it (a `data-region` heading is its own
S1). A row none of whose forms is located is `absent`.

The fixture is a fixture file of the package (`fixtures/annotate.fixture.ts`, which exports its
`test` with `annotate`), merged into the app fixture with Playwright's `mergeTests`; reviewer2's
end-to-end package holds one to copy.

The fixture's own tests are neither journeys, scenarios nor edge cases, and a `.spec.ts` is read as a
product spec (the manifest lists it, coverage counts it, the run's results show it), so they are not
one: they sit beside the fixture as `fixtures/<name>.selftest.ts` (not a profile block, so no
placement rule applies), carry no kind tag and no `spec` annotation, run as a Playwright project
of their own (`testDir: 'fixtures'`, `testMatch: '*.selftest.ts'`), and attach their files under a
name other than `regions/…` (reviewer2's fixture takes a `regionAttachments` option for it), which
the run's results would read as a region.

**What it does not do:** no comparison with an earlier run (no visual regression), no rows of
another region on the same screen, no shot of a hidden region, and no file outside the test
results. A plan's implementation notes link these files rather than paste a screenshot of a
documented region by hand (D34).

## Pitfalls

- **Readiness of a server that isn't plain HTTP.** `webServer`'s `url` check needs a
  2xx–3xx response. For a server that answers only a WebSocket upgrade, or 404 to
  everything else, use `port`, which only checks that the port accepts connections.
- **Native `<select>` options are never "visible".** Playwright's actionability check
  reports every `<option>` as hidden unless the dropdown is open, which headless browsers
  don't render. To wait for an option to appear, use `waitFor({ state: "attached" })`, not
  the default `"visible"`; `selectOption()` works on attached options.
- **Parameter properties under `erasableSyntaxOnly`.** A package that runs TypeScript
  without a build step (type stripping) can't use constructor parameter properties; assign
  fields in the constructor body, as the page-object example does.

## Checks

- `check-tsdoc-tags.mjs` (architecture-profile skill): `@place`, `@drives` and `@world`.
- `check-block-placement.mjs`: each block in its folder.
- The profile's dependency rules (`acyclic`, `block-allow-list`, `layer-packages`), judged by
  `reviewer2-check`, the repository's architecture gate: a `.spec.ts` is the `spec` block, though
  the manifest classifies it as a test.
- `spec-structure`, `no-symbol`, `use-case-has-journey` and `package-allow-list` are
  `planned`; until a checker implements them, check them in review.
