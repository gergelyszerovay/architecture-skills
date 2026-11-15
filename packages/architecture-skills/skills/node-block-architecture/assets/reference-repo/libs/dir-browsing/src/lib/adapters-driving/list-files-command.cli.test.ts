import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCommand } from 'citty';
import type { FileInfo } from '../core/file-info.model.ts';
import type { ListFilesResult } from '../core/list-files/list-files.result.ts';
import { makeListFilesCommand } from './list-files-command.cli.ts';

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

const files: FileInfo[] = [{ path: 'a.txt', size: 5, modifiedAt: new Date(0) }];
const found: ListFilesResult = { kind: 'ok', files };

describe('makeListFilesCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it(
    'maps arguments to the use case and prints the rendered file list',
    {
      tags: ['scenario'],
      meta: {
        spec: 'ls-cli-prints-files',
        arrange: 'a use case answering one file `a.txt` of 5 bytes',
        act: 'the command runs with `docs --all`',
        assert:
          'the use case got the path and the hidden flag, the list is printed, and no exit code is set',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let stdout: ReturnType<typeof spyOnStdout>;
      let command: ReturnType<typeof makeListFilesCommand>;
      arrange: {
        stdout = spyOnStdout();
        command = makeListFilesCommand({
          listFiles: (input) => {
            calls.push(input);
            return Promise.resolve(found);
          },
        });
      }
      act: {
        await runCommand(command, { rawArgs: ['docs', '--all'] });
      }
      assert: {
        expect(calls).toEqual([{ path: 'docs', showHidden: true }]);
        expect(stdout.mock.calls).toEqual([['         5  a.txt']]);
        expect(process.exitCode).toBeUndefined();
      }
    },
  );

  it(
    'prints the files as JSON when asked',
    {
      tags: ['scenario'],
      meta: {
        spec: 'ls-cli-json-output',
        arrange: 'a use case answering one file `a.txt`',
        act: 'the command runs with `--json`',
        assert: 'the files are printed as JSON',
      },
    },
    async () => {
      let stdout: ReturnType<typeof spyOnStdout>;
      let command: ReturnType<typeof makeListFilesCommand>;
      arrange: {
        stdout = spyOnStdout();
        command = makeListFilesCommand({ listFiles: () => Promise.resolve(found) });
      }
      act: {
        await runCommand(command, { rawArgs: ['--json'] });
      }
      assert: {
        expect(stdout.mock.calls).toEqual([[JSON.stringify(files)]]);
      }
    },
  );

  it(
    'exits with 1 and names the path when it is not found',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'ls-cli-not-found',
        arrange: 'a use case answering `not-found` for `x`',
        act: 'the command runs with `x`',
        assert: 'the exit code is 1 and stderr says `Not found: x`',
      },
    },
    async () => {
      let stderr: ReturnType<typeof spyOnStderr>;
      let command: ReturnType<typeof makeListFilesCommand>;
      arrange: {
        stderr = spyOnStderr();
        command = makeListFilesCommand({
          listFiles: () => Promise.resolve({ kind: 'not-found', path: 'x' }),
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
