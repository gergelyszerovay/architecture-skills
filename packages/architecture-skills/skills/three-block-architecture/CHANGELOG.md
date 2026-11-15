# Changelog: three-block-architecture

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.6.0

### Added

- **The `.prop.ts` block.** A scene-layer block for an attachment a subject wears (D77): built in code, adopted from a
  `.glb` or both, it returns `{ root, dispose }` plus the press shapes it lends the subject and `evaluate(state)` for its
  seekable layers; its catalogue row is a `.model.ts` in the host tier, and a simulation of it is a `.system.ts` or
  `.controller.ts`. The profile's Blocks table has its row, `.engine.ts`, `.system.ts`, `.controller.ts` and `.exporter.ts`
  may depend on it, and the `no-symbol` and `dispose-has-spec` rules cover it. `blocks.md` and `composition.md` explain it.

## 0.5.3

### Changed

- **`check-units` finds packages of a workspace in a group folder.** A package at `prototypes/<group>/<name>` is
  read like one at `prototypes/<name>`: the workspace's packages are collected from its folders and from the group folders of
  `prototypes/`.

## 0.5.2

### Changed

- **The package skeleton's binding names no version.** `new-package three` writes
  `"architecture": { "profile": "three-block-architecture", … }` with no `version`; it bound 0.3.3, two minor versions
  behind the profile. The example in `references/enforcement.md` follows.
- **`check-units` compares a unit with the installed profile.** A unit's `unit.json`
  version is compared with the `Version` of the profile the package's binding finds, not with the binding's `version`,
  and a frozen package's units are not judged (the script prints one line for it). `references/units.md` says so and
  no longer asks a package to rebind before using the rule of 0.3.2.

### Removed

- **The kept copies of earlier profile versions.** `versions/` is gone: a binding
  names no version and every package is checked against the installed profile (the architecture-profile skill,
  "Versioning").

## 0.5.1

### Added

- **The three.js app template proxies `/openrouter` to an OpenRouter gateway.** The template's `vite.config.ts`
  forwards `/openrouter/…` of the dev server to `OPENROUTER_BASE_URL`, which a sandboxed development session sets when its
  person has an OpenRouter key, so a page calls `/openrouter/chat/completions` on its own origin with no key. Outside such a session, or with
  no key, the variable is unset, the proxy is absent and the path answers 404; a built app has no gateway.

## 0.5.0

### Added

- **Presentable subjects.** A subject kit and a presenter meet at a fifth joint, the subject
  contract (D71: `root`, `dispose`, `evaluate(state)`, parts as plain rows, named render outputs, no camera, light, stage,
  post or input; D41 amended). Animated layers are seekable state (D72); a presenter is a composition engine with an
  optional story driven by `seek({ progress })` (D73); its camera is the host's shot plus the reader's offset, with the
  takeover reported once per frame and never echoed (D74); host elements follow part anchors by transforms only, as
  slotted children in an element (D75); a subject's exporter samples clips with `KHR_animation_pointer`, and its prefab may
  adopt the baked file with the live look (D76). `composition.md` explains subjects and presenters, `runtime.md` the story
  and the camera, `hosting.md` a scroll page; `SKILL.md` routes the task.
- **An engine's lifecycle, its clocks, the `.element.ts` block and the standalone file.** An engine may be
  created without a container (the renderer starts, the named asset groups load, the pipelines compile and the first frame is
  drawn into its own canvas), mounted and unmounted without losing its context, preloaded with `loadProgress`, and aborted
  while it is created (D31 and D32 amended). It runs on the clock it states it supports: `auto`, `fixed` or the host's, `seek`
  (D34 amended). A package may offer a third entry, `./element`, a custom element over its host tier: the new runtime block
  `.element.ts` (profile row, D70; D2 and D11 amended), and with it `dist/standalone/<name>.js`, one ES module with three.js
  bundled that a page loads with a `<script type="module">` tag, exported as `./standalone` (D69). `runtime.md` explains the
  lifecycle and the clocks; `hosting.md` the adapter's create-before-mount, the element, the standalone file and a plain page
  built only from a script tag; `blocks.md` and `architecture.md` the element block; `layout.md` the `src/element.ts` and
  `src/standalone.ts` entries; `enforcement.md` the host-tier check of `./element`. The template is unchanged: a package made
  from it keeps one host (its `kind-app` page) and adds an element when it needs one.
