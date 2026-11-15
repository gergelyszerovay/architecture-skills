import { WebGPURenderer } from 'three/webgpu';
import {
  applyExampleParams,
  defaultExampleParams,
  exampleResolutions,
  resolveEngineOptions,
  shouldRunLoop,
  type EffectEngine,
  type EngineOptions,
  type ExampleEvents,
  type ExampleParams,
} from '~libs/example-domain';
import { createPresentPipeline, ExampleEffect } from '~libs/example-effect';
import {
  Emitter,
  FrameLoop,
  KeyboardControls,
  MotionPreferenceControls,
  VisibilityControls,
} from '~libs/example-runtime';

/**
 * Creates an example engine inside `container`: a canvas that fills it, a low-resolution
 * effect upscaled with nearest filtering, and Space on the focused canvas to pause.
 * `options` (all default `true`) can switch the keyboard input off (`interactive`), pause the
 * loop while the container is offscreen (`pauseWhenOffscreen`) and render one static frame
 * under `prefers-reduced-motion: reduce` (`respectReducedMotion`). The loop runs only while
 * the host wants it running and no automatic pause applies (`shouldRunLoop`); automatic
 * pauses never emit `runningChanged`.
 *
 * The engine draws with `WebGPURenderer`: on WebGPU where the browser has an adapter, on the
 * renderer's own WebGL 2 backend otherwise. The effect and the present pipeline are TSL, so both
 * backends draw the same picture; nothing in it needs a feature the fallback lacks.
 *
 * The host-contract rules of the block-architecture guideline (section 7) apply: plain data
 * only, params clamped by `applyExampleParams`, idempotent `dispose()`, `paramsChanged`
 * never echoes `setParams`.
 * @backend webgpu
 * @lifetime engine
 * @owns the canvas, the `WebGPURenderer` with its device (WebGPU) or context (WebGL 2), the
 *   effect, the present pipeline, the frame loop, the keyboard controls (only when interactive),
 *   the visibility and motion-preference listeners and a `ResizeObserver`.
 * @cleanup `dispose()` releases them in reverse order of creation and removes the canvas; the
 *   renderer destroys its device or loses its context asynchronously.
 * @failure Rejects when neither WebGPU nor WebGL 2 can start (`renderer.init()` rejects); nothing
 *   is left in `container`.
 * @renderer `WebGPURenderer` with its defaults; the pixel ratio is 1, and the present pipeline
 *   converts to the output colour space once.
 */
export async function createExampleEngine(
  container: HTMLElement,
  initial: Readonly<Partial<ExampleParams>> = {},
  options: Readonly<EngineOptions> = {},
): Promise<EffectEngine<ExampleParams, ExampleEvents>> {
  const renderer = new WebGPURenderer({ antialias: false, powerPreference: 'high-performance' });
  try {
    await renderer.init();
  } catch (error) {
    // A renderer whose start failed holds no device or context, and its `dispose()` would wait on
    // the failed start again, so it is dropped as it is.
    throw error instanceof Error ? error : new Error(String(error));
  }
  renderer.setPixelRatio(1);
  const settings = resolveEngineOptions(options);
  const canvas = renderer.domElement;
  if (settings.interactive) canvas.tabIndex = 0;
  else canvas.style.pointerEvents = 'none';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.imageRendering = 'pixelated';
  container.appendChild(canvas);

  let params = applyExampleParams(defaultExampleParams, initial);
  let disposed = false;
  // The host's intent, and the automatic gates; the loop follows `shouldRunLoop` of the three.
  let hostRunning = true;
  let visible = true;
  let reducedMotion = false;
  const events = new Emitter<ExampleEvents>();
  const effect = new ExampleEffect(params);
  const lowRes = exampleResolutions[params.resolution];
  const pipeline = createPresentPipeline(renderer, lowRes.width, lowRes.height);

  const draw = (): void => {
    effect.render(renderer, pipeline.target);
    pipeline.render();
  };

  const loop = new FrameLoop(renderer, document, {
    frame: (dt) => {
      effect.update(dt);
      draw();
    },
    fps: (fps) => events.emit('fps', fps),
  });

  /** Starts or stops the loop so it matches the host intent and the automatic gates. */
  const reconcileLoop = (): void => {
    if (disposed) return;
    if (shouldRunLoop({ hostRunning, visible, reducedMotion }, settings)) loop.start();
    else loop.stop();
  };

  const setRunning = (running: boolean): void => {
    if (disposed || running === hostRunning) return;
    hostRunning = running;
    reconcileLoop();
    events.emit('runningChanged', running);
  };

  const controls = settings.interactive
    ? new KeyboardControls(canvas, { Space: () => setRunning(!hostRunning) })
    : undefined;
  const visibility = settings.pauseWhenOffscreen
    ? new VisibilityControls(container, (next) => {
        visible = next;
        reconcileLoop();
      })
    : undefined;
  const motion = settings.respectReducedMotion
    ? new MotionPreferenceControls((reduced) => {
        reducedMotion = reduced;
        reconcileLoop();
      })
    : undefined;
  reducedMotion = motion?.matches ?? false;

  /** Repaints the last frame when the loop is stopped, so edits and resizes stay visible. */
  const redrawIfPaused = (): void => {
    if (!loop.running && !disposed) draw();
  };

  const resize = (): void => {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    redrawIfPaused();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  // One frame always, so a loop that never starts (reduced motion) still shows the effect.
  draw();
  reconcileLoop();

  const engine: EffectEngine<ExampleParams, ExampleEvents> = {
    setParams(patch) {
      if (disposed) return;
      const next = applyExampleParams(params, patch);
      if (next.resolution !== params.resolution) {
        const size = exampleResolutions[next.resolution];
        pipeline.setLowRes(size.width, size.height);
      }
      params = next;
      effect.setParams(params);
      redrawIfPaused();
    },
    setRunning,
    on: (type, listener) => events.on(type, listener),
    snapshot: () => ({
      params: { ...params },
      running: hostRunning,
      fps: loop.fps,
      state: undefined,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      motion?.dispose();
      visibility?.dispose();
      controls?.dispose();
      loop.dispose();
      pipeline.dispose();
      effect.dispose();
      events.clear();
      // Destroys the device or loses the context; it runs asynchronously.
      renderer.dispose().catch(() => undefined);
      canvas.remove();
    },
  };
  return engine;
}
