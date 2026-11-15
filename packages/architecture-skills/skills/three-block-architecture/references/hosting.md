# Hosting

How any host uses a three.js package. The rules are the constitution's **Package boundary**
decisions; the host's own architecture (Angular's, React's) decides everything above the one
block that touches the engine.

## The shape of every host

- **One imperative integration block calls the factory.** The host has exactly one place
  that calls `create<Name>Engine(container, …)`, generic over the engine where the host
  shows several, and everything else in the host passes the factory to it (a reference, or a
  lazy loader that imports the package on demand, so the package and three.js stay out of
  the initial bundle).
- **Plain data in and out.** The integration block forwards the host's state to the engine
  (parameter patches, running or paused) and turns the engine's events into the host's own
  state updates. The host keeps the authoritative state; the engine validates what it gets.
  Neither side holds the other's objects.
- **Disposed on unmount.** Unmounting disposes the engine, including an engine whose creation
  hasn't finished: the block remembers that it was destroyed and disposes the engine when the
  promise resolves (and aborts the creation, where the engine takes a `signal`).
- **Created before it is shown, where the engine allows it.** An engine with the lifecycle
  ([runtime.md](runtime.md), "The lifecycle") can be created without a container, so the host
  starts it early (on page load, before its framework's first render, when a section comes near)
  and mounts it when there is a place for it. One integration block still does it all; the
  lifecycle is not a second one.
- **Outside the host's rendering.** The engine's animation loop never touches the host's
  reactive state; state changes only when the engine emits a (throttled) event.
- **One engine per canvas.** A second view is a second engine.

The host depends on the package (and on whatever `three`-free entry its types come from), never
on `three` ([architecture.md](architecture.md)).

## Angular

The engine is an imperative rendering integration, which is what the angular-block-architecture
skill's `.adapter.ts` exists for. The adapter calls the factory in `afterNextRender`, forwards
inputs with `effect()`, turns engine events into outputs and disposes on destroy; a store
owns the parameters, a facade projects them, a container wires the adapter to the panel.
Angular 22 is zoneless, so the engine runs outside change detection by construction. App
shortcuts are a `.connector.ts`. Example: `products/three-demos/apps/app` (`libs/effect-canvas` is the generic
adapter). Given a factory of an engine with the lifecycle, the same adapter starts the creation in
`ngOnInit`, before the first render, without a container (with the groups to preload, an abort
signal and a progress callback), mounts the engine into its element after the render and
forwards `loadProgress`; destroyed first, it aborts the creation.

## React

The integration block is a component with a `ref` to its container: a `useEffect` with an
empty dependency list calls the factory, keeps the engine in a ref, subscribes to its events
(setting state from them) and returns a cleanup that disposes it, also when the promise
resolves after the cleanup ran; a second `useEffect` keyed on the parameters forwards them.
StrictMode mounts twice in development, which the idempotent `dispose()` and the
destroyed-while-creating check make harmless.

## A plain page

A module script calls the factory with a container element, wires form controls to the
engine's parameter API and its events to the page's text, and disposes the engine on
`pagehide`. Example: a Vite page per package is the quickest way to try an engine without a
framework: the playground prototypes of this repository's lab (`prototypes/plasma-playground`, `fire-playground`,
`shapes-playground`) do it with the param panel (`src/param-panel.ts`) that the template's app
variants ship, built from the engine's `ParamSpec[]`, command, readout and binding specs.

## A custom element

A package may offer its engine as a custom element, the `./element` entry (D2, D70): an
`.element.ts` block wraps the host tier, and the page is a host that needs no framework and no
code of its own. The element maps attributes and properties to `setParams`, makes commands methods
and re-dispatches engine events as DOM events with the plain payload as `detail`; connecting it
mounts the engine in its shadow root and disconnecting unmounts it (staying removed disposes it).
Its defaults follow `<model-viewer>` where the meaning matches: it is a block sized by CSS with a
default aspect ratio, `loading="lazy"` creates the engine when the element comes near the viewport
(`"eager"` at once), `poster` shows an image until the first frame and `reveal="manual"` waits for
the page's `reveal()`. Which further attributes an element has is the product's (N1).