- **`.exporter.ts`, the asset recipe and generated assets.** A new gpu block, `.exporter.ts`: a function
  from a kit's prefab, scene or surface and its build params to the bytes of a `.glb` or a PNG, run in a browser by the build's
  asset pipeline (`@owns`, `@cleanup`, `@failure`; an edge case for its failure path and an invariant for determinism; D67).
  D68 describes the package's side of the pipeline: a recipe `.model.ts` of plain rows with the budgets of its groups, build
  output in `dist/assets/` with a generated manifest, every `.glb` validated, the files exported as `./assets/*`. The profile
  lists the block and its coverage rules; `blocks.md` has an Exporters section and the asset loader's groups, preloading and
  both renderers; `layout.md` explains the recipe, the output and the manifest; `enforcement.md` names the validator and the
  budgets as the checks.
- **`@requires native-webgpu`.** An optional tag of the profile's `tsdoc-tags` rule
  (`optional=requires(native-webgpu)`): a `webgpu` block that uses what the WebGL 2 fallback lacks says so, and
  `check-tsdoc-tags` checks its value where it is present. The template's `tsdoc.json` declares it.
- **D65 and D66.** A `webgpu` package imports the renderer and node classes from `three/webgpu` and TSL from `three/tsl`, and
  core classes may come from `three`, which shares them (D65); a `webgpu` engine's browser specs run on WebGPU and on the WebGL
  2 fallback (D66). `references/documentation-and-testing.md` shows the Vitest config with a `webgpu` and a `webgl2` instance.

### Changed

- **Breaking:** **The template's spec tables.** For code that copies them: `ParamSpec<P>` has a
  `color` kind, a `group`, a `phase` (`build` or `look`) and keys typed as the params' keys; `CommandSpec<C>` has an
  optional `argument` (its options); `applyExampleParams` reads its bounds and options from `exampleParamSpecs` instead of
  repeating them; `param-panel.ts` renders colour controls and a choice for a command's argument.

  **Migration:** In a package that copied the template's `ParamSpec` and `CommandSpec` tables, add the new `color` kind, `group`, `phase` and `argument` members as the template has them and type each key as a key of the params; the package's typecheck shows it is done.

- **N6, D7 and D18 are amended.** N6: the skill still ships no asset pipeline, but a package describes
  its assets in a recipe, bakes what its kit generates with `.exporter.ts` blocks and ships the build output. D7: authored assets
  are committed with licence rows, generated ones are build output under `dist/assets/` and never committed, and the manifest is
  generated with them. D18: the loader of a package's assets is an `.assets.ts` that serves both renderers.
- **WebGPU is the default, not a requirement.** N5 is amended: the default, the template and the
  examples are `WebGPURenderer` with TSL, and a decision that holds only for `WebGLRenderer` says so. `@backend webgpu` now
  means "built for `WebGPURenderer`, its WebGL 2 fallback included" (D21); the profile lists the values as
  `webgpu/webgl/any`. TSL `.node.ts` is the primary shader block and `.shader.ts` is GLSL for `WebGLRenderer` (D23); a
  `.pipeline.ts` is a `RenderPipeline` and a `.pass.ts` a TSL post-node function, and the render-target rules hold for a
  block that owns its targets (D24); colour inside a `RenderPipeline` is linear and converted once (D22); WebGPU compute
  is TSL compute with a count of one number (D26); named MRT outputs are a fourth joint (D41); a TSL decorator wraps a
  node material's slots, and the GLSL rules (`onBeforeCompile`, chunks, `customProgramCacheKey`, `#ifndef` guards) are
  marked WebGL only, while names keep their package prefix on both (D42, D43). The references (`architecture.md`,
  `blocks.md`, `composition.md`, `runtime.md`, `documentation-and-testing.md`, `enforcement.md`) and `SKILL.md` say so.
  A package bound to the profile keeps passing: no rule became stricter for code that exists.
