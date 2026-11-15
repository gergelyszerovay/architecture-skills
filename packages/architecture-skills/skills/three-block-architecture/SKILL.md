---
name: three-block-architecture
description: Design, implement, or review framework-independent three.js and shader packages built from suffix-named blocks (.engine.ts, .effect.ts, .material.ts, .node.ts, .shader.ts, .pipeline.ts, .prefab.ts, .prop.ts, .surface.ts, .exporter.ts, .system.ts, .controls.ts, .overlay.ts, .assets.ts, .gateway.ts, .rules.ts, …) with a plain-data host tier and a three.js kit tier, on WebGPURenderer and TSL by default. Use when creating or restructuring a three.js package, adding an effect, material, pass, prefab or engine, composing kits of several packages, hosting an engine from a UI framework, or enforcing its boundaries.
---

# three.js block architecture

A three.js package is a framework-independent workspace package of suffix-named blocks in
layers: domain (plain data and pure rules), shader, gpu, scene, runtime. Reusable rendering
pieces never depend on the runtime, so other three.js code can use them through the kit
tier; an engine composes them, owns the canvas, the loop and the input, and talks to any
host (Angular, React, a plain page) through plain data in its host tier. Every GPU resource
and listener has one declared owner and disposer, and every rendering block states its
backend and colour output. The default backend is `WebGPURenderer` with TSL, node materials
and a `RenderPipeline`, which runs on WebGPU and on its own WebGL 2 fallback; GLSL and
`WebGLRenderer` remain for packages that choose them, and the decisions that hold only there
say so.

## Rules

[three-block-architecture.constitution.md](three-block-architecture.constitution.md) holds the rules, and it overrides anything else in
this skill. Read its Requirements, then only the decision topics your task touches (the
table below names them); every decision cites how it is checked. The references explain
the decisions and give examples; they don't restate them.

[three-block-architecture.architecture-profile.md](three-block-architecture.architecture-profile.md) is the machine-readable form of the checkable rules: layers and
their packages, library roles, each block's dependencies, required tags and spec kinds. Read
its Blocks table when you create a block; it is also what enforcement is generated from.

## What to read

Inspect the package first: its instructions, its `package.json` binding, its libs and the
host that uses it. Keep an existing layout and naming unless the task is to migrate them.

| Task                                                                                       | Read                                                                                                                                                                                         | Decision topics                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Understand the architecture, the two tiers, `three` as a peer, the backend and its imports | [architecture.md](references/architecture.md)                                                                                                                                                | Package boundary, Layers       |
| Start a package (prototype app, product app or lib)                                        | `new-package three <dir> --name <pkg> --tier <tier> --kind <kind>`, then [layout.md](references/layout.md)                                                                                   | Package boundary, Enforcement  |
| Create or change blocks                                                                    | [blocks.md](references/blocks.md), the profile's Blocks table                                                                                                                                | Blocks, Shaders and GPU, Scene |
| Ownership, disposal, render targets                                                        | [blocks.md](references/blocks.md), [runtime.md](references/runtime.md)                                                                                                                       | Ownership                      |
| Write an engine: canvas, sizing, input, loop, renderer state                               | [runtime.md](references/runtime.md)                                                                                                                                                          | Runtime                        |
| Present a model: a subject, a presenter, a story, the camera hand-over, content on parts   | [composition.md](references/composition.md), [runtime.md](references/runtime.md), [hosting.md](references/hosting.md)                                                                        | Composition, Runtime           |
| Use another package's kit; decorators, shared attributes, recipes                          | [composition.md](references/composition.md)                                                                                                                                                  | Composition                    |
| Make a lib copyable between labs, or judge a `unit.json`                                   | [units.md](references/units.md)                                                                                                                                                              | Composition                    |
| Host an engine from Angular, React, a plain page or as a custom element                    | [hosting.md](references/hosting.md)                                                                                                                                                          | Package boundary               |
| Place files, name them, set up libs and entries                                            | [layout.md](references/layout.md), the source-organization skill                                                                                                                             | Blocks, Layers                 |
| Lib and package docs, TSDoc tags, spec kinds, browser specs                                | the architecture-docs-and-specs skill, then [documentation-and-testing.md](references/documentation-and-testing.md); citations of declarations and of rows of documents: the citations skill | Documentation, Testing         |
| Enforce boundaries, run the checks                                                         | [enforcement.md](references/enforcement.md), the profile                                                                                                                                     | Enforcement                    |

The worked examples cite the three-demos packages of this repository (`products/three-demos/packages/`) by
name as reference implementations. The skill ships a package template,
`assets/three-package-skeleton/`, that the `new-package` bin of
`@gergelyszerovay/architecture-skills` instantiates; its `README.md` lists the variants.

## Finishing

Run the package's checks ([enforcement.md](references/enforcement.md)): the naming check,
the host-tier check after a build, lint, types and specs, the browser specs where the
package has them. Report the actual coverage and any rule left unenforced.

Start small and adopt incrementally (constitution [D60](./three-block-architecture.constitution.md#D60), [D61](./three-block-architecture.constitution.md#D61)): no empty libs, no dependencies
or migrations the task doesn't need, and no blocks before the package uses them.
