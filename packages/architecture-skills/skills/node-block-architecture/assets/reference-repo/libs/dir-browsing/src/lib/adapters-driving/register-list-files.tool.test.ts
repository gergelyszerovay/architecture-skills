import { describe, expect, it } from 'vitest';
import { pino } from 'pino';
import type { ListFilesResult } from '../core/list-files/list-files.result.ts';
import { captureTool } from '../testing/capture-tool.fixture.ts';
import type { CapturedTool } from '../testing/captured-tool.fixture.ts';
import { outcomeText } from '../testing/outcome-text.fixture.ts';
import { registerListFilesTool } from './register-list-files.tool.ts';

const log = pino({ level: 'silent' });
const found: ListFilesResult = {
  kind: 'ok',
  files: [{ path: '/data/docs/a.md', size: 5, modifiedAt: new Date(0) }],
};

/**
 * Registers the tool over `/data` with a stubbed use case.
 * @param result - What the use case answers.
 * @param calls - Receives each input the use case is called with.
 * @returns The captured tool.
 */
const setUp = (result: ListFilesResult, calls: unknown[] = []): CapturedTool =>
  captureTool((server) =>
    registerListFilesTool(
      server,
      {
        listFiles: (input) => {
          calls.push(input);
          return Promise.resolve(result);
        },
      },
      '/data',
      log,
    ),
  );

describe('registerListFilesTool', () => {
  it(
    'lists the files of a folder inside the root with paths relative to the root',
    {
      tags: ['scenario'],
      meta: {
        spec: 'list-tool-lists-files',
        arrange: 'a use case answering `/data/docs/a.md`, and the root `/data`',
        act: 'the tool is called with the path `docs`',
        assert: 'the use case got the absolute path, and the text lists `docs/a.md` with its size',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      let text: string;
      arrange: {
        tool = setUp(found, calls);
      }
      act: {
        text = outcomeText(await tool.call({ path: 'docs' }));
      }
      assert: {
        expect(calls).toEqual([{ path: '/data/docs' }]);
        expect(text).toBe('         5  docs/a.md');
      }
    },
  );

  it(
    'refuses a path outside the root without calling the use case',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'list-tool-outside-root',
        arrange: 'a use case that must not be called, and the root `/data`',
        act: 'the tool is called with the path `../etc`',
        assert: 'the result is an error saying the path is outside the root',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let tool: CapturedTool;
      let outcome: Awaited<ReturnType<CapturedTool['call']>>;
      arrange: {
        tool = setUp(found, calls);
      }
      act: {
        outcome = await tool.call({ path: '../etc' });
      }
      assert: {
        expect(outcome).toMatchObject({ isError: true });
        expect(outcomeText(outcome)).toContain('outside the allowed root');
        expect(calls).toEqual([]);
      }
    },
  );

  it(
    'answers an error naming the path when the folder does not exist',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'list-tool-not-found',
        arrange: 'a use case answering `not-found`',
        act: 'the tool is called with the path `nope`',
        assert: 'the result is an error naming `nope`',
      },
    },
    async () => {
      let tool: CapturedTool;
      let outcome: Awaited<ReturnType<CapturedTool['call']>>;
      arrange: {
        tool = setUp({ kind: 'not-found', path: '/data/nope' });
      }
      act: {
        outcome = await tool.call({ path: 'nope' });
      }
      assert: {
        expect(outcome).toMatchObject({ isError: true });
        expect(outcomeText(outcome)).toContain('No folder at "nope"');
      }
    },
  );
});
