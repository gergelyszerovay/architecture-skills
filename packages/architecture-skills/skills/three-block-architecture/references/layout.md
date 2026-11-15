# Layout

Where files go and how they are named. The rules are the constitution's **Blocks** decisions
(D13–D16); the layout itself is the source-organization skill's barrel layout, which this
page adds to.

## The barrel layout

Libraries live under `libs/<name>/`, with their public exports in `libs/<name>/src/index.ts`
and everything else in `libs/<name>/src/lib/`. Cross-library imports use a package-internal
alias, `~libs/<name>`, which resolves only to the lib's barrel (tsconfig `paths`, mirrored by
a `resolve.alias` in `vitest.config.ts`); same-library imports are relative.

Don't use a `#libs/*` subpath import: pkgroll keeps `#` imports external in the bundled
`.d.ts`, so the published types would point at files that are not shipped.

A package that imports a shared kit package imports it by package name (its `three`-free
entry from domain libs), while `~libs/<name>` stays for the libs inside the package.

## Package entries

- `src/index.ts`, the host tier: re-exports the engine factories, the domain lib's public
  models and events and the specs the host renders.
- `src/kit.ts`, the kit tier: re-exports the render-kit libs (effects, materials, passes,
  surfaces, prefabs) and the kit-safe runtime blocks.
- `src/element.ts`, optional (`./element`): defines the package's custom element where the page has
  `customElements` and re-exports `define<Name>Element`. Its `.element.ts` block lives in the engine
  lib beside the engine it wraps. List `./dist/element.js` (and the standalone file) in
  `sideEffects`, so a host's bundler keeps the definition.
- `src/standalone.ts`, optional (`./standalone`, the file `dist/standalone/<name>.js`): calls
  `define<Name>Element()` with the asset folder beside the file; built by
  `vite.standalone.config.ts` (Vite's library mode, three.js bundled), which `build` runs after
  pkgroll and the asset bake.

Extract a lib, or a separate shared package, for a cohesive responsibility, not in
anticipation: the second package that needs a loop, controls and a present pipeline is
what extracts them. Example: a lab's second effect package extracted an engine package of its own.

## File names

A file is named by its primary declaration, kebab-cased, plus the block suffix. The stem is
the kebab-cased declaration; when the declaration's name ends with the block's suffix word,
that word becomes the suffix and leaves the stem; otherwise the suffix is appended. No prefix
is omitted.

| Declaration           | File                          |
| --------------------- | ----------------------------- |
| `FlightController`    | `flight.controller.ts`        |
| `VoxelEvents`         | `voxel.events.ts`             |
| `applyVoxelParams`    | `apply-voxel-params.rules.ts` |
| `createVoxelEngine`   | `create-voxel.engine.ts`      |
| `voxelFragmentShader` | `voxel-fragment.shader.ts`    |
| `Emitter`             | `emitter.util.ts`             |
| `pickEntity`          | `pick-entity.util.ts`         |

One primary declaration per file, with the source-organization companions: a factory with
the type it returns (`createPresentPipeline` and `PresentPipeline`), a shader with its
uniform type, an as-const value with its derived type, a class with its handler type. Spec
files follow their subject (`create-retro.pass.spec.ts`, `create-retro.pass.browser.spec.ts`).
The skill's `check-names.mjs` checks the rule ([enforcement.md](enforcement.md)).

## Starting a package

`new-package three <dir> --name <package> --tier <prototype|product> --kind <app|lib>` makes a
package from the skill's template (`assets/three-package-skeleton/`): the three libs of one
working example (a full-screen gradient shader, its material, effect, surface and engine), the
host and kit tiers, and the configs below. Rename the `example` libs by making the package with
your own name (the token follows `--name`), then replace the example's blocks with yours.

| Variant          | Differs by                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| prototype, `app` | `private`, `"enforcement": "advisory"`; `index.html`, `vite.config.ts` and `src/main.ts` mount the engine; `typecheck`, `lint`, `test`, `dev`; no docs |
| product, `app`   | the same page, plus `build` (`vite build`), `test:browser` and the package and lib docs                                                                |
| product, `lib`   | `exports` for `.` and `./kit` in `dist/`, `build` (pkgroll and the host-tier check), `test:browser`, the docs                                          |

A product package is made `private` until it is to be published (remove `private` then and add a `CHANGELOG.md`, the `changelog` skill). The tier changes tooling, never source. There is no prototype `lib`: while this skill resolves
cross-lib imports with the package-local `~libs/*` alias (above), a lib prototype cannot be
imported from source by another package, so `new-package` refuses it; a prototype is an app until
the skill moves to `#libs/*` (lab constitution D8). A package made from the template is
self-contained: its host contract, loop, controls and present pipeline are its own, in `libs/`, and it depends on
nothing but `three` and `@types/three`; `--dep <name>=<specifier>` adds an engine package of your own.

## A package's folders

```text
<package>/
  assets/                 authored binary assets, committed with their licence rows (when there are any)
  layered-docs/           the package doc (three-package)
  libs/<lib>/
    layered-docs/         the lib doc (three-lib)
    src/index.ts          the lib's barrel
    src/lib/*.ts          blocks and their specs
  src/index.ts            host tier
  src/kit.ts              kit tier
  src/element.ts          the custom element (when the package offers one)
  src/standalone.ts       the standalone file's entry (with the element)
  e2e/                    the plain-page specs of the standalone file (with it)
  package.json            exports ".", "./kit" (and "./element", "./standalone"); the architecture binding
  tsdoc.json              the profile's custom tags
  .oxlintrc.json          the skill's oxlint rules plus the DOM-globals overrides
```

### Assets: recipe, build output, manifest

Authored files stay committed beside the unit that loads them, each with a licence row.
Everything a package generates is build output and is not committed: the package's `build`
runs the asset pipeline over its **recipe**, a `.model.ts` of plain rows (id, kind, group, a
source that is an authored file or an exporter, profile overrides) and the **budgets** of its
groups. The pipeline bakes the exporters in headless Chromium, compresses each asset by its
kind's profile (geometry: dedup, weld, quantize, resample, Meshopt; textures: WebP, or KTX2
where the build has KTX-Software's `ktx`; posters: AVIF with WebP beside it; HDR images: kept
as committed; a committed Draco file is loaded as it is and never produced), validates every
`.glb` with the Khronos glTF-Validator (errors fail the build, warnings are listed), checks
the groups' bytes, triangles and texture memory against their budgets, and writes
`dist/assets/` with a generated `manifest.json`: per asset its URL, kind, size, licence or
generator and inputs. The package exports them as `./assets/*`. The build is deterministic and
Turbo caches it by the package's files, so the recipe, the exporters and the sources are its
cache key. The product's pipeline is a tool, not part of the skill (N6).
