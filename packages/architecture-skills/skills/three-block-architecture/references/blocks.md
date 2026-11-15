# Blocks

The block catalogue, by layer. Each block's layer, required tags, spec kinds and the blocks
it may import are rows of the profile's Blocks table; this page says what each block is for,
with examples, and spells out the contracts of the blocks that have one. The rules are the
constitution's **Blocks**, **Ownership**, **Shaders and GPU** and **Scene** decisions.

## Domain layer

| Block        | Responsibility                                                                            | Examples                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `.model.ts`  | Plain data types and constants: params, specs, manifests, saves, snapshots, recipe tables | `PlasmaParams`, an asset manifest, `SaveV2`, `InputCmd`, key maps, a shape catalogue                                      |
| `.rules.ts`  | Pure calculations and transitions                                                         | `Track.valueAt`, timeline rows, `clampParams`, `simulate()`, `migrate()`, damage rules, easing, steering, FSM transitions |
| `.events.ts` | Event payload maps for the host and internal buses                                        | `PlasmaEvents`, `GameEvents`                                                                                              |

## Shader layer

| Block        | Responsibility                                                                                                                                                                                | Examples                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `.node.ts`   | TSL graph functions (`Fn`), or a factory of a node graph with its uniform nodes; the primary shader block (D23). Runs on both backends of `WebGPURenderer`                                    | fresnel rim, noise warp, gradient, lens and vignette post node |
| `.shader.ts` | GLSL for `WebGLRenderer`: `/* glsl */` template strings plus the typed uniform contract the source expects. Chunks compose by import and interpolation, replacing `#include ./lib/noise.glsl` | noise chunk, `wave` vert/frag, retro present, SDF scene        |

A `.node.ts` exports a TSL function, or a factory that returns the node with the uniform
nodes that drive it, so a material or a pass writes `uniform.value` without a recompile:

```ts
import { Fn, mix, sin, uniform, uv, vec3 } from 'three/tsl';

/**
 * A gradient along u that drifts with time.
 * @backend webgpu
 */
export const gradientColor = Fn(([coords, time, hue]) =>
  mix(
    vec3(hue, 0.4, 0.8),
    vec3(0.9, hue, 0.3),
    sin(coords.x.mul(6.28).add(time)).mul(0.5).add(0.5),
  ),
);

// In a .material.ts: material.colorNode = gradientColor(uv(), time, hue), with time = uniform(0).
```

A `.shader.ts` exports one shader (or one chunk) as a constant, with its uniform type:

```ts
/** Uniforms the plasma fragment shader reads. */
export type PlasmaUniforms = {
  uTime: { value: number };
  uScale: { value: number };
  uPalette: { value: Texture | null };
};
```

Keep the uniform type in the same file only when it is the shader's coupled companion
(source-organization "coupled pair"); otherwise put it in its own `.shader.ts` type file.

## GPU layer

