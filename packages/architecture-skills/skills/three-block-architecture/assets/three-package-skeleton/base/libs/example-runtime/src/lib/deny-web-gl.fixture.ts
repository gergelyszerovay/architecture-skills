/**
 * Makes `HTMLCanvasElement.getContext` return `null` for WebGL contexts, so an engine's creation
 * fails the way it does on a machine without WebGL 2. Returns the function that puts it back; call
 * it in a `finally` or `afterEach`.
 */
export function denyWebGL(): () => void {
  // oxlint-disable-next-line typescript/unbound-method -- patched back on the prototype, called with `this`
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function denied(
    this: HTMLCanvasElement,
    ...args: Parameters<typeof original>
  ) {
    const [kind] = args;
    if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
    return original.apply(this, args);
  } as typeof original;
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}
