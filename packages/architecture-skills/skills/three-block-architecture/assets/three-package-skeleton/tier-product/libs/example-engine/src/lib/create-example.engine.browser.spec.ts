import { afterEach, describe, expect, inject, it } from 'vitest';
import {
  canvasBackend,
  countDrawCalls,
  denyWebGL,
  denyWebGPU,
  emulateMotionPreference,
} from '~libs/example-runtime/testing';
import { createExampleEngine } from './create-example.engine';

/**
 * The backend this run is meant for (`vitest.browser.config.ts`): `webgpu` in a Chromium with its
 * WebGPU flags, `webgl2` in one without WebGPU, where `WebGPURenderer` falls back by itself.
 */
const backend = inject('backend');

function mount(): HTMLElement {
  const container = document.createElement('div');
  container.style.width = '480px';
  container.style.height = '320px';
  document.body.appendChild(container);
  return container;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  document.body.replaceChildren();
});

describe('createExampleEngine', () => {
  it(
    'a started engine puts one canvas in the container and reports its snapshot; dispose empties the container',
    {
      tags: ['scenario'],
      meta: {
        spec: 'engine-mounts-and-unmounts',
        arrange: 'a 480 × 320 container',
        act: 'an engine is created and disposed',
        assert: 'a canvas and a running snapshot while it lives; an empty container after',
      },
    },
    async () => {
      let container: HTMLElement;
      let engine: Awaited<ReturnType<typeof createExampleEngine>>;
      let canvases = 0;
      let running = false;
      arrange: {
        container = mount();
        engine = await createExampleEngine(container);
        canvases = container.querySelectorAll('canvas').length;
        running = engine.snapshot().running;
      }
      act: {
        engine.dispose();
      }
      assert: {
        expect(canvases).toBe(1);
        expect(running).toBe(true);
        expect(container.children).toHaveLength(0);
      }
    },
  );

  it(
    'the engine draws on the backend of the run: WebGPU where the browser has it, its WebGL 2 fallback where it has not',
    {
      tags: ['scenario'],
      meta: {
        spec: 'engine-runs-on-either-backend',
        arrange:
          'a container in a browser with WebGPU (the webgpu run) or without it (the webgl2 run), its draw calls counted',
        act: 'the engine is created',
        assert: 'its canvas holds the context of the run, and it draws',
      },
    },
    async () => {
      const counter = countDrawCalls();
      let engine: Awaited<ReturnType<typeof createExampleEngine>> | undefined;
      let container!: HTMLElement;
      let drawing = false;
      try {
        arrange: {
          container = mount();
        }
        act: {
          engine = await createExampleEngine(container);
          drawing = await counter.untilDrawn();
        }
        assert: {
          expect(canvasBackend(container.querySelector('canvas') as HTMLCanvasElement)).toBe(
            backend,
          );
          expect(drawing).toBe(true);
        }
      } finally {
        engine?.dispose();
        counter.restore();
      }
    },
  );

  it(
    'disposing right after creation, before the first frame, and again leaves nothing behind',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'engine-dispose-before-ready-and-twice',
        arrange: 'an engine that was created and disposed at once',
        act: 'it is disposed again and used afterwards',
        assert: 'the container stays empty and no call throws',
      },
    },
    async () => {
      let container: HTMLElement;
      let engine: Awaited<ReturnType<typeof createExampleEngine>>;
      let error: unknown;
      arrange: {
        container = mount();
        engine = await createExampleEngine(container);
        engine.dispose();
      }
      act: {
        try {
          engine.dispose();
          engine.setParams({});
          engine.setRunning(false);
        } catch (caught) {
          error = caught;
        }
      }
      assert: {
        expect(error).toBeUndefined();
        expect(container.children).toHaveLength(0);
      }
    },
  );

  it(
    'draw calls stop while the container is offscreen and resume when it is back, and the automatic pause emits no runningChanged',
    {
      tags: ['scenario'],
      meta: {
        spec: 'engine-pauses-offscreen',
        arrange: 'a running engine in a visible container, its draw calls counted',
        act: 'the container is hidden for a while and then shown again',
        assert:
          'draws stop and fps reads 0 while hidden, draws resume when shown, and runningChanged never fires',
      },
    },
    async () => {
      const counter = countDrawCalls();
      let engine: Awaited<ReturnType<typeof createExampleEngine>> | undefined;
      let container: HTMLElement;
      let drawingBefore = false;
      let hiddenDraws = -1;
      let hiddenFps = -1;
      let drawingAfter = false;
      const changes: boolean[] = [];
      try {
        arrange: {
          container = mount();
          engine = await createExampleEngine(container);
          engine.on('runningChanged', (running) => changes.push(running));
          drawingBefore = await counter.untilDrawn();
        }
        act: {
          container.style.display = 'none';
          await wait(1000);
          hiddenDraws = await counter.during(600);
          hiddenFps = engine.snapshot().fps;
          container.style.display = 'block';
          drawingAfter = await counter.untilDrawn();
        }
        assert: {
          expect(drawingBefore).toBe(true);
          expect(hiddenDraws).toBe(0);
          expect(hiddenFps).toBe(0);
          expect(drawingAfter).toBe(true);
          expect(changes).toEqual([]);
        }
      } finally {
        engine?.dispose();
        counter.restore();
      }
    },
  );

  it(
    'draw calls stop under reduced motion and resume when the preference is lifted, and the automatic pause emits no runningChanged',
    {
      tags: ['scenario'],
      meta: {
        spec: 'engine-pauses-under-reduced-motion',
        arrange: 'a running engine, its draw calls counted, on a page that allows motion',
        act: 'the page switches to reduced motion for a while and back',
        assert:
          'draws stop and fps reads 0 under reduced motion, draws resume afterwards, and runningChanged never fires',
      },
    },
    async () => {
      const counter = countDrawCalls();
      const motion = emulateMotionPreference(false);
      let engine: Awaited<ReturnType<typeof createExampleEngine>> | undefined;
      let drawingBefore = false;
      let reducedDraws = -1;
      let reducedFps = -1;
      let drawingAfter = false;
      const changes: boolean[] = [];
      try {
        arrange: {
          engine = await createExampleEngine(mount());
          engine.on('runningChanged', (running) => changes.push(running));
          drawingBefore = await counter.untilDrawn();
        }
        act: {
          motion.set(true);
          await wait(1000);
          reducedDraws = await counter.during(600);
          reducedFps = engine.snapshot().fps;
          motion.set(false);
          drawingAfter = await counter.untilDrawn();
        }
        assert: {
          expect(drawingBefore).toBe(true);
          expect(reducedDraws).toBe(0);
          expect(reducedFps).toBe(0);
          expect(drawingAfter).toBe(true);
          expect(changes).toEqual([]);
        }
      } finally {
        engine?.dispose();
        motion.restore();
        counter.restore();
      }
    },
  );

  it(
    'setRunning(false) stops the draw calls and emits runningChanged once, and setRunning(true) resumes them',
    {
      tags: ['scenario'],
      meta: {
        spec: 'engine-set-running-reports',
        arrange: 'a running engine, its draw calls counted, with a runningChanged listener',
        act: 'setRunning(false) is called twice, then setRunning(true)',
        assert:
          'one false event, no draws and fps 0 while stopped, then a true event and draws again',
      },
    },
    async () => {
      const counter = countDrawCalls();
      let engine: Awaited<ReturnType<typeof createExampleEngine>> | undefined;
      let drawingBefore = false;
      let stoppedDraws = -1;
      let stoppedFps = -1;
      let stoppedSnapshot = true;
      let drawingAfter = false;
      const changes: boolean[] = [];
      try {
        arrange: {
          engine = await createExampleEngine(mount());
          engine.on('runningChanged', (running) => changes.push(running));
          drawingBefore = await counter.untilDrawn();
        }
        act: {
          engine.setRunning(false);
          engine.setRunning(false);
          await wait(1000);
          stoppedDraws = await counter.during(600);
          stoppedFps = engine.snapshot().fps;
          stoppedSnapshot = engine.snapshot().running;
          engine.setRunning(true);
          drawingAfter = await counter.untilDrawn();
        }
        assert: {
          expect(drawingBefore).toBe(true);
          expect(stoppedDraws).toBe(0);
          expect(stoppedFps).toBe(0);
          expect(stoppedSnapshot).toBe(false);
          expect(drawingAfter).toBe(true);
          expect(changes).toEqual([false, true]);
        }
      } finally {
        engine?.dispose();
        counter.restore();
      }
    },
  );

  it(
    'creation rejects when neither WebGPU nor WebGL 2 is available and leaves nothing in the container',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'engine-creation-fails-without-webgpu-and-webgl',
        arrange: 'a container on a page without navigator.gpu whose canvases give no WebGL context',
        act: 'the engine is created',
        assert: 'the promise rejects with an Error and the container has no children',
      },
    },
    async () => {
      let container: HTMLElement;
      let restoreWebGL: (() => void) | undefined;
      let restoreWebGPU: (() => void) | undefined;
      let error: unknown;
      arrange: {
        container = mount();
        restoreWebGPU = denyWebGPU();
        restoreWebGL = denyWebGL();
      }
      try {
        act: {
          try {
            await createExampleEngine(container);
          } catch (caught) {
            error = caught;
          }
        }
      } finally {
        restoreWebGL();
        restoreWebGPU();
      }
      assert: {
        expect(error).toBeInstanceOf(Error);
        expect(container.children).toHaveLength(0);
      }
    },
  );

  it(
    'a parameter change and a resize repaint the canvas while the loop is stopped',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'engine-repaints-while-paused',
        arrange: 'an engine whose loop was stopped with setRunning(false), its draw calls counted',
        act: 'a parameter is patched and the container is resized',
        assert: 'each of the two changes issues draw calls although the loop is stopped',
      },
    },
    async () => {
      const counter = countDrawCalls();
      let engine: Awaited<ReturnType<typeof createExampleEngine>> | undefined;
      let container: HTMLElement;
      let paramDraws = -1;
      let resizeDraws = -1;
      try {
        arrange: {
          container = mount();
          engine = await createExampleEngine(container);
          engine.setRunning(false);
          await wait(1000);
          counter.reset();
        }
        act: {
          engine.setParams({ speed: 2 });
          paramDraws = counter.count;
          container.style.width = '300px';
          await wait(500);
          resizeDraws = counter.count - paramDraws;
        }
        assert: {
          expect(paramDraws).toBeGreaterThan(0);
          expect(resizeDraws).toBeGreaterThan(0);
        }
      } finally {
        engine?.dispose();
        counter.restore();
      }
    },
  );
});
