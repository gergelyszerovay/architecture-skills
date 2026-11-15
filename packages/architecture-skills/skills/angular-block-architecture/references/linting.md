# Linting and formatting

Each tool has one job and fails on its own (D42): `tsc` for types, ESLint for TypeScript,
Angular, template and TSDoc conventions, Prettier for formatting, and architecture-check
(`reviewer2-check`) for the import rules of the profile (see [enforcement.md](enforcement.md)). The demo project in
`assets/spartan-ui-boilerplate` has the complete setup; copy its files rather than
rewriting them:

| File                                  | Holds                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                   | The ESLint config described below                                                                                                      |
| `.prettierrc.json`, `.prettierignore` | The Prettier settings, and the vendor root it skips                                                                                    |
| `tsdoc.json`                          | The profile's custom TSDoc tags, for `tsdoc/syntax` (run through `eslint-rules.cjs`' `tsdocSyntaxPlugin`, as in the Node architecture) |
| `package.json`                        | Package versions and the `lint`, `format`, `format:check` scripts                                                                      |

In an existing project keep its linter, and add only the rules below that it lacks.

## Packages

`eslint@10`, `@eslint/js@10`, `typescript-eslint@8` (supports TypeScript up to 6.0),
`angular-eslint` (the major matching the installed Angular; the config was written
against 22.5), `eslint-plugin-jsdoc@64`, `eslint-plugin-tsdoc@0.5`, `prettier@3`,
`eslint-config-prettier@10`.

## Prettier

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

