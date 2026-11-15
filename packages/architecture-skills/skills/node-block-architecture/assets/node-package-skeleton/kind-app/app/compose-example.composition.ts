import { makeGreet, makeGreetCommand, makeSystemClock, type GreetCommand } from '#libs/example';

/**
 * Wires the greet command to the system clock.
 * @param deps - Where the command writes.
 *   - `write`: Writes text to the output.
 *   - `writeError`: Writes text to the error output.
 * @returns The command, ready to run with the process arguments.
 */
export const composeExample = (deps: {
  write: (text: string) => void;
  writeError: (text: string) => void;
}): GreetCommand =>
  makeGreetCommand({
    greet: makeGreet({ clock: makeSystemClock() }),
    write: deps.write,
    writeError: deps.writeError,
  });
