import type { EngineSnapshot } from './engine-snapshot.model';

/**
 * What a host (Angular, React, a plain page) can do with a running engine. Every value
 * crossing this boundary is plain, serialisable data.
 */
export type EffectEngine<P, E extends Record<string, unknown>, S = undefined> = {
  /** Merges a patch into the params; the engine clamps invalid values. */
  setParams(patch: Partial<P>): void;
  /**
   * The host's intent to animate. The frame loop runs only while this is `true` and no
   * automatic pause applies (offscreen, reduced motion; see `shouldRunLoop`).
   */
  setRunning(running: boolean): void;
  /** Subscribes to an engine event; returns the unsubscribe function. */
  on<K extends keyof E>(type: K, listener: (payload: E[K]) => void): () => void;
  /** Returns the current params, running flag, frame rate and readout values. */
  snapshot(): EngineSnapshot<P, S>;
  /** Releases the canvas, the WebGL context and every listener; safe to call twice. */
  dispose(): void;
};
