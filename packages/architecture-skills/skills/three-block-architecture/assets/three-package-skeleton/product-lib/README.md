# example

A framework-independent three.js package made from the three-block-architecture template, in the
shape of a library. Replace this paragraph with what the package does; the package doc is
`layered-docs/1.example.three-package.md`.

It contains one working example: a full-screen TSL gradient (a `.node.ts` graph in a node material)
rendered into a 320x200 nearest-filtered target and presented on the canvas by a `RenderPipeline`, on
`WebGPURenderer` (WebGPU, or its WebGL 2 fallback), with Space (on the focused canvas) to pause.
Each block type the example needs appears exactly once, including a `.surface.ts`
(`createExampleSurface`) that renders the effect into a texture for any material. Engine factories
are `createExampleEngine(container, initial?, options?)`; `EngineOptions` (`interactive`,
`pauseWhenOffscreen`, `respectReducedMotion`, all default `true`) are part of the host contract that
`libs/example-domain/` defines.

## Layout

```text
src/index.ts                      host tier ("."): engine factory, param specs, plain types
src/kit.ts                        kit tier ("./kit"): effect, material, node, pipeline, surface
libs/example-domain/              domain: params model, defaults, param and binding specs, the host-contract types, events, rules
libs/example-effect/              render-kit: .node.ts, .material.ts, .effect.ts, .surface.ts, .pipeline.ts
libs/example-runtime/             runtime: the frame loop, the controls, the emitter and (src/testing.ts) the browser-spec fixtures
libs/example-engine/              engine: create-example.engine.ts (createExampleEngine)
libs/<lib>/layered-docs/          the lib's doc, 1.<lib>.three-lib.md (role, boundaries, decisions)
layered-docs/                     the package doc, 1.example.three-package.md
.oxlintrc.json                    the skill's oxlint rules and DOM-globals overrides
tsdoc.json                        the profile's custom TSDoc tags
```

- The package is self-contained: the host contract (the plain-data types and the rules in
  `example-domain`), the loop, the controls, the present pipeline and the browser-spec fixtures
  are the package's own, in the smallest form the example needs. A package that grows several
  engines moves them into an engine package of your own and depends on it.
- File names: kebab-cased primary declaration plus block suffix (`create-example.engine.ts` is
  `createExampleEngine`); `lint` runs the skill's naming check, and `build` its host-tier check.
  `package.json` binds the package to the skill's profile (`"architecture"`), and `lint` also runs
  the profile's TSDoc tags check.
- Barrel layout: each lib's public surface is `libs/<lib>/src/index.ts`; other files are private
  under `src/lib/`.
- Cross-lib imports use `~libs/<lib>` (`tsconfig.json` paths, mirrored in the Vitest configs);
  same-lib imports are relative. A `#` subpath import is not used because pkgroll leaves `#`
  imports external in the bundled `.d.ts`.
- `pkgroll` bundles both tiers into `dist/`; `three` stays external. `three` and `@types/three` are
  peer dependencies (a kit consumer renders the package's materials and surfaces with its own
  renderer, so there must be one copy of three.js) and also devDependencies (the package's own
  build, lint and tests).
- `tsconfig.json` sets `"types": []`, so Node globals are unavailable to package code.

Run `pnpm exec install-skills` (the bin of `@gergelyszerovay/install-skills`, a devDependency of the repository) once in the repository: `lint` loads the architecture profile from `.claude/skills/`, where `install-skills` puts the skills.

## Scripts

| Script         | Does                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typecheck`    | `tsc --noEmit`                                                                                                                                                                                                                                   |
| `build`        | `pkgroll --clean-dist` to `dist/index.*` and `dist/kit.*`, then the skill's host-tier check of `dist/index.d.ts`                                                                                                                                 |
| `lint`         | oxlint (DOM globals included), the naming check, the TSDoc tags check, `validate-md` over the docs                                                                                                                                               |
| `test`         | Vitest in Node, spec kinds as strict tags                                                                                                                                                                                                        |
| `test:browser` | Vitest browser mode in headless Chromium, once on WebGPU and once on the WebGL 2 fallback: the backend, the engine's failure path, pause gates, repaint while paused and dispose twice (`*.browser.spec.ts`; `CHROMIUM_PATH` points at Chromium) |
