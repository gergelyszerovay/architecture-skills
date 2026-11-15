import { isInputRequiredResult } from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { pino } from 'pino';
import type { DeleteFilesResult } from '../core/delete-files/delete-files.result.ts';
import { captureTool } from '../testing/capture-tool.fixture.ts';
import type { CapturedTool } from '../testing/captured-tool.fixture.ts';
import { outcomeText } from '../testing/outcome-text.fixture.ts';
import { registerDeleteFilesTool } from './register-delete-files.tool.ts';

const log = pino({ level: 'silent' });

/**
 * Registers the tool over `/data` with a stubbed use case.
 * @param result - What the use case answers.
 * @param calls - Receives each input the use case is called with.
 * @returns The captured tool.
 */
const setUp = (result: DeleteFilesResult, calls: unknown[] = []): CapturedTool =>
  captureTool((server) =>
    registerDeleteFilesTool(
      server,
      {
        deleteFiles: (input) => {
          calls.push(input);
          return Promise.resolve(result);
        },
      },
      '/data',
      log,
    ),
  );

describe('registerDeleteFilesTool', () => {
  it(
    'deletes files inside the root and reports how many',
    {
      tags: ['scenario'],
      meta: {
        spec: 'delete-tool-deletes-files',
        arrange: 'a use case answering two deletions, and the root `/data`',
        act: 'the tool is called with the paths `a.txt` and `b.txt`',
        assert:
          'the use case got the absolute paths, unconfirmed, and the text says 2 were deleted',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      let text: string;
      arrange: {
        tool = setUp({ kind: 'deleted', count: 2 }, calls);
      }
      act: {
        text = outcomeText(await tool.call({ paths: ['a.txt', 'b.txt'] }));
      }
      assert: {
        expect(calls).toEqual([{ paths: ['/data/a.txt', '/data/b.txt'], confirmed: false }]);
        expect(text).toBe('Deleted 2 file(s).');
      }
    },
  );

  it(
    'passes the confirmation on when the user accepted the question',
    {
      tags: ['scenario'],
      meta: {
        spec: 'delete-tool-confirmed-retry',
        arrange: 'a use case answering one deletion, and an accepted answer to `confirm`',
        act: 'the tool is called again with the paths and the accepted answer',
        assert: 'the use case is called with `confirmed: true`',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      arrange: {
        tool = setUp({ kind: 'deleted', count: 1 }, calls);
      }
      act: {
        await tool.call(
          { paths: ['a.txt'] },
          { confirm: { action: 'accept', content: { confirm: true } } },
        );
      }
      assert: {
        expect(calls).toEqual([{ paths: ['/data/a.txt'], confirmed: true }]);
      }
    },
  );

  it(
    'asks the user to confirm when the use case says confirmation is needed',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'delete-tool-asks-confirmation',
        arrange: 'a use case answering `needs-confirmation`',
        act: 'the tool is called with one path and no answer',
        assert: 'the outcome is an input-required elicitation, not a result',
      },
    },
    async () => {
      let tool: CapturedTool;
      let outcome: Awaited<ReturnType<CapturedTool['call']>>;
      arrange: {
        tool = setUp({ kind: 'needs-confirmation', question: 'Delete 11 files?' });
      }
      act: {
        outcome = await tool.call({ paths: ['a.txt'] });
      }
      assert: {
        expect(isInputRequiredResult(outcome)).toBe(true);
      }
    },
  );

  it(
    'does nothing when the user declined the question',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'delete-tool-declined',
        arrange: 'a use case that must not be called, and a declined answer to `confirm`',
        act: 'the tool is called again with the paths and the declined answer',
        assert: 'the text says nothing was deleted and the use case was not called',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      let text: string;
      arrange: {
        tool = setUp({ kind: 'deleted', count: 1 }, calls);
      }
      act: {
        text = outcomeText(
          await tool.call(
            { paths: ['a.txt'] },
            { confirm: { action: 'accept', content: { confirm: false } } },
          ),
        );
      }
      assert: {
        expect(text).toBe('Cancelled by the user; nothing was deleted.');
        expect(calls).toEqual([]);
      }
    },
  );

  it(
    'refuses when any path is outside the root, deleting nothing',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'delete-tool-outside-root',
        arrange: 'a use case that must not be called, and the root `/data`',
        act: 'the tool is called with `a.txt` and `../etc/passwd`',
        assert: 'the result is an error and the use case was not called',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      let outcome: Awaited<ReturnType<CapturedTool['call']>>;
      arrange: {
        tool = setUp({ kind: 'deleted', count: 2 }, calls);
      }
      act: {
        outcome = await tool.call({ paths: ['a.txt', '../etc/passwd'] });
      }
      assert: {
        expect(outcome).toMatchObject({ isError: true });
        expect(calls).toEqual([]);
      }
    },
  );
});
