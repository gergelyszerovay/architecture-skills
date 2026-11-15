/** Receives whether `prefers-reduced-motion: reduce` currently matches. */
export type MotionPreferenceHandler = (reduced: boolean) => void;

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the `prefers-reduced-motion: reduce` media query and reports every change. Where
 * `matchMedia` does not exist it reports no preference (`matches` is `false`).
 * @lifetime engine
 * @owns a `change` listener on the media query list.
 * @cleanup `dispose()` removes the listener; calling it twice is harmless.
 */
export class MotionPreferenceControls {
  readonly #query: MediaQueryList | undefined;
  readonly #onChange = (event: MediaQueryListEvent): void => {
    this.#handler(event.matches);
  };
  readonly #handler: MotionPreferenceHandler;

  constructor(handler: MotionPreferenceHandler) {
    this.#handler = handler;
    if (typeof globalThis.matchMedia !== 'function') return;
    this.#query = globalThis.matchMedia(reducedMotionQuery);
    this.#query.addEventListener('change', this.#onChange);
  }

  /** Whether the user currently prefers reduced motion. */
  get matches(): boolean {
    return this.#query?.matches ?? false;
  }

  /** Removes the listener. */
  dispose(): void {
    this.#query?.removeEventListener('change', this.#onChange);
  }
}
