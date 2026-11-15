import { describe, expect, it } from 'vitest';
import { composeExample } from './compose-example.composition.ts';

describe('composeExample', () => {
  it(
    'wires a command that greets by name',
    {
      tags: ['scenario'],
      meta: {
        spec: 'compose-greets-by-name',
        arrange: 'the composition with its output captured',
        act: 'the command runs with `--name Ada`',
        assert: 'it exits with 0 and prints a greeting for Ada',
      },
    },
    () => {
      let out = '';
      let code: number;
      act: {
        code = composeExample({
          write: (text) => {
            out += text;
          },
          writeError: () => undefined,
        })(['--name', 'Ada']);
      }
      assert: {
        expect(code).toBe(0);
        expect(out).toMatch(/^Good (morning|afternoon|evening), Ada\n$/);
      }
    },
  );
});
