# Runtime

What an engine owns and in which order a frame runs. The rules are the constitution's
**Runtime** and **Ownership** decisions; this page explains them. Which parameters, events,
commands and snapshots an engine offers its host, and their types, are the product's host
protocol (non-goal N1); this page covers what holds whatever the protocol is.

## What an engine owns

An `.engine.ts` is the package's composition root. Its factory takes the host's container
(and, as the product defines them, initial params and options) and resolves to the engine:

```ts
export declare function createPlasmaEngine(
  container: HTMLElement,
  initial?: Partial<PlasmaParams>,
  options?: PlasmaEngineOptions,
): Promise<PlasmaEngine>;
```

- **The canvas.** The engine creates the canvas inside `container`; the host never passes or
  styles one. Canvas layout, such as `image-rendering`, belongs in `.engine.ts`, not in the
  host's CSS.
- **Sizing.** It follows the container with a `ResizeObserver` and sets the drawing buffer
  and any intermediate target from it. The size and pixel-ratio arithmetic (a fixed low
  resolution for a retro look, native resolution capped at a pixel ratio) is a `.rules.ts`,
  tested without WebGL. A transparent canvas (`alpha: true`, cleared to transparent) is the
  engine's choice too, and its TSDoc states what the host puts behind it.
- **Input.** Simulation input (`.controls.ts`) binds to the canvas, not to `window`, so two
  engines on one page don't fight and the host's own shortcuts stay the host's. Gameplay
  input (WASD, pointer lock, gamepad) is the engine's; a host shortcut is the host's; never
  both on the same key.
- **The renderer.** By default `new WebGPURenderer(…)` from `three/webgpu` (D65), started with
  `await renderer.init()` inside the factory: it opens a WebGPU device, or its WebGL 2 backend
  where the browser has no adapter. A `WebGLRenderer` is for a `@backend webgl` engine.
- **Disposal.** The engine disposes what it built in reverse order. `dispose()` may be called
  at any time, more than once, also while creation is still running, and releases the device
  or the context: browsers cap active contexts, and a host mounts and unmounts engines
  repeatedly. `WebGPURenderer.dispose()` is asynchronous and destroys its device (WebGPU) or
  loses its context (WebGL 2) itself; the engine starts it and catches its rejection. A
  `WebGLRenderer` needs `dispose()` and `forceContextLoss()`.
  It disconnects every observer (`ResizeObserver`, `IntersectionObserver`) and removes every
  listener it created, media-query listeners included.

### Creation is asynchronous

The factory returns a promise: `WebGPURenderer` needs `await renderer.init()`, and an engine
with assets loads them first. A host that unmounts before the promise settles disposes the
engine when it arrives ([hosting.md](hosting.md)). The engine's `@failure` states what a failed
start or load does (the promise rejects, and the container stays empty). `init()` rejects only
when neither WebGPU nor WebGL 2 starts; a renderer whose `init()` failed holds no device or
context, and its `dispose()` would wait on the failed start again, so the engine drops it
without calling it. When the engine uses a `@requires native-webgpu` block, its `@failure` also
says what the WebGL 2 fallback does with it (D21).

### The lifecycle

An engine may be created before it is mounted (D31, D32). Its factory takes the container as
optional: with one, the engine mounts at once, as before; without one, the renderer starts, the
asset groups the options name load, the pipelines compile and the first frame is drawn into the
engine's own canvas, which no page shows yet. The canvas and the engine's overlays live in a stage
element of the engine's own (three-demos: engine-core's `StageControls`), which fills its container
and is the overlays' positioned ancestor:

- `mount(container)` appends the stage (out of another container first). A canvas moved in the
  document keeps its context, so nothing is created again; the engine resizes to the container at
  once and follows it with a `ResizeObserver` from then on. Input stays bound to the canvas.
- `unmount()` takes the stage out: the loop stops (an unmounted engine counts as offscreen) and
  held input is released; the engine keeps its state.
- `preload(groups?)` loads asset groups without mounting and reports `loadProgress`; a group the
  engine does not have is refused. A host that must show progress during creation, before it can
  subscribe, passes `onLoadProgress` in the options.
- `dispose()` works in every state, twice included. An `AbortSignal` in the options ends a creation
  that is still running: the factory checks it after each await and releases what it created.

### Clocks

The host picks what drives the engine's time at creation (D34): `auto` (the engine's own loop, the
default), `fixed` (the simulation on a fixed step, rendering per frame; games) or `host`, where the
engine runs no loop and renders only when the host calls `seek(state)`. `seek` takes a plain-data
state the engine defines (a time, a progress) and asks for one frame, which a demand loop
(three-demos: engine-core's `DemandFrameLoop`) draws once per displayed frame however often it is
called, and holds while the engine is unmounted or offscreen, so a page that stops scrolling costs
nothing. An engine states the clocks it supports; `auto` resolves to its first, and a clock it does
not support rejects the creation, so a host that needs `seek` never gets an engine that plays on its
own. A race has its own clock; a model viewer or a scroll story takes the host's.

### Seekable state, the story and the camera

A subject's animated layers are pure functions of plain state (D72): a power-up of its time, a
gait of a state that a `.rules.ts` steps (in fixed steps, so `stepLocomotion` from rest by the
whole time lands where playing lands), a gesture of its name and time. A controller holds the
state and writes it; the presenter plays it on its own clock, or takes it from `seek`.

A story (D73) is a table of rows: `at` (progress), the subject's state (a cue: a time, a move, a
gesture) and the camera's shot, or a part to frame from that shot's direction. A `.rules.ts`
evaluates it at a progress: times run linearly between rows, discrete choices are the earlier
row's, shots ease. On the host's clock `seek({ progress })` evaluates the story and draws one
frame; a part's framing is resolved from the subject as the row poses it.

