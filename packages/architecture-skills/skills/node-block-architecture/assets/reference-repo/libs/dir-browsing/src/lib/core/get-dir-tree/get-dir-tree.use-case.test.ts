import { describe, expect, it } from 'vitest';
import type { FileSystemPort } from '../file-system.port.ts';
import { makeFakeFileSystem } from '../../testing/fake-file-system.fake.ts';
import { makeGetDirTree } from './get-dir-tree.use-case.ts';
import type { GetDirTreeResult } from './get-dir-tree.result.ts';

describe('makeGetDirTree', () => {
  it(
    'builds a sorted tree without hidden or ignored entries, respecting depth',
    {
      tags: ['scenario'],
      meta: {
        spec: 'tree-sorted-visible-entries',
        arrange:
          'a tree with `src`, a hidden `.env`, `node_modules` and `z.md`, and `src/deep` below `src`',
        act: 'the tree is requested from `.` with a depth of 2',
        assert:
          'directories come before files, hidden and ignored entries are absent, and `deep` is not expanded',
      },
    },
    async () => {
      let fs: ReturnType<typeof makeFakeFileSystem>['fs'];
      let result: GetDirTreeResult;
      arrange: {
        fs = makeFakeFileSystem({
          src: null,
          'src/a.ts': '',
          'src/deep': null,
          'src/deep/x.ts': '',
          '.env': '',
          node_modules: null,
          'z.md': '',
        }).fs;
      }
      act: {
        result = await makeGetDirTree({ fs })({ path: '.', maxDepth: 2 });
      }
      assert: {
        if (result.kind !== 'ok') throw new Error('expected an ok result');
        expect(result.tree.children.map((c) => c.name)).toEqual(['src', 'z.md']);
        expect(result.tree.children[0]?.children.map((c) => c.name)).toEqual(['deep', 'a.ts']);
        expect(result.tree.children[0]?.children[0]?.children).toEqual([]);
      }
    },
  );

  it(
    'returns not-found for a missing path',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-missing-path',
        arrange: 'an empty file system',
        act: 'the tree is requested for `nope`',
        assert: 'the result is `not-found` for `nope`',
      },
    },
    async () => {
      let fs: ReturnType<typeof makeFakeFileSystem>['fs'];
      let result: GetDirTreeResult;
      arrange: {
        fs = makeFakeFileSystem().fs;
      }
      act: {
        result = await makeGetDirTree({ fs })({ path: 'nope' });
      }
      assert: {
        expect(result).toEqual({ kind: 'not-found', path: 'nope' });
      }
    },
  );

  it(
    'throws an unexpected port failure to the caller instead of turning it into a result',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-unexpected-failure-thrown',
        arrange: 'a file system whose reads fail with a disk error',
        act: 'the tree is requested',
        assert: 'the disk error is thrown',
      },
    },
    async () => {
      let fs: FileSystemPort;
      let outcome: Promise<GetDirTreeResult>;
      arrange: {
        fs = {
          ...makeFakeFileSystem().fs,
          readDir: (): Promise<never> => Promise.reject(new Error('disk failure')),
        };
      }
      act: {
        outcome = makeGetDirTree({ fs })({ path: '.' });
      }
      assert: {
        await expect(outcome).rejects.toThrow('disk failure');
      }
    },
  );

  it(
    'stops with the abort reason when the signal is already aborted',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tree-aborted-signal',
        arrange: 'a file system with one file and a signal that is already aborted',
        act: 'the tree is requested with that signal',
        assert: 'the call rejects with the abort reason',
      },
    },
    async () => {
      let fs: ReturnType<typeof makeFakeFileSystem>['fs'];
      let controller: AbortController;
      let outcome: Promise<GetDirTreeResult>;
      arrange: {
        fs = makeFakeFileSystem({ 'a.txt': '' }).fs;
        controller = new AbortController();
        controller.abort(new Error('cancelled'));
      }
      act: {
        outcome = makeGetDirTree({ fs })({ path: '.' }, { signal: controller.signal });
      }
      assert: {
        await expect(outcome).rejects.toThrow('cancelled');
      }
    },
  );
});