| Block           | Responsibility                                                                                                                                                                                                                                    | Examples                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `.kit-model.ts` | Types shared by several gpu, scene or runtime blocks that name three.js or kit objects ([below](#shared-threejs-types))                                                                                                                           | `Prefab`, `ShapePrefab`, `LiquidUniforms`, `LookContext`, `SceneKit`, `RecipeKits`    |
| `.material.ts`  | Creates one material (a node material with TSL slots; on WebGL a `ShaderMaterial`, `RawShaderMaterial` or an `onBeforeCompile` patch) and returns it with a typed uniform handle, or decorates an existing one ([composition.md](composition.md)) | wave, toon + rim, water, plasma                                                       |
| `.geometry.ts`  | Creates a `BufferGeometry` with custom or instanced attributes                                                                                                                                                                                    | per-vertex random, particle refs, instance phases                                     |
| `.texture.ts`   | Creates generated textures (`DataTexture`, `CanvasTexture`, LUTs)                                                                                                                                                                                 | palette, tunnel LUT, font strip, matcap, heightmap                                    |
| `.pass.ts`      | One post-processing stage: a TSL post-node function from nodes to a node (WebGPU), or a `ShaderPass` definition (WebGL)                                                                                                                           | retro quantise/dither, lens, crossfade                                                |
| `.pipeline.ts`  | The post chain: a `RenderPipeline` (`pass(scene, camera)`, MRT, `outputNode`, one output transform) on WebGPU; render targets, passes, resize and `OutputPass` on WebGL                                                                           | present chain, bloom composer                                                         |
| `.compute.ts`   | A GPU simulation or bake that owns its storage buffers (TSL compute) or ping-pong targets (WebGL)                                                                                                                                                 | TSL compute particles, GPU fire, feedback, `GPUComputationRenderer`, a heightmap bake |

### Shared three.js types

A type is a `.kit-model.ts` when several gpu, scene or runtime blocks share it and it names
three.js or kit objects: a prefab handle (`{ root, dispose }`), a uniforms type, a look's
context, a scene kit of shared geometries and materials, an engine's seam of builders. It
holds types only and imports `three` and other packages' kit tiers with `import type`, the
same type-only rule as the shader layer, which review checks. It may name other
`.kit-model.ts` types, a `.shader.ts` uniform type it extends and plain `.model.ts` data. It
never sits in a domain lib, and a `.model.ts` that names one becomes a `.kit-model.ts` too.

Pick the block by what the type names and who uses it:

- **`.model.ts`**: plain data a host could serialise (params, specs, recipe tables, saves). It
  names no three.js type.
- **A `.shader.ts` type file**: the uniform contract one shader or chunk expects, kept with
  the shaders.
- **A factory's companion**: a type only one factory returns or takes stays in the factory's
  file (source-organization "coupled pair").
- **`.kit-model.ts`**: everything else that names three.js objects and is shared, such as a
  uniforms type that extends a chunk's with the material's own uniforms.

Example: `@three-demos/fire`'s `prefab.kit-model.ts` (`Prefab`) is the handle its prefabs
return; `@three-demos/liquid`'s `liquid-uniforms.kit-model.ts` extends the height chunk's
uniforms.

### Painted textures

A texture painted with a 2D context (leaves, bark, an atlas, a minimap face) is a
`.texture.ts` that takes the context as an argument, so the block creates no canvas and
reads no global; the engine or an `.assets.ts` creates the canvas and passes its context.
The pixel maths, when it is more than a few calls, is a `.rules.ts` that writes bytes.
Colour space follows what the pixels hold: a painted texture is sRGB
(`colorSpace = SRGBColorSpace`, or the colours come out dark under colour management), a
computed `DataTexture` of linear values (a heightmap, a noise field) stays linear.

### Compute blocks

On `WebGPURenderer` a `.compute.ts` is TSL compute: a kernel `Fn(() => { … })().compute(count)`
over storage buffers (`instancedArray`, `storage`), run by `renderer.compute(kernel)` each step
or `await renderer.computeAsync(kernel)` for a bake. The count is one number, which the WebGL 2
fallback needs too; a kernel that needs what the fallback lacks (storage textures, workgroup
memory, atomics, an indirect count) carries `@requires native-webgpu`
([architecture.md](architecture.md), "The backend"). On `WebGLRenderer` it is render-target
ping-pong (`GPUComputationRenderer`) or a bake through an override material.

Either renderer, a `.compute.ts` takes one of two shapes:

- **Stepping**: it owns its buffers or ping-pong targets and exposes `step()` and a readable
  result (a texture, a buffer attribute), which the engine samples every frame.
- **Baking**: it renders once (a height-encoding override material over a top-down
  orthographic camera, then `readRenderTargetPixels`) and returns CPU data, such as a
  `Float32Array` with its bounds, which pure `.rules.ts` then sample.

A WebGL bake restores what it changed on the caller's renderer: the bound render target and
any `scene.overrideMaterial`; TSL compute binds no render target. Meshes that should not be baked are marked with a
`userData` key the package exports as a `.model.ts` constant, so the bake and the code that
builds those meshes agree on the name. A bake states in `@failure` what happens when the
read-back fails.

### Post on WebGPU

A `.pipeline.ts` on `WebGPURenderer` is a `RenderPipeline`: a scene pass
(`pass(scene, camera)`, with MRT outputs such as `emissive` when a block writes them), a graph
of `.pass.ts` functions from texture nodes to a node, and the pipeline's `outputNode`.
Everything inside it is linear colour: the pipeline applies tone mapping and the output colour
space once, after the graph (`outputColorTransform`), and a graph that needs display colour
before its end (FXAA) calls `renderOutput()` and switches the automatic transform off, never
both. The engine calls `pipeline.render()` in place of `renderer.render(scene, camera)`. The
pipeline owns its passes' nodes and disposes them.

### Render targets are replaced, not reconfigured

These rules hold for a block that owns its own render targets, on either renderer (a WebGL
composer, a surface, a WebGPU block that renders into a `RenderTarget`). A target's filtering (nearest for a pixelated look, linear for smooth scaling) is fixed
when it is created, so a pipeline that switches filtering at runtime disposes the old target
and creates a new one. Expose the current target through a getter, and have consumers read
it every frame instead of caching it. `EffectComposer` reads the renderer's pixel ratio when
it is constructed, so a pipeline's `setSize(width, height, pixelRatio)` passes the ratio
through explicitly.

## Scene layer

| Block         | Responsibility                                                                                                                      | Examples                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.prefab.ts`  | Builds an `Object3D` subtree from params or loaded assets and returns `{ root, dispose }` plus typed handles                        | lantern, ground, `buildLevel`, `spawnAll`, `scatterInstanced`, `makeLOD`, a character rig |
| `.effect.ts`  | A self-contained renderable unit: `setParams()`, `render(renderer, target, time)`, `resize()`, `dispose()`                          | demoscene parts (plasma, tunnel, fire), shader showcase scenes                            |
| `.surface.ts` | Renders an effect into a render target it owns and exposes it as `texture` for any scene                                            | a cube textured with a plasma, a live screen on a prop                                    |
| `.prop.ts`    | Builds or adopts an attachment for a mount of a subject and returns `{ root, dispose }` plus its press shapes and `evaluate(state)` | a hat, glasses, a pocket watch, shoes, an imported `.glb`                                 |

### Prefabs

A prefab returns `{ root, dispose }` plus any typed handles its controller needs (the joints
to pose, the uniforms to drive), as the companion type of its factory. It never disposes
shared geometry or materials, and says so in `@owns`.

A prefab may also **adopt** a loaded subtree instead of building one: it clones the subtree
when the model is instanced (`SkeletonUtils.clone` for a skinned one), finds the nodes it
needs by the names in a recipe table (a `.model.ts` of bone and clip names per character)
and returns them as a typed rig. An adopted subtree's geometry and materials belong to the
`.assets.ts` that parsed them, so the prefab owns nothing of them and its `dispose()`
detaches the clone.

Examples: `@three-demos/fire`'s `createFlame` returns a flame group with typed uniforms and
an `update`; `@three-demos/bunnies`' prefabs return rigs whose joints the controllers pose.

### Props

A prop is something a subject wears: a hat, glasses, a collar, shoes. Its factory takes a mount
of the subject (a `.kit-model.ts` handle with the object to attach to and the frame and box the
prop fits into), the prop's params and the assets it was given, and returns `{ root, dispose }`
plus its handle (D77):

- **Three sources, one contract.** An algorithmic prop builds its geometry in code; a `glb`
  prop adopts a parsed file the way a prefab does (it owns nothing of the file's geometry and
  materials); a hybrid prop adopts a file and animates its named parts (a gear that spins, a lid
  that opens). A host can swap a code-built shape for a file without changing the prop's
  behaviour.
- **Press shapes.** Simple shapes in the prop's own frame (ellipsoids, discs, capsules, rounded
  boxes, bands) that the subject's materials use to keep its surface out of the prop, such as fur
  pressed under a hat. They are plain rows; the subject decides how to apply them.
- **Seekable layers.** `evaluate(state)` puts the prop's animated layers into a plain-data state,
  like a subject's (D72). A simulation (a chain, a scarf) is not seekable: it is a `.system.ts` or
  `.controller.ts` of the runtime that reads the prop's handle, so the prop itself has no loop.
- **Catalogue row.** The prop's `kind`, `label`, the subject's slot it occupies (a zone such as the
  head top or the feet), its source, its colour slots and its param spec rows are a `.model.ts` in
  the host tier, so a configurator lists and configures props without three.js.

Example: a pocket watch is `createPocketWatch` (`.prop.ts`: the case, the dial, the press disc
behind it), `pocketWatchProp` (`.model.ts`: zone `neck`, colour slots `brass` and `dial`) and
`PocketWatchChain` (`.system.ts`: the chain simulated after the subject is posed).

### Effects

An effect never touches the canvas: it renders into the target it is given (or the current
target when given `null`). That is what lets an engine composite, crossfade or post-process
effects.

### Surfaces

A surface is the inverse host of an effect: where an engine owns the renderer, the canvas
and the loop, a surface borrows the caller's `renderer` and owns only a render target, so it
works inside someone else's three.js scene.

- **Caller-driven.** It has no loop and no listeners. The caller calls `update(dt)` before
  rendering the scene that samples `texture` (every frame, or only when the texture should
  change) and `resize(width, height)` when the texture size should change.
- **Restores state.** `update` binds its own target and puts back the target that was bound
  before the call, so it can run in the middle of the caller's frame.
- **Stable texture.** `texture` is the same object for the surface's lifetime, so a
  material's `map` is assigned once. The surface therefore keeps its output target's
  filtering fixed; sampler-state changes happen on internal targets only.
- **Same look as the engine.** When the params ask for post passes (a retro look: fixed
  resolution, fewer levels, dithering) the surface applies them into the owned target with
  the same rules the engine uses, so the texture shows what the canvas would.
- **Linear output.** The texture holds linear colour (a half-float target); the material
  that samples it converts to display colour. Surfaces never call `OutputPass`.
- **Scalar outputs.** A surface may offer a scalar output (`output: 'height'`) and a
  mirrored wrap, fixed at creation, for use as a displacement map.
- **Borrowed renderer.** `dispose()` releases the surface's own targets, effect and passes
  and is idempotent; it never disposes the renderer.

## Runtime layer

| Block            | Responsibility                                                                                                                                                 | Examples                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.engine.ts`     | Composition root and the host-facing factory: renderer, canvas, resize, loop, systems, controls, reverse-order disposal ([runtime.md](runtime.md))             | `createPlasmaEngine`, `Engine`, `Game`                                                                           |
| `.element.ts`    | A custom element over the package's host tier: attributes to params, commands to methods, events to DOM events, connection to mount ([hosting.md](hosting.md)) | `defineDesktopRacersElement`, `defineBlocklandElement`                                                           |
| `.loop.ts`       | Frame scheduling: `Timer`, `setAnimationLoop`, a fixed step and interpolation fraction, pause, time scale                                                      | `FrameLoop`, a fixed 60 Hz loop, a hit-stop scale                                                                |
| `.system.ts`     | Per-frame behaviour over the world                                                                                                                             | ECS systems, physics step, mixers, tweens, juice, renderer state, streaming                                      |
| `.controller.ts` | Per-frame behaviour of one object                                                                                                                              | `CharacterController`, `CharacterAnimator`, `FollowCamera`, `BodyView`, `EnemyBrain`                             |
| `.world.ts`      | Entity store and component types (components may reference `Object3D` or physics bodies)                                                                       | ECS `World` / `Entity`                                                                                           |
| `.controls.ts`   | Device listeners turned into action state: keyboard, pointer, pointer lock, gamepad, touch; `OrbitControls` wrappers                                           | `Input`, `KeyboardControls`, `PointerControls`, a virtual joystick                                               |
| `.overlay.ts`    | HTML children of the engine's container anchored to world points or to the screen                                                                              | labels and speech bubbles over heads, a crosshair, a water tint, a minimap                                       |
| `.assets.ts`     | Loading, caching, reference counting and progress for external assets, and the one place shared GPU resources with engine lifetime are created and disposed    | an asset manager (glTF, Draco, KTX2, Meshopt, HDR), a resource cache, a toon material cache, a PMREM environment |
| `.exporter.ts`   | A function from a kit's prefab, scene or surface and its build params to the bytes of a `.glb` or a PNG, run in a browser by the build's asset pipeline        | a baked desk (`exportDesk`), a poster of a level                                                                 |
| `.gateway.ts`    | Runtimes other than rendering                                                                                                                                  | a Rapier physics gateway, navigation, audio, save storage, netcode, a platform SDK                               |

### Elements

An `.element.ts` is a host of its own engine, written once in the package so a page needs none: a
function `define<Name>Element(name?)` that defines a custom element and returns its class. It
imports only the host tier's blocks (the engine factory, the domain's specs, rules and events), so
the block-allow-list keeps the kit and the runtime out of it, and it touches the DOM (D11). It
states `@owns` (the class, and per element its engine), `@cleanup` (the element disposes its engine
on `dispose()` or once it stays removed) and `@lifetime`; its specs run in a browser: an element
that draws, maps an attribute and a command and re-dispatches an event, and one removed or moved.
A product with several elements keeps their shared code in its runtime package, so each block is a
few lines of config. [hosting.md](hosting.md) has the element's attributes and the standalone file.

### Overlays

An overlay owns HTML children of the engine's container, positioned either at a world point
the engine projects each frame (a label, a speech bubble; hidden behind the camera) or at a
place on the screen (a crosshair, a tint over the view, a minimap, a virtual control's
graphic). It draws only what is tied to the simulation's immediate state; menus, panels,
settings and results are the host's. Its styling is the engine's (class names it sets,
inline styles it owns), not the host's, except fonts, which come from the document.
`dispose()` removes every element it added. The pure maths (`projectToScreen`) is a
`.rules.ts`, tested in Node.

### Controls

A `.controls.ts` turns device events into action state the systems read. It listens on the
canvas, not on `window`, and may create the elements it listens on (a virtual joystick's
touch area, on-screen buttons), which it lists in `@owns` and removes on dispose. A controls
block that wraps a browser API (`IntersectionObserver`, `matchMedia`, pointer lock) does
nothing where the API is missing.

### Assets

An `.assets.ts` is where shared GPU resources with engine lifetime are created and disposed:
caches of materials, geometries and textures made by `.material.ts`, `.geometry.ts` and
`.texture.ts` blocks, parsed models, and textures the renderer bakes (a PMREM environment
needs the renderer, so it can't be a `.texture.ts`). It owns what it parsed and disposes it;
the prefabs that adopt a parsed subtree own nothing of it. Its `@failure` states what a
failed load does (a rejected creation, a fallback mesh).

A package's `.assets.ts` that loads the build's output reads the generated manifest (rows
named by group), preloads a group without creating scene objects, reports the group's
progress and, in development, the GPU memory of what it holds. It serves `WebGLRenderer` and
`WebGPURenderer` alike: the renderer is read only to detect the compressed texture formats
the GPU takes, and a `WebGPURenderer` is initialised first. Meshopt's decoder is small and
bundled; the Draco and Basis decoders are fetched from a base URL the host passes only when
a file needs them, and a missing decoder rejects the load.

### Exporters

An `.exporter.ts` turns what a kit builds into a file, so a procedural scene can load as
fast as an authored one. It is a function `(params) => Promise<ArrayBuffer>`: it builds the
scene or the prefab with the kit's own blocks, maps the node materials to glTF PBR
(`GLTFExporter` reads `MeshStandardMaterial` and `MeshBasicMaterial`; a node material has no
glTF form, so an exporter builds the glTF material it means), names the nodes and materials a
loader finds them by (`extras` carry the roles that glTF has no field for: a collider, a
hidden node, the sticky note a runtime repaints), and samples a pure animation rule into
clips where the package has one. It runs in headless Chromium, where a canvas and a GPU
adapter exist, started by the build's asset pipeline from the package's recipe; an engine
never calls one. It states `@owns`, `@cleanup` (it frees every geometry, material, texture
and canvas it made before it answers) and `@failure` (what a scene that cannot be exported
throws), and its specs are an edge case for the failure path and an invariant that two runs
give the same bytes, so the build's cache and a reviewer's diff mean something.

### Gateways

A gateway wraps a runtime other than rendering behind a small API in the package's own
terms; the vendor's types stay inside it (a physics body is a number). A gateway may sit in
the kit tier when it touches no DOM and owns no loop.

A **storage gateway** (saves, best laps, settings):

- namespaces its key by package and schema version (`<package>:<record>:v2`), so packages
  and versions never read each other's data;
- parses what it reads through a `.rules.ts` that validates and migrates, so a corrupt or
  old value becomes a default instead of an exception;
- debounces writes and flushes the pending one on `dispose()`;
- keeps the value in memory when storage is missing or throws (private mode, a quota), and
  says so in `@failure`.

### Systems and controllers

Only `.engine.ts` imports across the whole runtime layer. Systems and controllers talk
through the world, events or a gateway, never by importing each other. An animator
controller owns its `AnimationMixer` and actions, never the clips, which belong to the
`.assets.ts` that parsed them. The engine's TSDoc lists the order its systems and controllers
run in, and a block that must run after another (a pose that corrects the mixer's output)
says so with `@after`. [runtime.md](runtime.md) has the frame order.

## Helpers

| Block      | Responsibility                                                          | Examples                                                                                       |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.util.ts` | A product-independent helper that may use `three` but no suffixed block | `Emitter`, `Pool`, `StateMachine`, `disposeDeep`, `pickEntity` (raycast), `pickGround` (plane) |

A `.util.ts` works for any product: an `Emitter` imports nothing, `disposeDeep` imports
`three`. There are no unsuffixed source files.

## Testing

`.fake.ts` and `.fixture.ts` hold fakes (a fake renderer that records `setRenderTarget` and
`render` calls, a fake container) and fixtures. Production code never imports them.