The camera (D74) is a base shot the host drives, eased, plus the reader's offset (orbit, zoom),
clamped by limits. The reader's input moves the camera only while it is engaged (a pointer down,
a wheel turn, the damping settling); the presenter reads the offset back from where the input left
the camera, reports it once per frame as `cameraChanged` with `source: 'user'`, and never reports a
shot the host gave it, so a host that writes the shot back in answer cannot loop. The takeover
policy says what follows: `keep` the offset on every later shot, `reset` it at the next row or
focus, or `ease-back` after a delay without input. On the host's clock, the reader's input and an
easing offset draw frames of their own.

Host content on parts (D75) is placed the way an overlay places its labels, but the elements are
the host's: the presenter writes a `transform` (and `visibility` behind the camera) each frame,
only when it changed, and reads no layout. In an element they are slotted children
(`slot="part:<id>"`) shown in a content layer above the canvas (three-demos: engine-core's
`defineEngineElement` with `slots` and `connect`).

### The static frame

The engine renders one frame at creation, mounted or not, so an engine that never starts its loop
(a host that keeps it paused, a reduced-motion preference) still shows its output. While the loop
is stopped, parameter changes, resizes, mounts and pointer moves repaint the last frame.

### Talking to the host

- **The engine validates input.** It clamps or rejects incoming values with a `.rules.ts`
  function; a host's slider bounds are a convenience, not the guarantee.
- **Throttle what changes every frame.** Per-frame values (time, frames per second) are
  reported at a low rate (≤ 4 Hz) or only on request.
- **Echo suppression.** A parameter-change event reports only changes the engine made itself
  (a key binding cycled a palette, the user took over from an autopilot), not changes that
  came in from the host, so a two-way bound host doesn't loop. An engine that drives a param
  continuously (a clock) reports it at the throttled rate, like any per-frame value.

## The DOM-access rule

Only six blocks touch browser globals ([architecture.md](architecture.md), "DOM access"):
the engine (canvas, observers), the element (the custom element and its shadow root), controls
(listeners), overlays (elements), assets (fetch, image decoding, canvases for painted textures)
and gateways (storage, audio, network).
Everything else receives what it needs: a texture painter its 2D context, a rule the
container size, a system the elapsed time.

## The frame

A frame runs in a fixed order, which the engine's TSDoc lists:

1. **Input.** Controls have turned events into action state since the last frame.
2. **Fixed steps.** A `.loop.ts` with a fixed step (say 60 or 120 Hz) runs every `@step
fixed` system and controller as many times as the elapsed time needs, up to a substep cap
   (8, so a stalled tab doesn't spiral), and keeps the remainder as an interpolation
   fraction. Simulation rules (`step-car.rules.ts`) run here.
3. **Frame updates.** `@step frame` systems and controllers run once, reading the
   interpolation fraction to place what they draw between two fixed states: mixers, cameras,
   tweens, streaming.
4. **Overlays** read the camera and place their elements.
5. **Render**, through the pipeline or straight to the canvas.

A block that must run after another in the same phase says so with `@after` (a pose
controller after the animator, which it corrects).

### Streaming under a budget

A system that builds things as the camera moves (grass chunks, terrain tiles) spreads the
work over frames: it takes the jobs a pure `.rules.ts` schedules (nearest first, by level of
detail) and stops when its time budget for the frame (a few milliseconds) is spent. The rule
is tested in Node; the system only measures time and calls it.

## Renderer state

State set on the renderer beyond its defaults (shadow maps and their type, tone mapping and
exposure, output colour space; on `WebGPURenderer` also a `RenderPipeline`'s output transform)
has one owner: a `.system.ts` of the engine lib, driven by the
package's recipe table when the state depends on a look, which sets it and restores the
defaults on dispose. The engine's `@renderer` tag lists that state, or says `default`.

Resources that renderer state brings with it have owners too:

- a prefab that creates a shadow-casting light owns `light.shadow.map` and disposes it;
- an alpha-tested instanced material owns its depth companion (`customDepthMaterial`);
- textures the renderer bakes (a PMREM environment from a room scene) live in an
  `.assets.ts`, because they need the renderer.

On `WebGLRenderer` (since r154), materials skip tone mapping when they render into a render
target, and a pipeline target without `samples` makes `alphaToCoverage` inert: a look that
needs either renders straight to the canvas. On `WebGPURenderer` a `RenderPipeline` applies
tone mapping and the output colour space once at its output (D22), so blocks inside it stay
linear. Drawing straight to the canvas, `WebGPURenderer` renders into its own intermediate
target and converts at the end, so transparent surfaces blend in linear colour: water or glass
over the scene can look a little lighter than under `WebGLRenderer`, which blends in display
colour.

## Ownership tags

`@owns` says what a block creates and must release, `@cleanup` how (`dispose()`, listener
removal, `setAnimationLoop(null)`), and `@lifetime` who creates it and when it ends
(`engine`, `level`, `entity`, `operation`). A shared resource names its reference-counting
owner. [documentation-and-testing.md](documentation-and-testing.md) has the full tag list.
