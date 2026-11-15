/**
 * A one-shot action an engine offers its host, such as "add a bunny". Any UI renders one
 * button per spec (with a choice of the argument when the command takes one); the engine stays
 * the authority on what the command does and refuses an argument it does not offer.
 */
export type CommandSpec<C extends string = string> = {
  /** The value a host passes to `dispatch`. */
  key: C;
  /** The button label. */
  label: string;
  /** What the command does, as a short sentence fragment, for a tooltip. */
  description?: string;
  /** The command's one argument, when it takes one: its label and the values it accepts. */
  argument?: { label: string; options: readonly { value: string; label: string }[] };
};
