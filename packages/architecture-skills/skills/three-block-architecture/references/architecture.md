# Architecture

The package boundary and the layers. The rules are the constitution's **Package boundary**
and **Layers** decisions; this page explains them.

## The package boundary

```text
┌──────────────── host (Angular, React, a plain page) ────────────────┐
│  state ─▶ integration block ──── host tier ───┐                      │
│  state ◀─ integration block ◀─── events ──────┤                      │
└───────────────────────────────────────────────┼──────────────────────┘
                                                │ plain data only
┌──────────────── three.js package ─────────────┼──────────────────────┐
│  src/index.ts   host tier:  createXEngine(), plain-data models, events│
│  src/kit.ts     kit tier:   effects, materials, passes, prefabs (3D)  │
│                                                                       │
│  runtime ─▶ scene ─▶ gpu ─▶ shader ─▶ domain                          │
└───────────────────────────────────────────────────────────────────────┘
```

- **Dependencies enforce it.** The package's `package.json` lists `three` (as a peer
  dependency, below) and no UI framework; the host's lists the package and no `three`. With
  a strict package manager (pnpm's isolation) a forbidden import doesn't resolve. The host
  needs no `@types/three` either, because the host tier exposes no three.js types.
- **Host-only globals.** Host-tier types may mention DOM types (`HTMLElement`), which every
  browser host has, but nothing from `three`.
- **Built output.** A host consumes the package's `dist/` (in a monorepo, a build task the
  host's build depends on). Shaders are TypeScript template strings, so the build needs no
  GLSL plugin and the host's bundler no loader.

### Two public tiers

The package's `exports` has two entries:

- `"."`, the **host tier**, for any UI framework: engine factories, the plain-data
  `.model.ts` and `.events.ts` types and whatever specs the host renders (parameters,
  bindings). No three.js type in any exported signature.
- `"./kit"`, the **kit tier**, for other three.js code: effects, materials, passes, prefabs,
  surfaces, and runtime blocks that touch no DOM and own no loop (a physics gateway, a prefab
  that steps a simulation when its caller says so). It exposes three.js types, and its
  objects are used with the consumer's own renderer, scene and materials, so the consumer's
  `three` and the package's must be one copy. A runtime block in the kit tier keeps its
  vendor's types out of its signatures (a physics body is a number).

A package may depend on another package's kit tier (a regular dependency, imported as
`<package>/kit`). Its host tier still exposes no three.js type, and `three` stays a peer of
both, so there is one copy. A package whose engine only composes other packages' kits is a
**composition engine**.

Example: `@three-demos/compose-lab` composes five kit dependencies from a recipe of plain
data.

A product that has several packages usually adds a shared kit package of its own (a frame
loop, controls, a present pipeline, the host-contract types). It splits its entries the same
way: a `three`-free entry hosts and domain libs may import, and an entry with three.js types
for packages only. That kit and the contract it defines are the product's, not this skill's
(non-goal N1).

### `three` as a peer

