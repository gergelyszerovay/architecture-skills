/**
 * A domain fact an engine reports to its host, such as a score. The engine reports the values
 * in its snapshot's `state`; any UI renders one chip per spec.
 */
export type ReadoutSpec = {
  /** The key of the value in the engine's `state` record. */
  key: string;
  /** The chip label. */
  label: string;
  /** `count` is a whole number the host may pluralise; `text` is shown as is. */
  format: 'count' | 'text';
};
