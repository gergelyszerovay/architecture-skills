/**
 * A key or pointer binding an engine offers on its focused canvas, described as plain data so
 * any host can list it (for example in a controls hint). The engine stays the authority on
 * what the binding does; the spec only names it.
 */
export type InputBindingSpec = {
  /** `KeyboardEvent.code` values that trigger the binding, for example `["KeyW", "ArrowUp"]`; empty for a pointer-only binding. */
  keys: readonly string[];
  /** The pointer gesture of the binding, if any. */
  pointer?: 'move' | 'drag' | 'wheel' | 'tap' | 'pinch';
  /** What the binding does, as a short sentence fragment, for example `"pause or resume"`. */
  description: string;
};
