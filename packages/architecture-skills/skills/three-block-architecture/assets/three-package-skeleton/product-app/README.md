# example

A three.js package made from the three-block-architecture template, in the shape of an app: a page
(`index.html`, `src/main.ts`) that mounts the engine of the package into `#app`. Replace this
paragraph with what the package does; the package doc is `layered-docs/1.example.three-package.md`.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script         | Does                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`          | Vite dev server                                                                                                                               |
| `build`        | `vite build`                                                                                                                                  |
| `typecheck`    | `tsc --noEmit`                                                                                                                                |
| `lint`         | oxlint, the naming check, the TSDoc tags check, `validate-md` over the docs                                                                   |
| `test`         | Vitest in Node, spec kinds as strict tags                                                                                                     |
| `test:browser` | Vitest browser mode in headless Chromium, once on WebGPU and once on the WebGL 2 fallback (`*.browser.spec.ts`; `CHROMIUM_PATH` points at it) |

## Layout

```text
index.html, vite.config.ts        the page and its Vite config (`~libs/*` aliased)
src/main.ts                       the page's entry: mounts the engine and its param panel
src/param-panel.ts                the panel: plain DOM built from the engine's ParamSpec[], CommandSpec[], ReadoutSpec[] and bindings
src/index.ts                      host tier: engine factory, param specs, plain types
src/kit.ts                        kit tier: effect, material, node, pipeline, surface
libs/example-domain/              domain: params model, defaults, param specs, binding specs, events, apply rules
libs/example-effect/              render-kit: .node.ts, .material.ts, .effect.ts, .surface.ts, .pipeline.ts
libs/example-engine/              engine: create-example.engine.ts (createExampleEngine)
libs/<lib>/layered-docs/          the lib's doc, 1.<lib>.three-lib.md (role, boundaries, decisions)
layered-docs/                     the package doc, 1.example.three-package.md
```

Cross-lib imports use `~libs/<lib>` (a lib's public barrel; `tsconfig.json` paths, mirrored in the
Vite and Vitest configs); same-lib imports are relative.
