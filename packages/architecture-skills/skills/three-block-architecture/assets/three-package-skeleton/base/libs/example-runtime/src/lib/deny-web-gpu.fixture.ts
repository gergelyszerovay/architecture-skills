/**
 * Hides `navigator.gpu`, so `WebGPURenderer` finds no adapter and takes its WebGL 2 fallback, as
 * in a browser without WebGPU; with {@link denyWebGL} as well, an engine's creation fails. Returns
 * the function that puts it back; call it in a `finally` or `afterEach`.
 */
export function denyWebGPU(): () => void {
  const own = Object.getOwnPropertyDescriptor(navigator, 'gpu');
  Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  return () => {
    if (own) Object.defineProperty(navigator, 'gpu', own);
    else delete (navigator as unknown as { gpu?: unknown }).gpu;
  };
}
