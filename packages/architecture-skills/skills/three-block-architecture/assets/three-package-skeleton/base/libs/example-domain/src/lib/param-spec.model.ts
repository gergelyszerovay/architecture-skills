/** What every spec row has, whatever its kind. */
type ParamSpecBase<P> = {
  /** The parameter's key in the params record. */
  key: keyof P & string;
  label: string;
  /** The panel group a UI puts the control in. */
  group: string;
  /**
   * When a change takes effect: `look` writes a uniform or a flag on the next frame; `build`
   * changes geometry, a painted texture or a render target, so the engine rebuilds that part.
   */
  phase: 'build' | 'look';
};

/**
 * A host-editable parameter of a params record `P`. Any UI renders one control per spec, grouped
 * by `group`; the engine stays the authority on valid values, and its clamp rule reads the bounds
 * and options from these rows, so the table is the only place they are written.
 */
export type ParamSpec<P = Record<string, unknown>> = ParamSpecBase<P> &
  (
    | { kind: 'range'; min: number; max: number; step: number; default: number }
    | { kind: 'enum'; options: readonly { value: string; label: string }[]; default: string }
    | { kind: 'toggle'; default: boolean }
    | { kind: 'color'; default: string }
  );
