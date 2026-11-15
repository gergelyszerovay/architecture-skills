# Project setup

Adopt these defaults for new projects; in existing projects keep what works and change
only what the task needs.

## Starting a package

A new package starts from the skill's template, not from a copy of the reference repository:

```text
new-package node <dir> --name <package> --tier <prototype|product> --kind <app|lib>
```

`new-package` is a bin of `@gergelyszerovay/architecture-skills` (`assets/node-package-skeleton/`
holds the template and its `README.md`). It writes one feature library, `libs/example/` (renamed
to the package), with a model, a rules block, a port, a use case, a gateway, a fake and a port
contract, specs of each kind and the configs; an `app` adds a command-line entry composed in
`app/`, a `lib` a `package.entry.ts`.

| Tier        | Tooling                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prototype` | `private`, `"enforcement": "advisory"`; oxlint with `assets/oxlint-prototype.json`, `check-block-placement .`, `tsc`, Vitest; no docs, no build                                      |
| `product`   | `private` until it is published (remove it then, and add a `CHANGELOG.md`); ESLint with the full profile rules, Prettier, tsdown, publint, `validate-md` on the package and lib docs |

Run `pnpm exec install-skills` once in the repository too (add `@gergelyszerovay/install-skills` to its devDependencies; its root `package.json` lists `@gergelyszerovay/architecture-skills` in `installSkills`; without the list nothing is installed): `lint` loads the profile from `.claude/skills/`. The tier changes tooling, never source. A prototype `lib` exports `.ts` from `exports`, so
another prototype imports it from source (Node strips the types of a file outside
`node_modules`; `#libs/*` resolves through the dependency's own `imports`). The package binds
`"coverage": "specified"` at both tiers.

## Default stack

