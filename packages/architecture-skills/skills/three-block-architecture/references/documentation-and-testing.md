# Documentation and testing

What three.js packages add to the architecture-docs-and-specs skill: the tags, the two doc
templates and which spec runs where. The rules are the constitution's **Documentation** and
**Testing** decisions; read the architecture-docs-and-specs skill first for where each fact
lives, spec metadata and skeletons.

## TSDoc tags

The profile's Blocks table lists the tags each block's primary declaration carries; a tag
with a fixed value set starts with one of its values. Declare every tag in the package's
`tsdoc.json`. A tag is required on every block of its row, also on one that creates
nothing: `@owns none` and `@attributes none` are explicit values, so the checker needs no
condition.

| Tag                                                 | Records                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@backend` (`webgpu`/`webgl`/`any`)                 | `webgpu`: built for `WebGPURenderer`, its WebGL 2 fallback included (TSL, node materials, `RenderPipeline`); `webgl`: built for `WebGLRenderer` (GLSL, `ShaderMaterial`, `onBeforeCompile`, `EffectComposer`); `any`: works with either renderer (built-in materials) |
| `@output` (`linear`/`display`)                      | Linear inside a `RenderPipeline` or a composer chain, which converts once at its output; `display` only when drawing straight to the canvas (through `WebGPURenderer`'s own output transform, or with `#include <colorspace_fragment>` on WebGL)                      |
| `@owns`                                             | What the block creates and must release, or `none`; `shared` resources name their reference-counting owner                                                                                                                                                            |
| `@cleanup`                                          | How it releases them (`dispose()`, listener removal, `setAnimationLoop(null)`), or `none`                                                                                                                                                                             |
| `@lifetime` (`engine`/`level`/`entity`/`operation`) | Who creates it and when it is torn down                                                                                                                                                                                                                               |
| `@step` (`fixed`/`frame`)                           | Whether it runs in the fixed simulation step or the interpolated frame phase ([runtime.md](runtime.md))                                                                                                                                                               |
| `@failure`                                          | What happens when context creation, a load, a bake or a storage access fails                                                                                                                                                                                          |
| `@attributes`                                       | The geometry attributes a material reads or a geometry block adds, by the face-attribute contract's names, or `none`                                                                                                                                                  |
| `@renderer`                                         | On `.engine.ts`: the renderer state it sets beyond the defaults, or `default` ([runtime.md](runtime.md))                                                                                                                                                              |
| `@requires` (optional, `native-webgpu`)             | On a `webgpu` block that uses what the WebGL 2 fallback lacks (storage textures, workgroup memory, atomics, an indirect count); the engine's `@failure` says what the fallback does ([architecture.md](architecture.md), "The backend")                               |
| `@after` (optional)                                 | The block this one must run after in the same phase                                                                                                                                                                                                                   |

`.util.ts` and domain blocks need no tags. An optional tag is checked where it is present: the
profile's `tsdoc-tags` rule names it (`optional=requires(native-webgpu)`), and the checker
validates its value as it does a required tag's.

