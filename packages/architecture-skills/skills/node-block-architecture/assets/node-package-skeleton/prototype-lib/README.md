# example

A Node prototype made from the node-block-architecture template, in the shape of a library: one
feature library (`libs/example/`) that another prototype imports from source, through
`exports["."]` pointing at `libs/example/src/package.entry.ts` (Node strips the types of a file
outside `node_modules`).

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script      | Does                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `typecheck` | `tsc -p tsconfig.json`                                                                       |
| `lint`      | oxlint with the skill's prototype rules (type-aware), then the skill's block-placement check |
| `test`      | Vitest, with the spec kinds as strict tags                                                   |

## Structure

```text
libs/example/src/package.entry.ts        the package entry: the public API, `export … from` only
libs/example/src/index.ts                the library's public surface
libs/example/src/lib/core/               model, rules, port, use case
libs/example/src/lib/adapters-driven/    the system clock gateway
libs/example/src/lib/testing/            the fake clock and the port contract
```

The package is bound to the node-block-architecture profile with `"enforcement": "advisory"`:
the boundary checks report and do not block until the prototype becomes a product.
