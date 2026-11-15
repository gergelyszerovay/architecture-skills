/**
 * The backend an engine's canvas draws with: a canvas holds one kind of context, and asking it
 * for another gives `null`, so a WebGPU canvas has no `webgl2` context. Call it after the engine
 * has drawn.
 */
export function canvasBackend(canvas: HTMLCanvasElement): 'webgpu' | 'webgl2' {
  return canvas.getContext('webgl2') ? 'webgl2' : 'webgpu';
}
