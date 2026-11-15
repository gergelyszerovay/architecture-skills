import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const main = fileURLToPath(new URL('./example.main.ts', import.meta.url));

describe('example.main', () => {
  it(
    'prints a greeting to stdout, with nothing on stderr',
    {
      tags: ['scenario'],
      meta: {
        spec: 'main-prints-greeting',
        arrange: 'the entry run as a Node process',
        act: 'it runs with `--name Ada`',
        assert: 'it exits with 0, stdout is a greeting for Ada and stderr is empty',
      },
    },
    async () => {
      let child: ReturnType<typeof spawn>;
      let stdout = '';
      let stderr = '';
      let exitCode: number | null;
      arrange: {
        child = spawn(process.execPath, [main, '--name', 'Ada'], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout?.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });
        child.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });
      }
      act: {
        exitCode = await new Promise((resolve) => {
          child.once('close', resolve);
        });
      }
      assert: {
        expect(exitCode).toBe(0);
        expect(stdout).toMatch(/^Good (morning|afternoon|evening), Ada\n$/);
        expect(stderr).toBe('');
      }
    },
  );
});
