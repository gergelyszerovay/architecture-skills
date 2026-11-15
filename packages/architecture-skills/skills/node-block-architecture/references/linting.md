# Linting and formatting

Each tool has one job and fails on its own: `tsc` for types, ESLint for code rules and
TSDoc, Prettier for formatting, architecture-check (`reviewer2-check`) for import boundaries
(see [enforcement.md](enforcement.md)). The reference repository in `assets/reference-repo`
has the complete, working setup; copy its files rather than rewriting them:

| File               | Holds                                                             |
| ------------------ | ----------------------------------------------------------------- |
| `eslint.config.js` | The ESLint config described below                                 |
| `.prettierrc.json` | The Prettier settings                                             |
| `package.json`     | Package versions and the `lint`, `format`, `format:check` scripts |

In an existing project keep its linter, and add only the rules below that it lacks.

## Packages

`eslint@10`, `@eslint/js@10`, `typescript-eslint@8` (supports TypeScript up to 6.0),
`eslint-plugin-n@18`, `eslint-plugin-jsdoc@64`, `eslint-plugin-tsdoc@0.5`, `prettier@3`,
`eslint-config-prettier@10`.

## Prettier

```json
{ "printWidth": 100, "tabWidth": 2, "useTabs": false, "singleQuote": true }
```

In a monorepo one root `.prettierrc` holds these settings for every package: Prettier takes the
nearest config file and ignores the ones above it, so a package-level copy replaces the root
rather than extending it, and only a package that is copied out of the repository (a skill
asset, a template) carries its own copy.

- **Width 100**, between Prettier's default 80 and the common 120. Editors soft-wrap, so
  the width matters for where Prettier breaks code: long type signatures still fit, and
  calls and literals break into one item per line sooner than at 120, which keeps diffs
  granular.
- **Standalone.** Run `prettier --check .` as its own step; don't add
  `eslint-plugin-prettier`, which reports formatting as lint errors and is slower.
  `eslint-config-prettier` goes last in the ESLint config and only turns off conflicting
  rules.

## ESLint: where this setup is opinionated

The base is standard: `@eslint/js` recommended, typescript-eslint's `strictTypeChecked`
and `stylisticTypeChecked` (type-aware, through `projectService`), `eslint-plugin-n`'s
`recommended-module`, and eslint-plugin-jsdoc's `recommended-typescript-error`. What goes
beyond it:

| Rule                               | Setting                                                         | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explicit-function-return-type`    | every function, `allowHigherOrderFunctions: false`              | A factory states the contract it returns (`makeGetDirTree(...): GetDirTree`), so use-case contracts are declared, not derived with `ReturnType`. Callbacks typed by where they are passed are exempt; locals stay inferred.                                                                                                                                                                                                                         |
| `explicit-module-boundary-types`   | on                                                              | Exported functions state their parameter types.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `jsdoc/require-jsdoc`              | every top-level declaration, exported or not                    | Stricter than `publicOnly`: the declaration policy documents everything. The contexts match `ExportNamedDeclaration:has(> …)`, because an exported declaration's comment belongs to the `export` statement. A `_`-prefixed variable or type alias is exempt: it is a schema check ([declarations.md](../../source-organization/references/declarations.md#schematype-pairs)).                                                                       |
| `no-unused-vars`                   | `varsIgnorePattern: '^_'`                                       | The type-only schema checks (`type _XExhaustive<T extends X = z.infer<typeof XSchema>> = T`) are never used by design; nothing else may start with `_`.                                                                                                                                                                                                                                                                                             |
| `jsdoc/require-returns`            | `forceReturnsWithAsync: true`, `enableFixer: false`             | `@returns` for every returned value and every `async` function, so an `async` function returning `Promise<void>` has one; only a non-`async` function that returns nothing has none.                                                                                                                                                                                                                                                                |
| `jsdoc/require-param`              | `checkDestructured: false`, `enableFixer: false`                | An object parameter takes one `@param`; TSDoc has no dotted names, so describe its members in the description.                                                                                                                                                                                                                                                                                                                                      |
| `architecture-skills/tsdoc-syntax` | on, with `jsdoc/check-tag-names` and `jsdoc/require-yields` off | eslint-plugin-jsdoc checks presence, eslint-plugin-tsdoc checks TSDoc syntax (`@param name - text`, custom tags from `tsdoc.json`). `@yields` isn't TSDoc; describe a generator in `@returns`. The rule is `tsdoc/syntax` through `eslint-rules.cjs`' `tsdocSyntaxPlugin(tsdoc)`, which lets a row citation `{@link /<path>.md#<Key> \| <Key>}` through (the parser rejects every target with a leading `/`); register it as `architecture-skills`. |
| `no-restricted-syntax`             | `export *`, and namespace imports of `#libs/…`                  | Barrels re-export names; a library is imported by name. Change the alias if the project's differs.                                                                                                                                                                                                                                                                                                                                                  |
| `no-restricted-exports`            | all default exports                                             | Named exports only.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `no-console`, `n/no-process-exit`  | error, except driving adapters and `.main.ts`                   | Only those write output or end the process. A stdio server also keeps the stdout smoke test in [testing.md](testing.md).                                                                                                                                                                                                                                                                                                                            |
| `n/no-process-env`                 | error, except `*.config.ts` and tests                           | Only `.config.ts` blocks read the environment (constitution [D26](../node-block-architecture.constitution.md#D26)); tests may pass it to child processes.                                                                                                                                                                                                                                                                                           |
| `consistent-type-definitions`      | off                                                             | Ports are interfaces, data contracts are type aliases.                                                                                                                                                                                                                                                                                                                                                                                              |
| `require-await`                    | off                                                             | In-memory adapters and fakes implement async ports synchronously.                                                                                                                                                                                                                                                                                                                                                                                   |

File overrides:

- `.procedure.ts`, `.router.ts`: no explicit types; tRPC clients infer them from these
  declarations.
- `*.test.ts`: no TSDoc; `no-unused-labels` off for the `arrange`, `act` and `assert`
  labels. `*.contract.ts`: `no-unused-labels` off too, since contract suites hold specs.
- `*.config.{js,ts}`: type-aware linting, TSDoc and the default-export ban off. Include
  `tsdown.config.ts` in `tsconfig.json` so `typecheck` still covers it.
- `n.convertPath` maps each `app/*.main.ts` to its built `dist/*.mjs`, so `n/hashbang`
  accepts the shebang of a `bin` entry.

## Pitfalls

- **`jsdoc/require-param` and `jsdoc/require-returns` carry `enableFixer: false`.** Their
  fixers insert the tag but cannot write the description, so `--fix` leaves `@param name`
  with no text and no hyphen — which then fails `jsdoc/require-param-description` and
  `tsdoc/syntax`. One honest finding becomes three, in a file a `--fix` pass may have
  touched for an unrelated reason. The tags are written by hand; the rules only report.
- A flat-config entry that sets a rule replaces its options; it doesn't merge them. An
  override for some files must repeat the general options it keeps.
- `checkDestructuredRoots: false` exempts every destructured parameter, but the policy
  exempts only those with a named type; check inline-typed ones in review.
- Exported constants such as zod schemas stay inferred. `isolatedDeclarations` would
  force types on them; enable it only where the public API can satisfy it (see
  [setup.md](setup.md#building)).

## What ESLint doesn't cover

Import boundaries (architecture-check), and the
one-primary-declaration rule, which needs symbol analysis (the `declarations` rule of
`reviewer2-check`; see the source-organization skill's declarations reference).

In CI run `typecheck`, `lint`, `format:check`, `reviewer2-check` and `test`.
