// The `webgl2` run of the browser specs: a browser without WebGPU, so `WebGPURenderer` falls back
// to its WebGL 2 backend by itself.
Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