```ts
/**
 * Creates the plasma material: a node material whose colour is the plasma graph.
 * @backend webgpu
 * @output linear
 * @owns the material and the palette `DataTexture`.
 * @cleanup `dispose()` releases both.
 * @attributes none
 */
export function createPlasmaMaterial(params: PlasmaParams): PlasmaMaterial { … }
```

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "tagDefinitions": [
    { "tagName": "@backend", "syntaxKind": "block" },
    { "tagName": "@output", "syntaxKind": "block" },
    { "tagName": "@owns", "syntaxKind": "block" },
    { "tagName": "@cleanup", "syntaxKind": "block" },
    { "tagName": "@lifetime", "syntaxKind": "block" },
    { "tagName": "@step", "syntaxKind": "block" },
    { "tagName": "@failure", "syntaxKind": "block" },
    { "tagName": "@attributes", "syntaxKind": "block" },
    { "tagName": "@renderer", "syntaxKind": "block" },
    { "tagName": "@after", "syntaxKind": "block" },
    { "tagName": "@requires", "syntaxKind": "block" }
  ]
}
```

## Lib and package docs

Two templates in this skill's `markdown-schema-templates/`, each with a valid example:

- **`three-package`**, one per package (`layered-docs/1.<name>.three-package.md`):
  Boundaries (what the package doesn't do and who does), Approved Packages per layer (a
  physics vendor for `runtime`, a product's shared kit for the layers that use it), Rule
  Exceptions with their reasons, and package Decisions.
- **`three-lib`**, one per lib (`libs/<lib>/layered-docs/1.<lib>.three-lib.md`): the lib's
  Role (read by the `library-roles` rule), its responsibility as the summary, Boundaries,
  Owned Resources (shared GPU resources and caches that no single block's `@owns` declares,
  with the block that creates and the one that disposes them) and Decisions.

Neither lists exports, blocks or dependencies: those are derivable. A README stays the human
entry: a paragraph, usage snippets for the two tiers and a link to the package doc.

## Which spec runs where

| Block                                                    | Spec kind             | Environment                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.rules.ts`                                              | invariant             | Vitest, Node                                                                                                                                                                                                                                                                                                                                                                                |
| `.material.ts` `.texture.ts` `.geometry.ts` `.prefab.ts` | scenario              | Vitest, Node: three.js builds these, node materials included, without a GPU context; assert uniforms (uniform nodes' `value`), the slots a node material sets, attributes, disposal                                                                                                                                                                                                         |
| `.effect.ts`                                             | scenario, edge-case   | Node for `setParams` → uniforms and `dispose`; browser for pixels                                                                                                                                                                                                                                                                                                                           |
| `.pass.ts` `.pipeline.ts`                                | scenario, edge-case   | A TSL pass in Node: the node graph it returns and its uniform nodes; a `RenderPipeline` in the browser; a WebGL pipeline in Node with a minimal fake renderer (`getPixelRatio`, `getSize`): target replacement on a filter switch, resize, dispose twice                                                                                                                                    |
| `.surface.ts`                                            | scenario, edge-case   | Vitest, Node, with a fake renderer that records `setRenderTarget` and `render(mesh)`: params reach the effect's uniforms, the draw order (effect, then passes), the previous target is restored, the texture stays the same object, dispose twice                                                                                                                                           |
| `.material.ts` decorators (TSL)                          | scenario, edge-case   | Vitest, Node: apply the decorator to a real node material and assert that the slots its TSDoc lists hold new nodes built on the old ones, its uniform nodes carry the package's prefix in their names, and two decorators of one slot compose                                                                                                                                               |
| `.material.ts` decorators (GLSL)                         | scenario, edge-case   | Vitest, Node: apply the decorator to a real `MeshStandardMaterial`, call its `onBeforeCompile` with the `ShaderLib.standard` sources and a stub renderer, and assert that every targeted include was present and replaced, its uniforms are on the shader, every identifier it pastes starts with the package's name, and `customProgramCacheKey()` differs from the undecorated material's |
| `.compute.ts`                                            | scenario, edge-case   | a bake's CPU result in Node where a fake renderer can stand in; TSL compute and the GPU path in the browser, on both backends; a WebGL bake's bound target restored; a failed read-back; a `@requires native-webgpu` kernel's fallback path                                                                                                                                                 |
| `.overlay.ts`                                            | scenario, edge-case   | Vitest, Node, with a fake container and a real `PerspectiveCamera`: elements are added, placed, hidden behind the camera and removed; the container is empty after `dispose()` twice                                                                                                                                                                                                        |
| `.gateway.ts`                                            | scenario, edge-case   | Node with a fake of the vendor or of `Storage`: a storage gateway's missing and throwing storage, a corrupt value, the debounced write flushed on dispose                                                                                                                                                                                                                                   |
| `.util.ts`                                               | invariant or scenario | by what it does: a pure helper is an invariant, one that builds three.js objects a scenario; both in Node                                                                                                                                                                                                                                                                                   |
| `.engine.ts` `.loop.ts` `.controls.ts`                   | scenario, edge-case   | Vitest browser mode or Playwright (needs a GPU context / DOM), a `webgpu` engine on both backends (below); edge cases: dispose before ready, dispose twice, neither backend available. Controls that only wrap a browser API or take pointer events run in Node with `vi.stubGlobal` or fake elements, including "API missing"                                                              |
| visual output                                            | journey               | Playwright screenshots (product-profile skill)                                                                                                                                                                                                                                                                                                                                              |

The profile's coverage rules ask for an invariant per `.rules.ts` export, a failure-path
edge case for engines, assets, gateways and compute blocks, and a dispose-twice edge case
for every block with `@cleanup`.

A disposal check worth having for every engine: a browser spec mounts and disposes it five
times and `renderer.info.memory` stays flat.

### Browser mode

Vitest browser mode runs the browser specs (`*.browser.spec.ts`) in headless Chromium with
SwiftShader, through `@vitest/browser-playwright`, from a second config
(`vitest.browser.config.ts`) and a `test:browser` script, so the default `test` runs only the
Node specs. Point the provider at an installed Chromium when the machine has one
(`launchOptions.executablePath` from an environment variable) instead of downloading.

A `webgpu` engine's specs run twice (D66), as two `instances` of the config, each with its own
`provider` and a `provide: { backend }` the spec reads with `inject('backend')`:

- **`webgpu`**: Chromium with `--enable-unsafe-webgpu`, `--enable-features=Vulkan`,
  `--use-webgpu-adapter=swiftshader` and `--use-vulkan=swiftshader`, which give a SwiftShader
  adapter on the test page (a `localhost` page; `about:blank` has no `navigator.gpu`);
- **`webgl2`**: Chromium without them and a setup file that hides `navigator.gpu`, so
  `WebGPURenderer` takes its WebGL 2 fallback as in a browser without WebGPU (an engine that
  offers a `forceWebGL` option may pass it instead).

A spec checks which backend its canvas drew with (a canvas holds one kind of context:
`canvas.getContext('webgl2')` is `null` on a WebGPU canvas), and counts work on both: the
WebGL 2 draw methods and those of `GPURenderPassEncoder`, the WebGL objects and the WebGPU
buffers and textures, lost contexts and destroyed devices (`device.lost`). Software WebGPU is
slow: give the specs a `testTimeout`, wait for asynchronous releases with a deadline, and
compare no pixels exactly; `optimizeDeps.include: ['three', 'three/webgpu']` keeps Vite from
reloading the page when it finds `three/webgpu` mid-run.
