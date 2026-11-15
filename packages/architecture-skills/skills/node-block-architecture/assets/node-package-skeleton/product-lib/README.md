# example

A Node package made from the node-block-architecture template, in the shape of a library: one
feature library (`libs/example/`) published through `libs/example/src/package.entry.ts`. Replace
this paragraph with what the package does; the package doc is
`layered-docs/1.example.node-package.md`.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script           | Does                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `build`          | tsdown bundles `dist/index.mjs` with its declarations                      |
| `typecheck`      | `tsc -p tsconfig.json`                                                     |
| `lint`           | ESLint (the profile's entry-only rule included), `validate-md` on the docs |
| `format:check`   | Prettier                                                                   |
| `lint:tsdoc`     | the profile's required TSDoc tags                                          |
| `lint:placement` | the profile's block placement                                              |
| `test`           | Vitest, with the spec kinds as strict tags                                 |
| `publint`        | `publint --strict` on the packed package                                   |

## Structure

```text
libs/example/src/package.entry.ts        the package entry: the public API, `export … from` only
libs/example/src/index.ts                the library's public surface
libs/example/layered-docs/               the library's doc
libs/example/src/lib/core/               model, rules, port, use case
libs/example/src/lib/adapters-driven/    the system clock gateway
libs/example/src/lib/testing/            the fake clock and the port contract
```