Used unless the project already has an equivalent (constitution [N2](../node-block-architecture.constitution.md#N2)). Never add a
dependency the task doesn't need.

| Concern              | Default                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| Schemas              | zod                                                                           |
| CLI parsing          | citty ([entry-cli.md](entry-cli.md))                                          |
| Wiring               | by hand, then Awilix in PROXY mode ([frameworks.md](frameworks.md))           |
| Logging              | pino, created once in composition ([operations.md](operations.md))            |
| MCP                  | `@modelcontextprotocol/server`                                                |
| Boundaries           | architecture-check (`reviewer2-check`, [enforcement.md](enforcement.md))      |
| Linting, formatting  | ESLint with typescript-eslint, standalone Prettier ([linting.md](linting.md)) |
| Building, publishing | tsdown and publint, for published packages only                               |
| Tests                | Vitest (constitution [D48](../node-block-architecture.constitution.md#D48))   |

## Modules and TypeScript

- ESM: `"type": "module"` in `package.json`.
- `tsconfig`: `"module": "nodenext"` (implies matching resolution), `"strict": true`,
  `"verbatimModuleSyntax": true` so type-only imports are explicit, and
  `"isolatedModules": true`.
- Relative imports use the runtime extension (`./get-dir-tree.use-case.js`) as Node ESM
  requires. Projects that run `.ts` directly may import `.ts` with
  `"allowImportingTsExtensions"` or rewrite extensions at build time; pick one and apply
  it everywhere.
- To run TypeScript without a build step on recent Node versions (type stripping), keep
  to erasable syntax (`"erasableSyntaxOnly": true` on TypeScript versions that support
  it): no enums, namespaces, or constructor parameter properties. Prefer `as const`
  objects and union types.

### Verified no-build configuration

The reference repository runs TypeScript directly on Node 24 (type stripping on by
default) with no build step:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["es2023"],
    "module": "nodenext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

Relative imports use `.ts` extensions; alias imports name only the library (`#libs/orders`).
Type stripping does not run for files inside `node_modules`, so published packages
still need a build.

### TypeScript versions

TypeScript 7 (the native compiler) is the current major. Tools that load the TypeScript
JavaScript API (typescript-eslint, for one) may need a
TypeScript 6 installation; the reference repository pins `typescript@6` for this reason.
Check tool compatibility before upgrading.

## Aliases

Prefer `package.json` `imports` over `tsconfig` `paths`: Node resolves them natively at
runtime, TypeScript understands them under `nodenext`, and architecture-check's manifest
resolves them. Map the alias to library entries only, `"#libs/*": "./libs/*/src/index.ts"` plus
`"#libs/*/testing": "./libs/*/src/testing.ts"` for test-only entries, so `#libs/orders`,
`#libs/shared/trpc` and `#libs/orders/testing` resolve and a deep import such as
`#libs/orders/src/lib/core/order.model.ts` fails in both TypeScript and Node (verified in the
reference repository). If `paths` are used, keep them in sync
with the runtime resolver. Aliases never
bypass boundaries: rules check the resolved file, not the specifier.

## Package shape

- `engines.node` states the minimum Node version the code relies on.
- `exports` lists public entry points only; for libraries, add types conditions and
  subpath exports for framework integrations.
- A published package has a `version` and a `files` list (usually `["dist"]`), and its
  `bin` entries point at built files, one per binary.

## Building

Build only what leaves the repository:

| Package                                                                                  | Build                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Private application run from source (HTTP server in your own container, internal worker) | None: run `.main.ts` with type stripping                                           |
| Published binary (CLI or MCP server installed with npm or run with `npx`)                | tsdown, one entry per `.main.ts`, no declarations                                  |
| Published library or SDK                                                                 | tsdown with `src/index.ts` (and subpath entries) as entries, ESM plus declarations |

tsdown (on Rolldown) is the default bundler. It follows `package.json` `imports`, so
`#libs/*` aliases are inlined and the published output has no internal aliases;
package dependencies stay external. It keeps a `.main.ts` shebang and marks the output
executable. It writes `.mjs` by default; point `bin` and `exports` at those names.

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { 'cli.main': 'app/cli.main.ts', 'mcp.main': 'app/mcp.main.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  dts: false,
  clean: true,
});
```

- Keep the no-build path working: source entries stay runnable with `node app/x.main.ts`
  in development and tests, and a package can bundle some binaries while others run
  from source (the reference repository bundles fs-tools and runs shop from source).
- Declarations for libraries: tsdown generates them fast with the `isolatedDeclarations`
  compiler option, which requires explicit types on every export. Enable it for a
  library whose public API contains no inferred framework types. APIs built from zod
  schema constants or tRPC routers cannot satisfy it; tsdown then generates
  declarations through `tsc`, which is slower. See the explicit-types rules in
  [linting.md](linting.md).
- Add `dist/` to `.gitignore`. ESLint's config already ignores it.

## Package checks

Run publint (`publint --strict`, so warnings fail) on every published package after the
build. It packs the package as npm would and checks `bin`, `exports`, `types`, and
`files` against the packed files. It fails when a `bin` target was not built or the
package cannot be packed (for example, no `version`). For libraries, also consider
`@arethetypeswrong/cli`, which checks that the declarations resolve under every module
resolution mode.

## Scripts

Provide `typecheck`, `test`, `lint` and `format:check` scripts, and run them in CI with the
boundary check: `reviewer2-check --rule dependencies --rule facades --rule suffixes` once over
the repository ([enforcement.md](enforcement.md)). A published package
also provides `build` and `publint`; CI runs `build` before `test` (so the built-binary smoke
test runs) and `publint`. Boundary rules that are not in CI are suggestions. The ESLint and Prettier configuration is in
[linting.md](linting.md).

## Moving a package from `node:test` to Vitest

Set up Vitest as in [documentation-and-testing.md](documentation-and-testing.md), "Vitest
setup", and the spec-file lint rules in [linting.md](linting.md), and set `"test"` to
`vitest run`. Two things are specific to a package that had `node:test`: under
`isolatedDeclarations`, type the config's default export (`const config: ViteUserConfig =
defineConfig({...})`), and drop any `node:test` entry from `no-floating-promises`. The specs
are converted with `assets/codemods/node-test-to-vitest.mjs` and a hand pass, see
[testing.md](testing.md), "Converting `node:test` suites".
