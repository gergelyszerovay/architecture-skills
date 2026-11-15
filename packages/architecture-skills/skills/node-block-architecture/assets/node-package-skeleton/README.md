# Node package template

The template `new-package` makes a Node package from. It follows the
[node-block-architecture skill](../../SKILL.md): one feature library, `libs/example/`, with a
model, a rules block, a port, a use case, a gateway, a fake and a port contract, specs of each kind,
and, for an `app`, a command-line entry composed in `app/`. The template is self-contained: a
package made from it extends only files the skills package ships, through its own
`node_modules/@gergelyszerovay/architecture-skills/`, and nothing from the repository it sits in.

```text
pnpm exec new-package node <dir> --name <package> --tier <prototype|product> --kind <app|lib> [--private] [--dep <name>=<specifier>]...
```

`new-package` writes the package, refuses a folder that is not empty, and prints what is left to
do: the workspace glob the package is missing from, `pnpm install`, and the catalog templates
(`node-package`, `node-lib`) not found in a `markdown-schema-templates/` folder above it.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository (the root `package.json` must list `@gergelyszerovay/architecture-skills` in `installSkills`): `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Variants

The tier changes tooling, never source (reviewer2 R2 of the lab constitution); the kind changes
the package's shell.

| Variant          | What it is                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| prototype, `app` | `private`; `dev` (`portless`) and `dev:app` (`node --watch app/example.main.ts`), `typecheck`, `lint` (oxlint with the skill's `oxlint-prototype.json`, then `check-block-placement .`), `test`; no docs, no build |
| prototype, `lib` | the same without `app/`, `dev` and `dev:app`; `exports` `.` points at `libs/example/src/package.entry.ts`, so another prototype imports it from source                                                             |
| product, `app`   | `build` (tsdown), `typecheck`, `lint` (`eslint .`, `validate-md` on its docs), `format:check`, `lint:tsdoc`, `lint:placement`, `test`, `publint`; package and lib docs; `bin/example.mjs`                          |
| product, `lib`   | the same with `exports` pointing at `dist/index.mjs` and its declarations, built from `libs/example/src/package.entry.ts`                                                                                          |

A product package is made `private` too (it is not published yet, so it needs no `CHANGELOG.md`): remove `"private": true`
when it is to be published, and give it a `CHANGELOG.md` (the `changelog` skill; `lab promote` says so as well).

The prototype tier binds `"enforcement": "advisory"` in `architecture`; `"coverage": "specified"`
is bound at both tiers. A prototype's doc and its portless wiring come with `lab new`.

## Layout

The template holds `template.json` and overlay folders, applied in this order, a later file
replacing an earlier one at the same path: `base/`, `tier-<tier>/`, `kind-<kind>/`,
`<tier>-<kind>/`. `package.json` is composed from each overlay's `package.patch.json` by JSON
merge patch (RFC 7386, `null` deletes), so no file in a template is named `package.json`;
`_gitignore` becomes `.gitignore`.

| Overlay           | Holds                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `base/`           | `libs/example/` with its specs, `tsconfig.json`, the Vitest config, `tsdoc.json`, `.gitignore` |
| `tier-prototype/` | `.oxlintrc.json`, the prototype scripts                                                        |
| `tier-product/`   | `eslint.config.js`, `.prettierrc.json`, the package and lib docs, the product scripts          |
| `kind-app/`       | `app/example.main.ts`, the composition, the CLI block of the library                           |
| `kind-lib/`       | `libs/example/src/package.entry.ts`                                                            |
| `product-app/`    | `bin/example.mjs` (the toolkit's shim), the tsdown config of the binary                        |
| `product-lib/`    | the tsdown config of the library entry                                                         |
| `prototype-app/`  | the `dev` and `dev:app` scripts, the `portless` key                                            |
| `prototype-lib/`  | `exports` pointing at source                                                                   |

The token `example` becomes the package name without its scope: kebab-case in paths and prose,
camelCase before an uppercase letter (`exampleParams`), PascalCase for `Example`. The template
avoids the word in prose.

## Dependencies

`new-package` writes `^<its own version>` for `@gergelyszerovay/architecture-skills` and the
template's range for every other dependency (ESLint and its plugins, typescript, tsdown, publint,
vitest, prettier, `@types/node`, oxlint, oxlint-tsgolint, at the ranges reviewer2 locks);
`--dep <name>=<specifier>` overrides one the template declares (a `link:` while developing). There
is no runtime dependency.
