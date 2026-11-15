import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCommand } from 'citty';
import type { TreeNode } from '../core/tree-node.model.ts';
import type { GetDirTreeResult } from '../core/get-dir-tree/get-dir-tree.result.ts';
import { makeDirTreeCommand } from './dir-tree-command.cli.ts';

/**
 * Silences and records what the command prints to stdout.
 * @returns The spy on `console.log`.
 */
const spyOnStdout = (): MockInstance<typeof console.log> =>
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
/**
 * Silences and records what the command prints to stderr.
 * @returns The spy on `console.error`.
 */
const spyOnStderr = (): MockInstance<typeof console.log> =>
  vi.spyOn(console, 'error').mockImplementation(() => undefined);

const tree: TreeNode = {
  name: 'src',
  kind: 'directory',
  children: [{ name: 'a.ts', kind: 'file', children: [] }],
};
const found: GetDirTreeResult = { kind: 'ok', tree };

describe('makeDirTreeCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it(
    'maps arguments to the use case and prints the rendered tree',
    {
      tags: ['scenario'],
      meta: {
        spec: 'tree-cli-prints-tree',
        arrange: 'a use case answering a tree `src` holding `a.ts`',
        act: 'the command runs with `src --depth 2`',
        assert:
          'the use case got the path, depth and hidden flag, the tree is printed, and no exit code is set',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let stdout: ReturnType<typeof spyOnStdout>;
      let command: ReturnType<typeof makeDirTreeCommand>;
      arrange: {
        stdout = spyOnStdout();
        command = makeDirTreeCommand({
          getDirTree: (input) => {
            calls.push(input);
            return Promise.resolve(found);
          },
        });
      }
      act: {
        await runCommand(command, { rawArgs: ['src', '--depth', '2'] });
      }
      assert: {
        expect(calls).toEqual([{ path: 'src', maxDepth: 2, showHidden: false }]);
        expect(stdout.mock.calls).toEqual([['src\n└── a.ts']]);
        expect(process.exitCode).toBeUndefined();
      }
    },
  );

  it(
    'prints the tree as JSON when asked, including hidden entries on request',
    {
      tags: ['scenario'],
      meta: {
        spec: 'tree-cli-json-output',
        arrange: 'a use case answering a tree `src` holding `a.ts`',
        act: 'the command runs with `src --json --all`',
        assert: 'the use case is asked for hidden entries and the tree is printed as JSON',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let stdout: ReturnType<typeof spyOnStdout>;
      let command: ReturnType<typeof makeDirTreeCommand>;
      arrange: {
        stdout = spyOnStdout();
        command = makeDirTreeCommand({
          getDirTree: (input) => {
            calls.push(input);
            return Promise.resolve(found);
          },
        });
      }
      act: {
        await runCommand(command, { rawArgs: ['src', '--json', '--all'] });
      }
      assert: {
        expect(calls).toEqual([{ path: 'src', maxDepth: undefined, showHidden: true }]);
        expect(stdout.mock.calls).toEqual([[JSON.stringify(tree)]]);
      }
    },
  );

  it(
    'exits with 2 on invalid arguments without calling the use case',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-cli-invalid-arguments',
        arrange: 'a use case that must not be called',
        act: 'the command runs with `--depth zero`',
        assert: 'the exit code is 2, the problem is on stderr, and the use case was not called',
      },
    },
    async () => {
      let called = false;
      let stderr: ReturnType<typeof spyOnStderr>;
      let command: ReturnType<typeof makeDirTreeCommand>;
      arrange: {
        stderr = spyOnStderr();
        command = makeDirTreeCommand({
          getDirTree: () => {
            called = true;
            return Promise.resolve(found);
          },
        });
      }
      act: {
        await runCommand(command, { rawArgs: ['--depth', 'zero'] });
      }
      assert: {
        expect(process.exitCode).toBe(2);
        expect(stderr).toHaveBeenCalledOnce();
        expect(called).toBe(false);
      }
    },
  );

  it(
    'exits with 1 and names the path when it is not found',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-cli-not-found',
        arrange: 'a use case answering `not-found` for `x`',
        act: 'the command runs with `x`',
        assert: 'the exit code is 1 and stderr says `Not found: x`',
      },
    },
    async () => {
      let stderr: ReturnType<typeof spyOnStderr>;
      let command: ReturnType<typeof makeDirTreeCommand>;
      arrange: {
        stderr = spyOnStderr();
        command = makeDirTreeCommand({
          getDirTree: () => Promise.resolve({ kind: 'not-found', path: 'x' }),
        });
      }
      act: {
        await runCommand(command, { rawArgs: ['x'] });
      }
      assert: {
        expect(process.exitCode).toBe(1);
        expect(stderr.mock.calls).toEqual([['Not found: x']]);
      }
    },
  );
});
