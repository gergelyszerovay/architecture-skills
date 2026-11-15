# Enforcement

Rules that are not checked erode. Enforce the dependency direction by path and suffix,
and report any rule the project does not enforce yet. Code-level rules (async
correctness, named exports, output only from driving adapters, TSDoc) are ESLint's job;
see [linting.md](linting.md).

## architecture-check

The rules are the profile's ([node-block-architecture.architecture-profile.md](../node-block-architecture.architecture-profile.md)), and its import rules name
`architecture-check`: `reviewer2-check --rule dependencies` (the
`@gergelyszerovay/reviewer2-architecture-check` package) judges them over the repository's
manifest, through barrels and with the package doc's tables as data, and needs no config of its
own. It is the one engine of the import rules (the architecture-profile skill's `rules.md`,
"Engines"): a repository that does not run it has no import-rule check, and reviews them. The
package binds to the profile in `package.json`:

```json
"architecture": { "profile": "node-block-architecture" }
```

The checkers (`check-tsdoc-tags.mjs`, `check-block-placement.mjs`) parse the profile and the
package doc with markdown-schema, which they resolve from the package: add
`@gergelyszerovay/markdown-schema` to the package's devDependencies. The loader tries
that package first and then the legacy `markdown-schema`, so a package that still declares the
old name keeps working.

- `layer-packages` reads a layer's `*` as every external package and no package of the
  workspace: another workspace package is another hexagon (D9), so only the `bridging` layer
  (`workspace, node:path`) and the `composition` layer (`*, workspace`) import one, as their
  `workspace` token allows for the packages `package.json` declares with `workspace:`; any
  other layer needs an Approved Packages row for it.
- Approved pure packages for the hexagon go in the package doc's Approved Packages table.

Every violation names its profile rule and the constitution decision behind it. The
earlier hand-written rules map to profile rules as follows:

| Earlier rule                                                                                      | Profile rule                                                                           |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `no-cycles`                                                                                       | `acyclic`                                                                              |
| `core-is-pure`, `driving-dir-not-driven-dir`, `driven-dir-not-driving-dir`                        | `directory-allow-list`, and `composition-root` for `app/`                              |
| `core-no-packages`, `core-no-io-builtins`                                                         | `layer-packages` (`domain` and `application` layers)                                   |
| `libs-use-public-entry`, `app-uses-public-entry`                                                  | `public-entry-only`                                                                    |
| `features-are-isolated`, `shared-not-features`                                                    | `library-roles` with `role-source=context-path`, and `context-access` between contexts |
| `only-entry-imports-app`                                                                          | `composition-root`                                                                     |
| `no-testing-in-prod`                                                                              | `no-testing-in-prod`                                                                   |
| `inside-no-transport-schema`, `use-case-no-use-case`, `driving-not-driven`, `driving-not-driving` | `block-allow-list`                                                                     |
| `bridges-only-in-app`                                                                             | `block-placement` (checker)                                                            |

`block-allow-list` checks by suffix, and every implementation file carries one (helpers are
`.util.ts`). Directory rules and suffix rules still check different things, so the profile
keeps both: a `.util.ts` in `adapters-driving/` is allowed by its suffix everywhere, yet the
directory rule keeps it out of reach of `core/`.

## Other checkers

- `check-block-placement.mjs <package-dir>` (architecture-profile skill): each block sits
  in its layer's folder (`core/`, `adapters-driving/`, `adapters-driven/`, `testing/`,
  `app/`). Import rules can't check where a file sits.
- `check-tsdoc-tags.mjs <package-dir>`: required TSDoc tags per block
  ([documentation-and-testing.md](documentation-and-testing.md)).

## Nx

Tag projects `type:core`, `type:adapter`, `type:app`, and `scope:<feature>`/`scope:shared`,
then use `@nx/enforce-module-boundaries` so `type:core` depends only on `type:core`, and
`scope:<feature>` depends only on itself and `scope:shared`.

`public-entry-only` enforces the barrel layout: outside its own library, code reaches a library only through its `src/index.ts`. When adopting the
rules in an existing project, start them as warnings. Driving-adapter registration
functions must be exported from the public entry for composition to reach them.

## Checks that need more than import rules

The constitution's Checked by column marks the decisions no tool proves (`review`,
`test`); report them as unenforced rather than covered. Two are worth a mechanism:

- **Data ownership (D11)** isn't visible in imports when features share a database.
  Enforce it with per-feature database schemas, roles or table-name prefixes checked in
  tests.
- **Clean stdout (D19):** for stdio binaries, a test starts the binary and asserts that
  stdout holds only protocol messages ([testing.md](testing.md)).
