# Composition

How kits of different packages meet. The rules are the constitution's **Composition**
decisions; this page explains them with examples.

Kits of different packages meet where three.js lets code meet. A composition engine uses
them through their kit tiers ([architecture.md](architecture.md)); the contracts below keep
the kits independent of each other.

## Four joints

- **A `BufferGeometry`.** Any shape takes any material. A geometry transform is a function
  from geometry to geometry: adding per-face attributes, subdividing the faces (vertices
  inside them, for a displacement), smoothing normals (one direction per position, so
  displaced faces stay joined), or a fracture.
- **A `Texture`.** A `.surface.ts` output used as `map`, `displacementMap` or any other map.
- **A material decorator.** A `.material.ts` block that changes an existing material instead
  of creating one: it wraps a node material's slots (TSL), or patches a `WebGLRenderer`
  material through `onBeforeCompile` (GLSL).
- **Named MRT outputs.** A block writes a named output beside the colour (`emissive`, a
  velocity) through its material's MRT node (`material.mrtNode = mrt({ emissive: … })`), and an
  engine's `RenderPipeline` reads it by that name from its scene pass
  (`scenePass.getTextureNode('emissive')`), for a bloom of the emissive parts only. The name is
  the contract: the writing kit exports it as a `.model.ts` constant, and a pipeline that finds no
  writer reads black.

## Subjects and presenters

A model meant to be shown (a product, a character, a machine) is a **subject**: a kit that owns no
camera, light, environment, stage, post or input (D71). A **presenter** is a composition engine of
a subject and, optionally, a stage (D73); it owns everything around the model. The split is the
industry's: an asset, a viewer that frames it, a page that drives it (`<model-viewer>`; drei's
`Stage`, `Bounds` and `Html`).

The subject contract is a fifth joint beside the four above:

| A subject offers    | As                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `root`, `dispose()` | a prefab (D30); built from params, or adopted from its baked file with the live look put back (D76)                   |
| `evaluate(state)`   | a `.controller.ts` that writes a plain-data state onto the scene; every layer is seekable (D72)                       |
| its parts           | a `.model.ts` of rows (`id`, `label`, `description`, `group`) in the host tier; the kit adds objects, bounds, anchors |
| its render outputs  | the named MRT outputs its materials write (`emissive`), which the presenter's pipeline reads by name                  |
| its params          | spec rows marked `build` (rebuild or re-bake) or `look` (a uniform, live), with a `group`                             |

A stage (a floor, a dock, a backdrop) is a prefab of its own, or an entry of its own as
`ember-grove`'s `./stages`, so one subject stands on several stages and one stage carries several
subjects. A subject may offer mounts for **props** (D77): attachments it wears, each a `.prop.ts` of its
own lib, attached and removed by the presenter. The subject's contract then also names its mounts
(a `.kit-model.ts` handle per mount) and the slots a prop may occupy (plain rows in the host tier),
and its materials read the press shapes the attached props lend it. A presenter starts as the subject package's own engine (D61) and moves to a shared
package when a second subject needs one.

Example: `prototypes/exo-suit` of this repository's lab: `exo-suit-kit` holds the subject
(`createExoSuit`, `ExoSuitSubjectController`, `adoptExoSuit`) and the dock (`createDock`),
`exo-suit-engine` the presenter (`createExoSuitEngine`) and its element.

## Effects and surfaces across kits

The `.effect.ts` and `.surface.ts` contracts (D28, D29) are shared by type, not by import: a
runtime package may publish them as `.kit-model.ts` types (`Effect`, `Surface`), and an effect of
one kit then plugs into a surface of another. The types are structural, so a kit that cannot import
the runtime still satisfies them. Libs that are copied between labs as units ([units.md](units.md))
rely on this joint to compose, and a unit of one kit may also import a unit of another kit of its
product by package name ([units.md](units.md), D64).

## The decorator contract

```ts
export function applyLiquidDisplacement(
  material: Material,
  options?: LiquidDisplacementOptions,
): LiquidDisplacementHandle; // { uniforms: LiquidDisplacementUniforms; dispose(): void }
```

Every decorator:

- declares the geometry attributes it reads in `@attributes`, or `none`;
- is order-independent with other decorators, or says which must come first;
- releases the textures and targets it owns in `dispose()`;
- is built for one recipe and replaced, not un-patched, when the recipe changes.

