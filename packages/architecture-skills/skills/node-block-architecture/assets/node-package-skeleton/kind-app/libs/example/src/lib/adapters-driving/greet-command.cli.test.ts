import { describe, expect, it } from 'vitest';
import { makeFakeClock } from '../testing/fake-clock.fake.ts';
import { makeGreet } from '../core/greet.use-case.ts';
import { makeGreetCommand } from './greet-command.cli.ts';

/**
 * Runs the command against a morning clock and records what it writes.
 * @param args - The command's arguments.
 * @returns The exit code and the text written to each output.
 */
const runCommand = (args: string[]): { code: number; out: string; err: string } => {
  const written = { out: '', err: '' };
  const code = makeGreetCommand({
    greet: makeGreet({ clock: makeFakeClock(new Date(2026, 0, 5, 9)) }),
    write: (text) => {
      written.out += text;
    },
    writeError: (text) => {
      written.err += text;
    },
  })(args);
  return { code, ...written };
};

describe('makeGreetCommand', () => {
  it(
    'prints the greeting for the given name',
    {
      tags: ['scenario'],
      meta: {
        spec: 'greet-command-prints-greeting',
        arrange: 'a morning clock',
        act: 'the command runs with `--name Ada`',
        assert: 'it exits with 0 and prints the morning greeting for Ada',
      },
    },
    () => {
      let result: ReturnType<typeof runCommand>;
      act: {
        result = runCommand(['--name', 'Ada']);
      }
      assert: {
        expect(result).toEqual({ code: 0, out: 'Good morning, Ada\n', err: '' });
      }
    },
  );

  it(
    'rejects an unknown option with exit code 2',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'greet-command-rejects-unknown-option',
        arrange: 'a morning clock',
        act: 'the command runs with `--loud`',
        assert: 'it exits with 2, prints nothing to the output and explains on the error output',
      },
    },
    () => {
      let result: ReturnType<typeof runCommand>;
      act: {
        result = runCommand(['--loud']);
      }
      assert: {
        expect(result.code).toBe(2);
        expect(result.out).toBe('');
        expect(result.err).toContain('--loud');
      }
    },
  );
});
