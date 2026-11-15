/** Receives whether the observed element intersects the viewport. */
export type VisibilityHandler = (visible: boolean) => void;

/**
 * Reports whether `element` is visible in the viewport, through an `IntersectionObserver`.
 * Where the API does not exist (old browsers, Node) it never reports, and the element counts
 * as visible.
 * @lifetime engine
 * @owns an `IntersectionObserver` observing `element`.
 * @cleanup `dispose()` disconnects the observer; calling it twice is harmless.
 */
export class VisibilityControls {
  readonly #observer: IntersectionObserver | undefined;

  constructor(element: Element, onChange: VisibilityHandler) {
    if (typeof globalThis.IntersectionObserver === 'undefined') return;
    this.#observer = new globalThis.IntersectionObserver((entries) => {
      // Entries are in time order; the last one is the current state.
      const latest = entries.at(-1);
      if (latest) onChange(latest.isIntersecting);
    });
    this.#observer.observe(element);
  }

  /** Disconnects the observer. */
  dispose(): void {
    this.#observer?.disconnect();
  }
}
