import { describe, expect, it } from 'vitest';
import { pino } from 'pino';
import type { GetDirTreeResult } from '../core/get-dir-tree/get-dir-tree.result.ts';
import { captureTool } from '../testing/capture-tool.fixture.ts';
import type { CapturedTool } from '../testing/captured-tool.fixture.ts';
import { outcomeText } from '../testing/outcome-text.fixture.ts';
import { registerDirTreeTool } from './register-dir-tree.tool.ts';

const log = pino({ level: 'silent' });
const found: GetDirTreeResult = {
  kind: 'ok',
  tree: {
    name: '/data/docs',
    kind: 'directory',
    children: [{ name: 'a.md', kind: 'file', children: [] }],
  },
};

/**
 * Registers the tool over `/data` with a stubbed use case.
 * @param result - What the use case answers.
 * @param calls - Receives each input the use case is called with.
 * @returns The captured tool.
 */
const setUp = (result: GetDirTreeResult, calls: unknown[] = []): CapturedTool =>
  captureTool((server) =>
    registerDirTreeTool(
      server,
      {
        getDirTree: (input) => {
          calls.push(input);
          return Promise.resolve(result);
        },
      },
      '/data',
      log,
    ),
  );

describe('registerDirTreeTool', () => {
  it(
    'renders the tree of a folder inside the root, named as the caller wrote it',
    {
      tags: ['scenario'],
      meta: {
        spec: 'tree-tool-renders-tree',
        arrange: 'a use case answering a tree with `a.md`, and the root `/data`',
        act: 'the tool is called with the path `docs` and a depth of 3',
        assert:
          'the use case got the absolute path and depth, and the text is the tree headed `docs`',
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
        text = outcomeText(await tool.call({ path: 'docs', maxDepth: 3 }));
      }
      assert: {
        expect(calls).toEqual([{ path: '/data/docs', maxDepth: 3 }]);
        expect(text).toBe('docs\n└── a.md');
      }
    },
  );

  it(
    'refuses a path outside the root without calling the use case',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-tool-outside-root',
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
        spec: 'tree-tool-not-found',
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