### A TSL decorator (the default)

A decorator of a node material (`MeshStandardNodeMaterial`, or a built-in material that
`WebGPURenderer` turns into one) wraps the slots it changes and keeps what they held:

```ts
const previous = material.positionNode ?? positionLocal;
material.positionNode = previous.add(normalLocal.mul(liquidHeight(uv(), uniforms.time)));
material.needsUpdate = true;
```

- it wraps only the slots its TSDoc lists (`colorNode`, `emissiveNode`, `normalNode`,
  `positionNode`, `opacityNode`, …), reading the slot's current node or its default, so two
  decorators of one slot compose in the order they are applied;
- it returns its uniform nodes (`uniform(0)`) as `uniforms`, which the caller writes without a
  recompile;
- it sets `material.needsUpdate = true`;
- it is `@backend webgpu`.

### A GLSL decorator (`WebGLRenderer` only)

- chains the material's existing `onBeforeCompile`: it calls the previous one first;
- appends its name and options to `customProgramCacheKey`, so two recipes don't share a
  compiled program;
- sets `material.needsUpdate = true`;
- replaces or extends named `#include <…>` chunks only, and its TSDoc lists them; a patch
  that needs one line of a chunk changes that line, not the whole chunk, so other features of
  the chunk (`USE_BATCHING`, instancing) survive;
- is `@backend webgl`.

### Names

Every uniform, attribute, varying, function and `#define` a decorator (or its chunks) adds to
another material starts with its package's name, in the GLSL casing for GLSL and with the same
name for a TSL uniform or varying node (`uniform(0).setName('uLiquidTime')`,
`varying(…, 'vDestructionMeltAmount')`): `uLiquidTime`, `vDestructionMeltAmount`,
`destructionHash`, `uComposeTriplanarMap`. Decorators of different packages then never declare
the same name.

- Decorators of one package that run together share an identifier only through a chunk
  pasted once behind a marker (GLSL) or a node they both import (TSL).
- A chunk shared by a product's kit (a noise function) keeps its name and is pasted behind a
  guard.
- A package's own full shaders (a `ShaderMaterial` it creates) are outside the rule.
- A geometry attribute keeps the name of its contract (`aOrig`, `aCentroid`); in GLSL, two
  decorators that both declare it wrap the declaration in the same
  `#ifndef ATTRIBUTE_<NAME>_DECLARED` guard, and in TSL both read it with
  `attribute('aCentroid', 'vec3')`, which declares nothing twice.

Examples: `@three-demos/liquid`'s `applyLiquidDisplacement` puts a shared heightfield on any
material; `@three-demos/destruction` has seven decorators that compose (both GLSL, on
`WebGLRenderer`).

## The face-attribute contract

Per-triangle attributes have one home: a geometry transform and the list of names it
writes, in a kit the composing packages share by package name. A non-indexed copy of a
geometry gets, per triangle, its centroid, its face normal, seeded randoms and a side flag,
keeping `position`, `normal`, `uv` and `color`. Decorators and geometry blocks name these
attributes in `@attributes`.

Example: this repository's shared kit names them `aCentroid` (vec3), `aFaceNormal` (vec3),
`aRand` (vec4, four seeded randoms per triangle) and `aSide` (float, 0; prisms set 1 on
their sides), written by `withFaceAttributes` and listed in `faceAttributeNames`.

## The recipe pattern

A package that offers choices exports its registry as a `.model.ts` table of plain entries,
with the flags its compatibility rules need (`hasUv`, `closed`); the kit maps a key to a
factory (`createShapePrefab(key, …)`); the engine's options are generated from the table, so
the host picks by key and the engine composes. A composition engine validates a recipe with
a `.rules.ts` and reports an incompatible one through its events rather than throwing.

The same tables drive other choices: a character catalogue (bone and clip names, speeds,
licence) for adopted rigs, a style catalogue for the renderer state a look needs
([runtime.md](runtime.md)).

Examples: `@three-demos/shapes` has 104 shapes as a recipe catalogue with pure samplers and
kit builders; `@three-demos/compose-lab` is the composition engine (`checkRecipe` and a
compatibility readout).
