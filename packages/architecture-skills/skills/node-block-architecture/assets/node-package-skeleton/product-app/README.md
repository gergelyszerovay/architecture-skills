# example

A Node package made from the node-block-architecture template, in the shape of an app: a
command-line binary (`bin/example.mjs`, built from `app/example.main.ts`) composed from one
feature library (`libs/example/`). Replace this paragraph with what the package does; the package
doc is `layered-docs/1.example.node-package.md`.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script           | Does                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `build`          | tsdown bundles the binary into `dist/`                                     |
| `typecheck`      | `tsc -p tsconfig.json`                                                     |
| `lint`           | ESLint (the profile's entry-only rule included), `validate-md` on the docs |
| `format:check`   | Prettier                                                                   |
| `lint:tsdoc`     | the profile's required TSDoc tags                                          |
| `lint:placement` | the profile's block placement                                              |
| `test`           | Vitest, with the spec kinds as strict tags                                 |
| `publint`        | `publint --strict` on the packed package                                   |

## Structure

```text
app/example.main.ts                      the entry: wires the process to the composition
app/compose-example.composition.ts       the composition root
bin/example.mjs                          the committed shim that loads the built entry
libs/example/src/index.ts                the library's public surface
libs/example/layered-docs/               the library's doc
libs/example/src/lib/core/               model, rules, port, use case
libs/example/src/lib/adapters-driven/    the system clock gateway
libs/example/src/lib/adapters-driving/   the greet command
libs/example/src/lib/testing/            the fake clock and the port contract
```