Importing `./element` defines the element under its default name (a custom element's name needs a
hyphen: `<desktop-racers>`, `<blockland-game>`); `define<Name>Element(name)` defines it under
another. A product with several engines shares the element's code in its runtime package rather
than copying it: three-demos' `@gergelyszerovay/three-demos-engine-core/element` has
`defineEngineElement(name, config)`, and each package's `.element.ts` is a few lines of config.
Two things change in a shadow root: `document.activeElement` and `document.pointerLockElement`
name the shadow host, so controls read focus and pointer lock from the canvas's root
(`canvas.getRootNode()`), and listeners stay on the canvas as everywhere else.

## A scroll page

A page that tells a story while the reader scrolls hosts a presenter on its own clock (D34, D73):
the element with `clock="host"`, sized to the viewport in a sticky stage, and one listener that
turns the scroll position into progress and calls `seek({ progress })`. The engine draws at most
once per displayed frame however often the page scrolls, and nothing while the page stands still,
so neither CSS scroll timelines nor a scroll library is needed (both work: GSAP ScrollTrigger's
`onUpdate` calls `seek` the same way). The page's captions are its own; labels on the model's parts
are its own elements, slotted as `slot="part:<id>"`, which the presenter moves by transforms (D75).

```html
<div style="position: sticky; top: 0; height: 100vh">
  <exo-suit clock="host" takeover="ease-back" style="height: 100%">
    <span slot="part:core">Power core</span>
  </exo-suit>
</div>
<script type="module">
  const suit = document.querySelector('exo-suit');
  const seek = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    suit.seek({ progress: range > 0 ? scrollY / range : 0 });
  };
  addEventListener('scroll', seek, { passive: true });
  suit.ready.then(seek);
</script>
```

The reader may still orbit and zoom; the takeover policy (D74) brings the camera back to the story.
Example: `prototypes/exo-suit`'s `website.html`.

## The standalone file

With `./element`, a package may ship `dist/standalone/<name>.js` (D69), exported as `./standalone`:
one ES module that bundles three.js with the package and defines the element when it loads, so a
page includes the engine with one tag from a CDN that serves the published package:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Desktop Racers on a page</title>
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/<package>/dist/standalone/desktop-racers.js"
    ></script>
  </head>
  <body>
    <desktop-racers laps="2" baked-desk style="height: 70vh"></desktop-racers>
    <input type="file" accept=".glb,.gltf,.obj,.stl" />
    <script type="module">
      const racers = document.querySelector('desktop-racers');
      document.querySelector('input').addEventListener('change', (event) => {
        racers.loadSurface(event.target.files[0]);
      });
      racers.addEventListener('racefinished', (event) => console.log(event.detail));
    </script>
  </body>
</html>
```

The page needs nothing else: no bundler, no import map. The build is Vite's library mode over a
`src/standalone.ts` that calls `define<Name>Element()` itself (a side-effect import can be dropped by
the bundler): pkgroll keeps the `three` peer external, which is right for the npm entries and wrong
for this file. Generated assets and the decoders the package needs are copied beside the file
(`dist/standalone/assets/`) and found through `import.meta.url`; library mode would inline every
`new URL(…, import.meta.url)` asset, three's default Draco and Basis decoders among them, so the
build points those it does not need elsewhere. Served from another origin, the file and its assets
need CORS. The bundled three.js is the page's own copy: a page that uses three.js itself takes the
npm build or an import map, or it loads three.js twice. The package doc states the file's size,
minified and compressed. A plain-page spec serves such a page and the file from two origins and
opens it on WebGPU and on the WebGL 2 fallback (`packages/desktop-racers/e2e/` in three-demos).
