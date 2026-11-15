# three.js block architecture

A skill for framework-independent three.js and shader packages: suffix-named blocks in
domain, shader, gpu, scene and runtime layers, a plain-data host tier any UI framework can
use, a kit tier other three.js code composes, declared owners and disposers for every GPU
resource, and explicit backends and colour spaces.

Start with [the three.js block architecture skill](skills/three-block-architecture/SKILL.md), which routes to:

- [Constitution](skills/three-block-architecture/three-block-architecture.constitution.md): requirements and decisions, the normative core.
- [Profile](skills/three-block-architecture/three-block-architecture.architecture-profile.md): the checkable rules, read by lint configs and checkers.
- [Architecture](skills/three-block-architecture/references/architecture.md): the host and kit tiers, `three` as a peer, built output, assets, layers and library roles.
- [Blocks](skills/three-block-architecture/references/blocks.md): the catalogue, and the contracts of prefabs, props, effects, surfaces, overlays, controls, assets, gateways and compute blocks.
- [Composition](skills/three-block-architecture/references/composition.md): the three joints, material decorators, the face-attribute contract, recipes.
- [Runtime](skills/three-block-architecture/references/runtime.md): what an engine owns, the frame order, the fixed step, renderer state.
- [Hosting](skills/three-block-architecture/references/hosting.md): one integration block per host; Angular, React and a plain page.
- [Layout](skills/three-block-architecture/references/layout.md): barrel libs, entries, file names.
- [Documentation and testing](skills/three-block-architecture/references/documentation-and-testing.md): TSDoc tags, the `three-package` and `three-lib` docs, which spec runs where.
- [Units](skills/three-block-architecture/references/units.md): when a lib is fit to be copied between labs, `unit.json`, the runtime contract and `check-units`.
- [Enforcement](skills/three-block-architecture/references/enforcement.md): the binding, the checks, the naming and host-tier scripts.
- [Package template](skills/three-block-architecture/assets/three-package-skeleton/README.md): `new-package three`, by tier (prototype, product) and kind (app, lib; a prototype is an app until the skill moves to `#libs/*`).

See the [block architectures overview](README.md).
