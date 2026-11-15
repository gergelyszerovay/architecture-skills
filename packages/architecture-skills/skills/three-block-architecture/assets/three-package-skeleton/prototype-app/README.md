# example

A three.js prototype made from the three-block-architecture template, in the shape of an app: a
page (`index.html`, `src/main.ts`) that mounts the engine of the package into `#app`. The engine is
a full-screen TSL gradient (a `.node.ts` graph in a node material) rendered into a 320x200
nearest-filtered target and presented on the canvas by a `RenderPipeline`, on `WebGPURenderer` (WebGPU,
or its WebGL 2 fallback); Space (on the focused canvas) pauses it.

## Run

```text
pnpm run dev         # portless: http://example.<lab>.localhost, runs dev:app with --port; needs the lab's proxy
pnpm run dev:app     # vite alone, on its own port
```

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

In a lab, start the proxy with `pnpm dev` at the lab root, or export `PORTLESS_HTTPS=0 PORTLESS_PORT=1355` and run `portless proxy start --no-tls`; never a bare `dev` otherwise (it would start portless's HTTPS default).

## Scripts

| Script      | Does                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| `dev`       | `portless`: runs `dev:app` behind a named URL (`portless` key of `package.json`) |
| `dev:app`   | Vite dev server                                                                  |
| `typecheck` | `tsc --noEmit`                                                                   |
| `lint`      | oxlint (DOM globals included, type-aware), then the skill's naming check         |
| `test`      | Vitest in Node, spec kinds as strict tags                                        |

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
```

Cross-lib imports use `~libs/<lib>` (a lib's public barrel; `tsconfig.json` paths, mirrored in the
Vite and Vitest configs); same-lib imports are relative. The package is bound to the
three-block-architecture profile with `"enforcement": "advisory"`.
