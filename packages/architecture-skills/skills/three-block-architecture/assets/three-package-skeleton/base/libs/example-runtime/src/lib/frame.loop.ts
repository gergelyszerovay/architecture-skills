import { Timer } from 'three';

/**
 * The part of a renderer a {@link FrameLoop} drives: `WebGPURenderer` (whose `setAnimationLoop`
 * returns a promise) and `WebGLRenderer` both have it.
 */
export type AnimationLoopRenderer = {
  /** Calls `callback` once per displayed frame with a timestamp in milliseconds; `null` stops it. */
  setAnimationLoop(callback: ((timestamp: number) => void) | null): unknown;
};

/** Callbacks a {@link FrameLoop} drives. */
export type FrameLoopCallbacks = {
  /** Runs once per displayed frame with the delta in seconds. */
  frame: (dt: number) => void;
  /** Runs at most every `fpsIntervalSeconds` with the measured frame rate. */
  fps: (fps: number) => void;
};

/**
 * Drives `renderer.setAnimationLoop` with a `Timer`, measures the frame rate and pauses
 * without losing time when stopped.
 * @lifetime engine
 * @owns the renderer's animation loop and a `Timer` connected to `visibility`.
 * @cleanup `dispose()` clears the animation loop and disposes the timer.
 */
export class FrameLoop {
  readonly #renderer: AnimationLoopRenderer;
  readonly #callbacks: FrameLoopCallbacks;
  readonly #fpsInterval: number;
  readonly #timer = new Timer();
  #running = false;
  #frames = 0;
  #sinceReport = 0;
  #fps = 0;

  constructor(
    renderer: AnimationLoopRenderer,
    visibility: Document,
    callbacks: FrameLoopCallbacks,
    fpsIntervalSeconds = 0.5,
  ) {
    this.#renderer = renderer;
    this.#callbacks = callbacks;
    this.#fpsInterval = fpsIntervalSeconds;
    this.#timer.connect(visibility);
  }

  /** Whether frames are currently being produced. */
  get running(): boolean {
    return this.#running;
  }

  /** The last measured frame rate. */
  get fps(): number {
    return this.#fps;
  }

  /** Starts producing frames; does nothing when already running. */
  start(): void {
    if (this.#running) return;
    this.#running = true;
    this.#timer.reset();
    this.#renderer.setAnimationLoop((timestamp: number) => this.#tick(timestamp));
  }

  /** Stops producing frames; the last frame stays on the canvas. */
  stop(): void {
    if (!this.#running) return;
    this.#running = false;
    this.#renderer.setAnimationLoop(null);
    this.#fps = 0;
    this.#callbacks.fps(0);
  }

  /** Stops the loop and releases the timer. */
  dispose(): void {
    this.#running = false;
    this.#renderer.setAnimationLoop(null);
    this.#timer.dispose();
  }

  #tick(timestamp: number): void {
    this.#timer.update(timestamp);
    const dt = Math.min(this.#timer.getDelta(), 0.1);
    this.#callbacks.frame(dt);
    this.#frames += 1;
    this.#sinceReport += dt;
    if (this.#sinceReport >= this.#fpsInterval) {
      this.#fps = Math.round(this.#frames / this.#sinceReport);
      this.#frames = 0;
      this.#sinceReport = 0;
      this.#callbacks.fps(this.#fps);
    }
  }
}
