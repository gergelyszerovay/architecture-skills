import { parseArgs } from 'node:util';
import type { Greet } from '../core/greet.use-case.ts';

/** The greet command: runs with the arguments after the program name and answers the exit code. */
export type GreetCommand = (args: string[]) => number;

/**
 * Builds the greet command: `--name <name>` greets that person, `--help` prints the usage.
 * @param deps - What the command needs.
 *   - `greet`: The greet use case.
 *   - `write`: Writes text to the command's output.
 *   - `writeError`: Writes text to the command's error output.
 * @returns The command.
 */
export const makeGreetCommand =
  (deps: {
    greet: Greet;
    write: (text: string) => void;
    writeError: (text: string) => void;
  }): GreetCommand =>
  (args) => {
    let values: { name?: string | undefined; help?: boolean | undefined };
    try {
      ({ values } = parseArgs({
        args,
        options: { name: { type: 'string' }, help: { type: 'boolean' } },
        allowPositionals: false,
      }));
    } catch (error) {
      deps.writeError(`${error instanceof Error ? error.message : String(error)}\n`);
      return 2;
    }
    if (values.help === true) {
      deps.write('Usage: --name <name>\n');
      return 0;
    }
    deps.write(`${deps.greet({ name: values.name ?? '' }).text}\n`);
    return 0;
  };