In a monorepo one root `.prettierrc` holds these settings (the `*.html` override scoped to the Angular packages' paths) for every package: Prettier takes the
nearest config file and ignores the ones above it, so a package-level copy replaces the root
rather than extending it, and only a package that is copied out of the repository (a skill
asset, a template) carries its own copy. In a lab, whose root `.prettierrc.json` is the lab
skeleton's and has no override, each Angular package carries its own copy, override included.

- **Width 100**, the same as the Node architecture. Editors soft-wrap, so the width
  matters for where Prettier breaks code: templates, decorators and signatures fit, and
  calls and literals break into one item per line sooner than at 120.
- **Standalone.** angular-eslint's guide adds `eslint-plugin-prettier`; don't. Run
  `prettier --check .` as its own step, and put `eslint-config-prettier` last in the ESLint
  config.
- Vendor roots (a spartan-ng `libs/ui`, named in the package doc's Vendor Roots table, D50)
  stay in their upstream formatting (D22): ESLint's `ignores` builds them from the table
  (`vendorRoots` of the architecture-profile skill's `vendor-roots.cjs`), and
  `.prettierignore`, a static file, repeats the path with a comment citing the table.

## ESLint: where this setup is opinionated

The base is angular-eslint's recommended setup (`tsRecommended`, `templateRecommended`,
`templateAccessibility`, and `processInlineTemplates`, so inline templates are linted as
templates), plus `@eslint/js` recommended and eslint-plugin-jsdoc's
`recommended-typescript-error`. What goes beyond it:

| Rule                                                              | Setting                                                                                                                                                                                         | Why                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| typescript-eslint presets                                         | `strictTypeChecked`, `stylisticTypeChecked` instead of the guide's `recommended`, `stylistic`                                                                                                   | Type-aware rules (`no-floating-promises`, `no-unnecessary-condition`), which `no-uncalled-signals` needs anyway.                                                                                                                                                                                   |
| `parserOptions.project`                                           | `tsconfig.app.json` and `tsconfig.spec.json`, not `projectService`                                                                                                                              | The project service picks the root `tsconfig.json`, which has neither's `types`, so spec globals would be `any`.                                                                                                                                                                                   |
| `explicit-function-return-type`, `explicit-module-boundary-types` | every function and method (D43)                                                                                                                                                                 | Contracts are readable without hovering. Callbacks typed by where they are passed (`computed(() => …)`, `effect`, `.map`) are exempt; signal fields stay inferred.                                                                                                                                 |
| `component-class-suffix`, `directive-class-suffix`                | `Page`, `Container`, `Ui`, `Layout`, `Dialog`, `Adapter` instead of `Component`                                                                                                                 | Classes are named after their block (D7, D43): `FileTreeUi` in `file-tree.ui.ts`. The CLI's root `App` is exempt.                                                                                                                                                                                  |
| Signal rules                                                      | `prefer-signals`, `prefer-output-emitter-ref`, `prefer-signal-model`, `prefer-output-readonly`, `no-uncalled-signals`, `computed-must-return`, `no-implicit-take-until-destroyed`               | Signals above the view-model seam (D12); `no-uncalled-signals` catches `if (loading)` meant as `if (loading())`.                                                                                                                                                                                   |
| `architecture-profile/max-facades-per-component`                  | at most one `inject(XFacade)` per component (D10, D47); **only without `reviewer2-check`**                                                                                                      | The profile's row names architecture-check, whose `facades` rule counts the facades a component class uses; `eslint-rules.cjs`' `buildMaxFacades` builds this ESLint rule from the same row as its fallback. A package that runs `reviewer2-check` leaves it out, so one rule is not judged twice. |
| `no-restricted-syntax` on `.page`, `.container`, `.ui`, `.facade` | no `subscribe` calls                                                                                                                                                                            | The profile's `no-symbol` rule (D12). In a package bound to the profile, build these entries with the architecture-profile skill's `eslint-rules.cjs`; the demo, which isn't bound, writes them out.                                                                                               |
| `architecture-profile/providers-only` on `.providers`             | provider arrays and `makeEnvironmentProviders([...])` only; no call but `provideEnvironmentInitializer` and `inject` in a factory, no function body, no write (assignment, `++`/`--`, `delete`) | The profile's `providers-only` rule (D51), built by `eslint-rules.cjs`' `buildProvidersOnly`: a providers block wires what its route scopes and runs or changes none of it.                                                                                                                        |
| `prefer-host-metadata-property`, `prefer-service-decorator`       | on                                                                                                                                                                                              | Host bindings in `host`, root singletons as `@Service` (Angular 22).                                                                                                                                                                                                                               |
| `@typescript-eslint/no-extraneous-class`                          | `allowWithDecorator: true`                                                                                                                                                                      | Decorated Angular classes may have no members of their own.                                                                                                                                                                                                                                        |
| `@typescript-eslint/prefer-readonly`                              | on                                                                                                                                                                                              | Fields holding signals and injected services are never reassigned.                                                                                                                                                                                                                                 |
| `template/conditional-complexity`                                 | on                                                                                                                                                                                              | Ordinary visual conditions only; substantial logic goes to `.rules.ts` or `.format.ts` (D13).                                                                                                                                                                                                      |
| Template idioms                                                   | `prefer-self-closing-tags`, `prefer-class-binding`, `prefer-style-binding`, `prefer-ngsrc`, `button-has-type`, `no-any`, `no-positive-tabindex`                                                 | Angular's current idioms and accessibility beyond the preset.                                                                                                                                                                                                                                      |
| TSDoc and exports                                                 | as in the Node architecture                                                                                                                                                                     | TSDoc on every top-level declaration, `@param` for each parameter, `@returns` for a returned value and every `async` function (none for `void`); named exports only; no `export *` or namespace imports of `#libs/…` (D4, D43).                                                                    |

`prefer-on-push-component-change-detection` (in `tsRecommended`) knows that Angular 22
makes OnPush the default: omitting `changeDetection` passes, `Eager` or `Default` fails.
Before Angular 22 it requires `ChangeDetectionStrategy.OnPush` explicitly.

Deliberately not enabled:

- `use-injectable-provided-in`: it pushes every service to root scope, against D16.
- `template/no-call-expression`: every signal read in a template is a call.
- `template/cyclomatic-complexity`: it counts a whole template, so it rejects containers
  for their size.

File overrides: `src/main.ts` may use `console` (a bootstrap failure has nowhere else to
go); `*.spec.ts` needs no TSDoc and keeps its bare `arrange`, `act` and `assert` labels
(D33); `*.config.{mjs,ts}` has type-aware linting, TSDoc and the default-export ban off.

## Pitfalls

- A flat-config entry that sets a rule replaces its options. The per-block
  `no-restricted-syntax` entries therefore repeat the general selectors.
- `no-unnecessary-condition` trusts index types: without `noUncheckedIndexedAccess`,
  `record[key]` is typed as always present and a correct `=== undefined` guard is
  reported. Enable the compiler option instead of deleting the guard.
- The config file is `eslint.config.mjs`, because Angular CLI packages usually don't set
  `"type": "module"`.
- A decorated class's TSDoc goes above the decorator.

## What ESLint checks, and what the engine does

ESLint checks the conventions: the TypeScript, Angular, template and TSDoc rules above, and
the profile rows marked `eslint`: `no-symbol` (no `subscribe` above the view-model seam, D12)
and `providers-only` (D51). The rules over imports are architecture-check's
(`reviewer2-check`): the block allow-list, layer packages, library roles, context access,
cycles, public entries, testing code, the surface a capability offers its peers (D45, judged by
symbol; a capability's wiring is a `.providers.ts` block the surface does not list, D51), lazy
places (D53, read off the `import()` edges), the symbols
reached through barrels (D24) and facades per component (D10, D47). Without `reviewer2-check`,
`buildMaxFacades` is the fallback for the facades rule, and the import rules are reviewed (the
architecture-profile skill's `rules.md`, "Engines"). The one-primary-declaration rule is the
`declarations` rule of `reviewer2-check`; check it in review where that does not run.

In CI run `typecheck`, `lint`, `format:check`, `reviewer2-check` and `test`.
