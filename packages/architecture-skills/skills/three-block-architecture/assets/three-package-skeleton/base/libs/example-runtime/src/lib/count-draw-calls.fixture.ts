/** What {@link countDrawCalls} reports. */
export type DrawCallCounter = {
  /** Draw calls of either backend since the start or the last `reset`. */
  readonly count: number;
  /** Sets the count to zero. */
  reset(): void;
  /** Resets the count, waits `milliseconds` and resolves with the draw calls issued meanwhile. */
  during(milliseconds: number): Promise<number>;
  /** Resolves `true` at the next draw call, or `false` when none comes within `timeoutMs`. */
  untilDrawn(timeoutMs?: number): Promise<boolean>;
  /** Puts the original methods back. */
  restore(): void;
};

type Method = (...args: unknown[]) => unknown;

/** The draw methods of WebGL 2, and of a WebGPU render pass. */
const drawMethods: readonly (readonly [string, readonly string[]])[] = [
  [
    'WebGL2RenderingContext',
    [
      'drawArrays',
      'drawElements',
      'drawArraysInstanced',
      'drawElementsInstanced',
      'drawRangeElements',
    ],
  ],
  ['GPURenderPassEncoder', ['draw', 'drawIndexed', 'drawIndirect', 'drawIndexedIndirect']],
];

/**
 * Counts the draw calls of either backend of `WebGPURenderer` from now on, by wrapping the draw
 * methods of `WebGL2RenderingContext.prototype` and `GPURenderPassEncoder.prototype` (where the
 * browser has it). For browser specs of an engine's pause gates: a stopped loop issues none.
 * Call `restore()` in a `finally` or `afterEach`.
 */
export function countDrawCalls(): DrawCallCounter {
  const originals: [Record<string, Method>, string, Method][] = [];
  let count = 0;
  const globals = globalThis as unknown as Record<string, { prototype: object } | undefined>;
  for (const [name, methods] of drawMethods) {
    const prototype = globals[name]?.prototype as Record<string, Method> | undefined;
    if (prototype === undefined) continue;
    for (const method of methods) {
      const original = prototype[method];
      if (!original) continue;
      originals.push([prototype, method, original]);
      prototype[method] = function counted(this: unknown, ...args: unknown[]) {
        count += 1;
        return original.apply(this, args);
      };
    }
  }
  return {
    get count() {
      return count;
    },
    reset() {
      count = 0;
    },
    async untilDrawn(timeoutMs = 8000) {
      const start = count;
      const deadline = Date.now() + timeoutMs;
      while (count === start && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      return count > start;
    },
    async during(milliseconds) {
      count = 0;
      await new Promise((resolve) => setTimeout(resolve, milliseconds));
      return count;
    },
    restore() {
      for (const [prototype, method, original] of originals) prototype[method] = original;
      originals.length = 0;
    },
  };
}
