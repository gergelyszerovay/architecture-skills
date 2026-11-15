/** Actions keyed by `KeyboardEvent.code` (for example `Space`, `KeyR`). */
export type KeyBindings = Readonly<Record<string, () => void>>;

/**
 * Runs bound actions for keys pressed while `element` has focus. Binding to the canvas,
 * not `window`, keeps simulation keys from fighting the host page's own shortcuts.
 * @lifetime engine
 * @owns a `keydown` listener on `element`.
 * @cleanup `dispose()` removes the listener.
 */
export class KeyboardControls {
  readonly #element: HTMLElement;
  readonly #bindings: KeyBindings;
  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const action = this.#bindings[event.code];
    if (!action) return;
    event.preventDefault();
    action();
  };

  constructor(element: HTMLElement, bindings: KeyBindings) {
    this.#element = element;
    this.#bindings = bindings;
    element.addEventListener('keydown', this.#onKeyDown);
  }

  /** Removes the listener. */
  dispose(): void {
    this.#element.removeEventListener('keydown', this.#onKeyDown);
  }
}