`three` is a peer dependency of the package, pinned to one minor version, with
`@types/three` on the same minor, and also a devDependency so the package's own build, lint
and tests have it. A regular dependency would let a kit consumer end up with two copies of
three.js, which breaks `instanceof` checks and shares no GL state (three warns "multiple
instances"). Who supplies `three`:

- a kit consumer declares `three` itself, on the peer range;
- a host-tier-only app doesn't declare it. In a workspace the package is linked, so it
  resolves `three` from its own `node_modules` (its devDependency); for an installed copy,
  pnpm's default `auto-install-peers` installs the peer. Either way there is exactly one
  version, which `pnpm why three` shows;
- the built `dist/` keeps `three` external (the bundler's externals; pkgroll does it for
  peers by default).

### The backend: `WebGPURenderer` by default

A package picks its renderer and states it in `@backend` (N5, D21). The default, which the
template follows, is `WebGPURenderer` with TSL: it runs on WebGPU where the browser has an
adapter and falls back to its own WebGL 2 backend by itself ("WebGPU is not available, running
under WebGL2 backend"), where TSL compiles to GLSL. So a WebGPU package needs no WebGL copy;
`@backend webgpu` covers both, and a block that needs what the fallback lacks says
`@requires native-webgpu` (below). `@backend webgl` is for code built on `WebGLRenderer`
(GLSL, `onBeforeCompile`, `EffectComposer`), and `@backend any` for what works with either
renderer (the built-in materials, which `WebGPURenderer` turns into node materials).

Imports (D65):

- the renderer, `RenderPipeline`, node materials and node classes from `three/webgpu`, TSL
  functions from `three/tsl`, TSL addons from `three/addons/tsl/…`;
- core classes (geometries, textures, cameras, maths, `Scene`, loaders) from `three` or from
  `three/webgpu`: both builds import `build/three.core.js`, so a class has one identity in
  both, and code that imports only core classes (domain, game logic, controllers, loaders,
  geometry kits) serves WebGL and WebGPU packages alike;
- addons that import bare `three` work beside `three/webgpu` for the same reason.

A WebGPU-only host may alias `three` to `three/webgpu` in its bundler (Vite's
`resolve.alias`), which keeps `WebGLRenderer` out of its bundle; the package doc says whether
the package's host does. A host that also bundles WebGL engines gains nothing from it.

**The fallback's gaps.** On the WebGL 2 backend (three.js r186), compute runs through
transform feedback: a dispatch count is one number (an array or an
`IndirectStorageBufferAttribute` warns once and falls back to the node's count), and its GLSL
builder writes no storage textures (`textureStore`), no workgroup arrays and no atomics, while
a barrier compiles to nothing. A block that uses one of them carries
`@requires native-webgpu`, and the engine's `@failure` says what the fallback does: skip
the block, take a simpler path, or reject the creation. A spec covers that path
(D66, [documentation-and-testing.md](documentation-and-testing.md)).

### Assets

Binary assets (models, images, audio) live in `<package>/assets/` and ship beside the built
output under `dist/assets/`. A manifest `.model.ts` lists each file with its path, size,
format, licence and credit, so attribution ships with the package; an `.assets.ts` loads
them, and owns and disposes what it parsed. The package doesn't know where the host serves
its files: the host passes a base URL at creation (the option's name is the product's).
Compression, large-file storage and CDNs are out of scope (non-goal N6).

## Layers

A layer fixes which packages a block may import; the profile's Layers table lists them.
Lower layers never import higher ones:

| Layer   | Blocks                                                                                                                    | Imports                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| domain  | `.model.ts` `.rules.ts` `.events.ts`                                                                                      | nothing                                                   |
| shader  | `.node.ts` (TSL, the default) `.shader.ts` (GLSL, WebGL only)                                                             | `three` for types only, `three/tsl`                       |
| gpu     | `.kit-model.ts` `.material.ts` `.geometry.ts` `.texture.ts` `.pass.ts` `.pipeline.ts` `.compute.ts`                       | `three` and its addons, `three/webgpu`, `three/tsl`       |
| scene   | `.prefab.ts` `.effect.ts` `.surface.ts`                                                                                   | as gpu                                                    |
| runtime | `.engine.ts` `.loop.ts` `.system.ts` `.controller.ts` `.world.ts` `.controls.ts` `.overlay.ts` `.assets.ts` `.gateway.ts` | as gpu, plus the runtime vendors the package doc approves |
| utility | `.util.ts`                                                                                                                | `three`                                                   |
| testing | `.fake.ts` `.fixture.ts`                                                                                                  | anything                                                  |

The shader layer and `.kit-model.ts` may use `three` only in type positions (a uniform type
naming `Texture`, a prefab handle naming `Object3D`); no tool checks the type-only part yet, so
review does. A `.kit-model.ts` never sits in a domain lib ([blocks.md](blocks.md), "Shared
three.js types").

A runtime vendor (a physics engine, a navigation mesh library) is approved per package in
its package doc's Approved Packages, with a reason; a package that uses one lists it as a
regular dependency and keeps its types out of public signatures. Example: `@three-demos/destruction`
approves `@dimforge/rapier3d-compat` for its runtime layer.

### DOM access

Only `.engine.ts`, `.element.ts`, `.controls.ts`, `.overlay.ts`, `.assets.ts` and `.gateway.ts` touch
`window`, `document`, `addEventListener` or other browser globals. Everything else receives
what it needs as arguments (a container, a 2D context, a time), which keeps it testable in
Node: the pure maths of an overlay (projecting a world point to container pixels) is a
`.rules.ts`, and a texture that paints with a 2D context is handed the context.

### Library roles

| Role       | Holds                                                                             |
| ---------- | --------------------------------------------------------------------------------- |
| domain     | `.model.ts`, `.rules.ts`, `.events.ts`                                            |
| render-kit | the shader, gpu and scene blocks of one capability (an effect, a material family) |
| runtime    | runtime blocks shared by engines (loop, controls, assets, gateways)               |
| engine     | `.engine.ts` blocks and the runtime blocks only one engine uses                   |
| utility    | product-independent `.util.ts` helpers                                            |
| testing    | fakes and fixtures                                                                |

The profile's Library roles table says which role may depend on which; production never
imports a testing lib. A lib declares its role in its lib doc. A product's host-contract lib
(the types and rules a host shares with every engine) is a domain lib shared by package
name, not a role of its own.
