/** What {@link emulateMotionPreference} returns. */
export type MotionPreferenceEmulation = {
  /** Sets the `prefers-reduced-motion: reduce` preference and tells the listeners of the query. */
  set(reduced: boolean): void;
  /** Puts the original `matchMedia` back. */
  restore(): void;
};

const reducedQuery = '(prefers-reduced-motion: reduce)';

/**
 * Replaces `matchMedia` for the reduced-motion query with a query the spec controls, starting at
 * `reduced`; other queries go to the original. An engine created afterwards reads the starting
 * value, and `set` changes it later like the user's setting would. Call `restore()` in a
 * `finally` or `afterEach`.
 */
export function emulateMotionPreference(reduced = false): MotionPreferenceEmulation {
  const original = globalThis.matchMedia.bind(globalThis);
  let matches = reduced;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    media: reducedQuery,
    onchange: null,
    get matches() {
      return matches;
    },
    addEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === 'change') listeners.delete(listener);
    },
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return true;
    },
  } as unknown as MediaQueryList;
  globalThis.matchMedia = ((text: string) =>
    text === reducedQuery ? query : original(text)) as typeof globalThis.matchMedia;
  return {
    set(next) {
      matches = next;
      for (const listener of listeners) {
        listener({ matches: next, media: reducedQuery } as MediaQueryListEvent);
      }
    },
    restore() {
      globalThis.matchMedia = original;
      listeners.clear();
    },
  };
}
