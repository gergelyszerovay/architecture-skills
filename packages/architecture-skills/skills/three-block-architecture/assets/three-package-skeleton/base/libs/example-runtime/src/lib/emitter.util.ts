/** A typed event emitter; listeners run synchronously in subscription order. */
export class Emitter<E extends Record<string, unknown>> {
  readonly #listeners = new Map<keyof E, Set<(payload: never) => void>>();

  /** Adds a listener and returns a function that removes it. */
  on<K extends keyof E>(type: K, listener: (payload: E[K]) => void): () => void {
    let set = this.#listeners.get(type);
    if (!set) {
      set = new Set();
      this.#listeners.set(type, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  /** Calls every listener of `type` with `payload`. */
  emit<K extends keyof E>(type: K, payload: E[K]): void {
    const set = this.#listeners.get(type);
    if (!set) return;
    for (const listener of Array.from(set)) (listener as (payload: E[K]) => void)(payload);
  }

  /** Removes every listener. */
  clear(): void {
    this.#listeners.clear();
  }
}
