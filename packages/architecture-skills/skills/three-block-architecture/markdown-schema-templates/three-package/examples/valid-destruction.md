# @three-demos/destruction

> Breaks meshes apart: shader destruction effects as material decorators, a pure fracture library, and a physics gateway with a scrubbable recording.

## 1. Boundaries

| Concern                                             | Owner                       |
| --------------------------------------------------- | --------------------------- |
| The param panel, command buttons and readout badges | host                        |
| The face-attribute contract and its geometry kit    | `@acme/engine`              |
| Solving rigid bodies                                | `@dimforge/rapier3d-compat` |

## 2. Approved Packages

| Package                   | Layers                       | Reason                                                                                    |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| @acme/engine/contract     | domain                       | The host-contract types and the mesh-data rules every domain lib is written in.           |
| @acme/engine              | gpu, scene, runtime, utility | The shared runtime kit: frame loop, controls, present pipeline, geometry kit.             |
| @dimforge/rapier3d-compat | runtime                      | The approved physics vendor behind the physics gateway; its types stay out of signatures. |

## 4. Decisions

| ID  | Decision                                                                                    | Checked by | Why                                                                 |
| --- | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| D1  | The rig prefab bakes the simulation once and scrubs the recording instead of stepping live. | test       | Scrubbing backwards needs every frame, and a bake runs in Node too. |