- **Breaking:** **The package template's example is on `WebGPURenderer` and TSL.** `new-package
three` now makes `example-effect` from a `.node.ts` gradient (`gradientNode`), a node material, an effect drawn with a
  `QuadMesh`, a surface on a `RenderTarget` and a present `RenderPipeline`; the engine creates a `WebGPURenderer` and awaits
  `init()`. The kit tier no longer exports `fullscreenVertexShader` and `gradientFragmentShader`; `example-runtime` types
  `FrameLoop` by `AnimationLoopRenderer`, its `countDrawCalls` counts the draws of both backends, and its test entry adds
  `denyWebGPU` and `canvasBackend`. A product package's browser specs run as a `webgpu` and a `webgl2` instance. The host
  tier, the spec tables and `param-panel.ts` are unchanged; a package made from the template before keeps its code.

  **Migration:** Code copied from the template's example effect, kit exports or runtime helpers follows the new example if it should run on `WebGPURenderer`; a package made from the template before keeps its code and needs no change.

- **The package skeleton's READMEs name the installer's package.** `install-skills` is the bin of
  `@gergelyszerovay/install-skills`, a devDependency of the repository beside the architecture skills.

## 0.4.0

### Added

- **The profile declares the rules applied to three.js units.** The `unit-imports` row gains
  `same-minor=three`: a unit and the package that receives it should share the minor of `three`. Tools that
  copy units read that parameter and `kit=all-libs-units-no-engine` (a unit of the role `engine` makes its package no kit) from the profile
  instead of a rule of their own; `references/units.md` says so. The package template's refusal of a lib prototype, until the skill
  moves to `#libs/*`, is what the package-creation tooling follows. No other row changes.

### Changed

- **Breaking:** **The package skeleton is self-contained: it no longer depends on a runtime package.**
  The host contract (`EffectEngine`, `EngineOptions`, `EngineEvents`, `EngineSnapshot`, `ParamSpec`, `InputBindingSpec`,
  `CommandSpec`, `ReadoutSpec`, `resolveEngineOptions`, `shouldRunLoop`) is defined in the `example-domain` lib; the frame loop, the
  keyboard, visibility and motion-preference controls, the `Emitter` and the browser-spec fixtures are in a new `example-runtime` lib;
  and `example-effect` holds the full-screen vertex shader and a small present pipeline (a nearest-filtered target upscaled to the
  canvas, without the retro pass). A package made from the template before keeps working; one made now needs no `--dep` for a runtime,
  and `tsconfig.json` gains the `~libs/*/testing` path. The references and the template example name "an engine package of your own"
  where they named the runtime.

  **Migration:** A package made from the template before keeps working; to follow the new skeleton, move the host contract and runtime helpers it imported from a runtime package into local libs as the template does, add the `~libs/*/testing` path to `tsconfig.json`, and drop the runtime dependency.

- **Breaking:** **The package skeleton and `references/enforcement.md` name `@gergelyszerovay/markdown-schema`.** The
  skeleton's `devDependencies` entry had the package's former name, which is renamed; a package made from the
  template before declares the new name instead.

  **Migration:** In a package made from the skeleton before, replace the former-name devDependency with `@gergelyszerovay/markdown-schema` `^0.13.0` and reinstall.

### Fixed

- **The package skeleton pins `@gergelyszerovay/markdown-schema` at `^0.13.0`.** It pinned `^0.11.0`, a version
  the renamed package never had; `^0.13.0` is the first release under the new name. A package made
  from the template before has to raise the range.

## 0.3.3

### Changed

