# example

A Node prototype made from the node-block-architecture template, in the shape of an app: a small
HTTP server (`app/example.main.ts`, over `node:http`) that listens on `PORT` (portless sets it; 3000
when unset), prints its URL and greets the `name` of `GET /?name=Ada`. It is composed from one feature
library (`libs/example/`), whose greet route the server serves.

## Run

```text
pnpm run dev                       # portless: https://example.<lab>.localhost, runs dev:app
pnpm run dev:app                   # node --watch app/example.main.ts, on PORT or 3000
PORT=3000 node app/example.main.ts   # then GET /?name=Ada
```

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script      | Does                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| `dev`       | `portless`: runs `dev:app` behind a named URL (the `portless` key of `package.json`)         |
| `dev:app`   | runs the entry from source, restarting on change                                             |
| `typecheck` | `tsc -p tsconfig.json`                                                                       |
| `lint`      | oxlint with the skill's prototype rules (type-aware), then the skill's block-placement check |
| `test`      | Vitest, with the spec kinds as strict tags                                                   |

## Structure

```text
app/example.main.ts                      the entry: wires the process to the composition
app/example.config.ts                    PORT and HOST from the environment
app/example.server.ts                    the node:http server over the route
app/compose-example.composition.ts       the composition root
libs/example/src/index.ts                the library's public surface
libs/example/src/lib/core/               model, rules, port, use case
libs/example/src/lib/adapters-driven/    the system clock gateway
libs/example/src/lib/adapters-driving/   the greet command and the greet route
libs/example/src/lib/testing/            the fake clock and the port contract
```

The package is bound to the node-block-architecture profile with `"enforcement": "advisory"`:
the boundary checks report and do not block until the prototype becomes a product.
