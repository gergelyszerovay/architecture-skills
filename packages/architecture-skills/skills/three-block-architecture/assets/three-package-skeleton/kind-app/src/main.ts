import { mountParamPanel } from './param-panel';
import { createExampleEngine, exampleBindingSpecs, exampleParamSpecs } from './index';

// The page's entry: mounts the engine into `#app` and its param panel beside it. The page keeps
// nothing the engine does not hold, and releases both when it goes away.
const container = document.getElementById('app');
if (container === null) throw new Error('index.html has no #app element');

let disposed = false;
let release: () => void = () => {};
const dispose = (): void => {
  disposed = true;
  release();
};

createExampleEngine(container)
  .then((engine) => {
    // The page went away while the engine was starting.
    if (disposed) return engine.dispose();
    const unmount = mountParamPanel(document.body, engine, {
      params: exampleParamSpecs,
      bindings: exampleBindingSpecs,
    });
    release = () => {
      unmount();
      engine.dispose();
    };
  })
  .catch((error: unknown) => {
    container.textContent = `The engine could not start: ${error instanceof Error ? error.message : String(error)}`;
  });

window.addEventListener('pagehide', dispose);
// A page restored from the back/forward cache has a disposed engine: start again.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});
import.meta.hot?.dispose(dispose);