- **The package skeleton's `.oxlintrc.json` ignores `.notes/` folders** (`**/.notes/**`).
- **Profile 0.3.3.** The version rises with the skill's changes (the
  architecture-profile skill, "Versioning"); no row changes. `versions/0.3.2/` keeps profile 0.3.2 for a
  package still bound to it; the three.js package skeleton binds 0.3.3.
- **The reference implementation's folders.** The worked examples, the package template's
  README and doc, `references/enforcement.md`, `hosting.md` and `layout.md` name the reference
  implementation's current folders. No profile row changes.
- **The citations skill.** The "What to read" row for docs names the citations
  skill for citing declarations and rows of documents, and the templates' guides name it at their
  first symbol citation (it was unnamed). No profile row changes.

## 0.3.2

### Added

- **A unit may import units of other kits of the same product.**
  - Decision D64 is widened: besides itself, the libs of its package that are units, the runtime and its declared
    packages, a unit imports a unit of another kit (a package whose libs are all units, none of the role `engine`) of the same product, as
    `<package>/<lib>`. The importing package lists the kit in its `dependencies`; kits form no cycles; a barrel import, a
    path inside a unit, a non-unit lib, an engine package or a package with a unit of the role `engine`, a package of
    another product and a kit without the `exports['./<lib>']` entry are findings.
    `references/units.md` explains the form (a subpath export per unit that another kit imports), what the unit-copying
    tool does (the needed units are copied beside the unit and the imports rewritten to `~libs/<lib>`) and what `check-units`
    judges.
  - Profile 0.3.2: the structural rule `unit-imports` (`own=units; other=kit-units; scope=product; form=package/lib;
kit=all-libs-units-no-engine; dependencies=listed; cycles=refused`, enforced by `checker`, D64). `check-units` reads the row and
    finds the other kits among the package's siblings. `versions/0.3.1/` keeps the
    previous profile; a unit written for 0.3.1 is accepted by a package at 0.3.2 (a later patch). The package skeleton
    binds 0.3.2; a package that binds 0.3.1 should rebind to use the rule.

### Changed

- **`SKILL.md` cites the constitution's rows by relative links instead of prose.**

## 0.3.1

### Added

- **Units: libs copied between repositories as source.**
  - New decision D64 (Composition) and `references/units.md`: a lib that is copied between repositories as source is
    a unit. It carries a `unit.json` (the profile and version it was written for, its role, the
    published runtime ranges, the peers, the vendors and their layers), imports only itself, the libs of
    its package that are units and the packages the file declares, and keeps its lib doc. SKILL.md and
    `composition.md` point to it; `composition.md` says that effect and surface contracts are shared by
    type (`.kit-model.ts`) across kits.
  - Profile 0.3.1: the structural rule `unit-manifest` (`file=unit.json; format=1; keys=…`, enforced by
    `checker`, D64) is the one machine-readable copy of the unit file's name, format and keys;
    `check-units` reads the row. No existing rule changes. `versions/0.3.0/` keeps the previous profile for
    the repositories still bound to it; a unit written for 0.3.0 is accepted by a package at 0.3.1 (a later patch).
    The architecture-profile skill's rule vocabulary, template and refinement know `unit-manifest`.
    The package template moves to 0.3.1, and its `lint` runs `check-units`, so a package that receives a unit
    judges it.
  - `check-units` reads the files Git tracks in a lib (outside a repository it walks the lib) and never follows
    a link: a link in a unit is a finding. `units.md` says the import scan is a fitness check, not a boundary.
  - New script and bin `check-units` (`scripts/check-units.mjs`, with a test): judges the `unit.json` of
    each lib of a package, for the package's `lint`. `enforcement.md` lists it.
  - The package template's engine-core dependency is the published `@gergelyszerovay/three-demos-engine-core`.
