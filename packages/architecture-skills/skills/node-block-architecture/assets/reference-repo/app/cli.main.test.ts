import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// the source entry runs under type stripping; the built entry is what `bin` publishes
const entries: [label: string, main: string][] = [
  ['source', fileURLToPath(new URL('./cli.main.ts', import.meta.url))],
  ['built', fileURLToPath(new URL('../dist/cli.main.mjs', import.meta.url))],
];
const root = fileURLToPath(new URL('../', import.meta.url));

for (const [label, main] of entries) {
  describe(`cli.main (${label} entry)`, () => {
    // the built entry exists only after `pnpm run build`
    it.skipIf(!existsSync(main))(
      'prints the tree of a folder to stdout, with nothing on stderr',
      {
        tags: ['scenario'],
        meta: {
          spec: 'cli-binary-prints-tree',
          arrange: 'the repository as the working directory',
          act: 'the binary runs `tree libs --depth 1`',
          assert:
            'it exits with 0, stdout is the tree headed `libs` listing `dir-browsing/`, and stderr is empty',
        },
      },
      async () => {
        let child: ReturnType<typeof spawn>;
        let stdout = '';
        let stderr = '';
        let exitCode: number | null;
        arrange: {
          child = spawn(process.execPath, [main, 'tree', 'libs', '--depth', '1'], {
            cwd: root,
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
          expect(stdout.startsWith('libs\n')).toBe(true);
          expect(stdout).toContain('dir-browsing/');
          expect(stderr).toBe('');
        }
      },
    );
  });
}
