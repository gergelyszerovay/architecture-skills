# three.js package template

The template `new-package` makes a framework-independent three.js package from. It follows the
[three-block-architecture skill](../../SKILL.md) and `products/three-demos/layered-docs/1.three-demos.spec.md`, and it is
self-contained: a package made from it extends only files the skills package ships, through its own
`node_modules/@gergelyszerovay/architecture-skills/`.

```text
pnpm exec new-package three <dir> --name <package> --tier <prototype|product> --kind <app|lib> [--private] [--dep <name>=<specifier>]...
```

`new-package` writes the package, refuses a folder that is not empty, and prints what is left to
do: the workspace glob the package is missing from, `pnpm install`, and the catalog templates
(`three-package`, `three-lib`) not found in a `markdown-schema-templates/` folder above it.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Variants

The tier changes tooling, never source (R2 of the lab constitution); the kind changes the shell.

| Variant          | What it is                                                                                                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prototype, `app` | `private`; `dev` (`portless`) and `dev:app` (`vite`), `typecheck`, `lint` (oxlint, `check-names .`), `test`; `index.html`, `vite.config.ts`, `src/main.ts` and `src/param-panel.ts` mount the engine with its param panel; no docs, no build |
| prototype, `lib` | not offered: a three.js lib prototype cannot be imported from source while the skill uses the package-local `~libs/*` alias (D8 moves it to `#libs/*`); `new-package` refuses it                                                             |
| product, `app`   | `build` (`vite build`), `dev`, `typecheck`, `lint` (+ `check-tsdoc-tags`, `validate-md`), `test`, `test:browser`; package and lib docs; no `exports`                                                                                         |
| product, `lib`   | `build` (`pkgroll` and `check-host-tier`), `typecheck`, `lint`, `test`, `test:browser`; `exports` for the host tier (`.`) and the kit tier (`./kit`) in `dist/`                                                                              |

A product package is made `private` too (it is not published yet, so it needs no `CHANGELOG.md`): remove `"private": true`
when it is to be published, and give it a `CHANGELOG.md` (the `changelog` skill; `lab promote` says so as well).

The prototype tier binds `"enforcement": "advisory"` in `architecture`; `"coverage": "specified"`
is bound at both tiers.

## The example

The example is on the skill's default backend: `example-effect` holds a TSL gradient
(`gradient.node.ts`), the node material that draws it, an effect that renders it into a target, a
surface and a `RenderPipeline` that presents the target on the canvas; `example-engine` creates a
`WebGPURenderer` and awaits `renderer.init()`, so it draws on WebGPU or on the renderer's WebGL 2
fallback. A product package's browser specs run on both (`vitest.browser.config.ts` has a `webgpu`
and a `webgl2` instance). The host tier, the spec tables and `param-panel.ts` do not depend on the
backend. A package made from the template before keeps its GLSL code: nothing migrates it.

## Dependencies

A package made from the template depends on nothing but `three` and `@types/three`: the host contract, the loop, the controls and the present pipeline are its own, in `libs/` (a `--dep <name>=<specifier>` adds a dependency of yours, such as an engine package of your own). `three` and `@types/three` are
peer dependencies of a lib (a kit consumer renders the package's materials and surfaces with its
own renderer, so there must be one copy of three.js) and also devDependencies; an app has them as
devDependencies only.

## Layout

The template holds `template.json` and overlay folders, applied in this order, a later file
replacing an earlier one at the same path: `base/`, `tier-<tier>/`, `kind-<kind>/`,
`<tier>-<kind>/`. `package.json` is composed from each overlay's `package.patch.json` by JSON
merge patch, so no file in a template is named `package.json`; `_gitignore` becomes `.gitignore`.

| Overlay           | Holds                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `base/`           | `src/`, the four libs with their specs, `tsconfig.json`, the oxlint and Vitest configs, `tsdoc.json` |
| `tier-prototype/` | the prototype scripts                                                                                |
| `tier-product/`   | the package and lib docs, the browser spec and its Vitest config, the product scripts                |
| `kind-app/`       | `index.html`, `vite.config.ts`, `src/main.ts`, `src/param-panel.ts` (the param panel)                |
| `kind-lib/`       | `exports` and the `pkgroll` build                                                                    |
| `product-app/`    | the `vite build` script                                                                              |

The token `example` becomes the package name without its scope, as in the node template.