- **A param panel in the app variants.**
  - The app kind of the package template ships `src/param-panel.ts`: a plain-DOM panel built from an
    engine's `ParamSpec[]` (range as a slider with its value, enum as a select, toggle as a checkbox),
    `CommandSpec[]` buttons, `ReadoutSpec[]` text, the `InputBindingSpec[]` list and a run/pause button.
    It sends changes to `setParams` and follows `paramsChanged` and `runningChanged`. `src/main.ts`
    mounts it, disposes the engine on `pagehide` and in `import.meta.hot.dispose`, and `src/vite-env.d.ts`
    types `import.meta.hot`. A skeleton spec (`src/param-panel.spec.ts`, `it.todo`) comes with it.
  - `check-names` passes a package without a `libs/` folder (a host-only app).

### Changed

- **The product tier of the package template is `private`.** `new-package three … --tier product` writes `"private": true`, so a new product package needs no `CHANGELOG.md` until it is published; remove `private` and add the changelog (the `changelog` skill) then.

## 0.3.0

### Added

- **Prototype doc sections in the package template.**
  - `markdown-schema-templates/three-package/three-package.template.md` gains the sections of a prototype doc as
    optional sections: Purpose, Origin, Run, Status and Structure before `1. Boundaries`, and Open
    questions last, so that a prototype doc is a strict subset of it; a doc rebound to this template fails
    only on the sections that are required here.
  - The prototype tier of the app kind splits `dev` into `dev` (`portless`, with a `portless` key naming
    the server script) and `dev:app` (`vite`), and the README says so; `check-package-templates.mjs`
    runs `dev:app`.
  - New example `examples/valid-prototype-sections.md`.
- **Package template and `new-package`.**
  - `assets/three-package-skeleton/` is the three.js package template: prototype app, product app and product lib, still on
    `~libs/*` and pkgroll. A prototype lib is refused: while the skill uses the package-local
    `~libs/*` alias a lib prototype cannot be imported from source. `new-package three <dir> …` instantiates it;
    `layout.md` ("Starting a package") and `enforcement.md` (the scripts per tier) say so.
  - New asset `oxlint-base.json`, the correctness rules, so a package extends
    the skills' assets only (`oxlint-base.json`, `oxlint-no-symbol.json`) and nothing from its workspace.
- **Profile 0.3.0: blocks of their own kind, shared three.js types.**
  - New block `.kit-model.ts` (constitution D63): a type shared by several gpu, scene or runtime
    blocks that names three.js or kit objects (a prefab handle, a uniforms type, a look's context,
    a scene kit, an engine's seam of builders). Layer `gpu`, no required tags, no spec kinds; it may
    depend on `kit-model`, `shader`, `model` and `util`. Types only, `three` and kit tiers imported
    with `import type`, never in a domain lib: review checks those two parts, as it checks the
    shader layer's type-only rule. `.material.ts`, `.geometry.ts`, `.prefab.ts`, `.engine.ts`,
    `.system.ts`, `.controller.ts` and `.assets.ts` may depend on it, and `no-symbol` covers it.
    `references/blocks.md` says when to pick it over `.model.ts`, a `.shader.ts` type file or a
    factory's companion; `architecture.md` lists it in the gpu layer.
  - Blocks of their own kind: `.geometry.ts` may depend on `geometry` (D41), `.material.ts` on
    `material` (D42) and `.controls.ts` on `controls` (D37); the three decisions say so.
  - `.prefab.ts` may depend on `shader` and `node`, as `.effect.ts` may (D23, D30; D30 says so).
  - `.model.ts` may depend on `rules` (both domain, D9); `acyclic` still guards against cycles.
  - The generated `assets/oxlint-no-symbol.json` gains the `kit-model` override.

### Changed

- **The scripts by package name.**
  - `check-names` and `check-host-tier` are bins of the skills' package (`architecture-skills`), and
    a package's `.oxlintrc.json` extends `oxlint-no-symbol.json` through it
    (`./node_modules/architecture-skills/skills/three-block-architecture/assets/…`), after its
    workspace's `.oxlintrc.json`; `references/enforcement.md` shows the scripts and the config.

## 0.2.0

### Added

- **The package is the context.**
  - Constitution: D62 (a package is one context; its context map is the product group's package
    table, read by `package-allow-list`; its host tier `.` and kit tier `./kit` are its contract
    surface; no library-level grouping by context applies inside a package). Doc only: the
    profile is unchanged.

### Changed

- **No fallback engine.**
  - The packages lose their `.dependency-cruiser.cjs` and `depcruise` scripts: the repository's
    architecture gate judges them. `references/enforcement.md` and `layout.md` drop the cruiser
    config; a kept violation is a Rule Exceptions row, which the architecture checker reads.
  - `layer-packages` reads `*` as external packages only (the architecture-profile skill's
    `rules.md`, "Layers"): another workspace package needs `workspace` in the layer's cell or an
    Approved Packages row. The profile's only `*` cell is `testing`, so no row changes and the version stays 0.2.0. The
    `three-package` template's guide stops describing package-local cruiser rules.
- **Enforced by: architecture-check.**
  - Profile: `library-roles`, `acyclic`, `public-entry-only`, `block-allow-list`, `layer-packages`
    and `no-testing-in-prod` name `architecture-check` (were `dependency-cruiser`): the
    `dependencies` rule of the architecture checker judges them over the manifest. No rule changed, so the
    version stays 0.2.0.
  - dependency-cruiser is the fallback for a repository without the architecture checker: the
    architecture-profile skill's `dependency-cruiser-rules.cjs` builds the same rules from the rows
    marked `architecture-check`.
  - References: `enforcement.md`'s "What checks what" names architecture-check and the fallback.
- **Profile 0.2.0: `performance` is a `no-symbol` symbol.**
  - The `no-symbol` row gains `performance` (D11): a destruction rig called `performance.now()`
    from a `.prefab.ts` and no tool saw it. The generated oxlint asset is rebuilt; no other row
    changes.

## 0.1.0

### Added

- **Enforcement wired.**
  - The profile's `library-roles`, `acyclic`, `public-entry-only`, `block-allow-list`,
    `layer-packages` and `no-testing-in-prod` rows are `Enforced by: dependency-cruiser`,
    `tsdoc-tags` is `checker` and `no-symbol` is `oxlint`; no rule changed, so the profile stays
    0.1.0. The architecture-profile template's `Enforced by` gains `oxlint`.
  - `scripts/build-oxlint-config.mjs` builds `assets/oxlint-no-symbol.json` from the
    `no-symbol` row, with a `node:test` scenario; `references/enforcement.md` shows a package's
    scripts, its `.dependency-cruiser.cjs` with exceptions and its `.oxlintrc.json`.
- **The skill.**
  - New skill: `SKILL.md`, the constitution (R1–R13, N1–N6, D1–D61), the
    architecture profile 0.1.0, eight references, the `three-package` and `three-lib`
    templates with an example each, and two scripts with a `node:test` scenario each.
  - The principles became requirements R1–R7 and R13; the package-boundary, layer,
    catalogue, tag, layout, testing and enforcement sections became decisions and references.
    The host protocol (parameter, command, readout and binding specs, engine options, pause
    gates), the shared kit and the Angular demo stay with the product (non-goal N1).
  - Eight decisions found missing by assessing five artifacts not yet ported: overlays
    anchored to the screen and controls that create their elements (D36, D37), painted
    textures taking a 2D context and their colour space (D25), one owner of renderer state
    and the `@renderer` tag (D35), the fixed step and streaming under a budget (D34), storage
    gateways (D39), binary assets and their manifest (D7), adopted subtrees, animators and
    `@after` (D30, D40), baking compute blocks (D26).
  - Tags that were required "when the block creates resources" are required always, with
    `none` as an explicit value.
  - `scripts/check-names.mjs` implements `file-naming` and reads its
    suffix set from the profile; `scripts/check-host-tier.mjs` implements
    `entry-excludes-package`. Both are `Enforced by: checker`; the other structural rules are `planned`.
