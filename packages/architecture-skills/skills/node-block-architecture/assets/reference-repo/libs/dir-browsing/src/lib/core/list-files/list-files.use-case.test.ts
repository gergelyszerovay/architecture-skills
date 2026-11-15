import { describe, expect, it } from 'vitest';
import type { FileSystemPort } from '../file-system.port.ts';
import { makeFakeFileSystem } from '../../testing/fake-file-system.fake.ts';
import { makeListFiles } from './list-files.use-case.ts';
import type { ListFilesResult } from './list-files.result.ts';

const listed = (result: ListFilesResult): [string, number][] => {
  if (result.kind !== 'ok') throw new Error('expected an ok result');
  return result.files.map((f) => [f.path, f.size]);
};

describe('makeListFiles', () => {
  it(
    'lists visible files with sizes, skipping directories',
    {
      tags: ['scenario'],
      meta: {
        spec: 'list-visible-files-with-sizes',
        arrange: 'files `b.txt` and `a.txt`, a directory `docs` and a hidden `.hidden`',
        act: 'the files of `.` are listed',
        assert: '`a.txt` and `b.txt` come back sorted by name, with their sizes',
      },
    },
    async () => {
      let fs: FileSystemPort;
      let result: ListFilesResult;
      arrange: {
        fs = makeFakeFileSystem({ 'b.txt': 'hi', 'a.txt': 'hello', docs: null, '.hidden': 'x' }).fs;
      }
      act: {
        result = await makeListFiles({ fs })({ path: '.' });
      }
      assert: {
        expect(listed(result)).toEqual([
          ['a.txt', 5],
          ['b.txt', 2],
        ]);
      }
    },
  );

  it(
    'includes hidden files on request, but never `node_modules`',
    {
      tags: ['scenario'],
      meta: {
        spec: 'list-hidden-files-on-request',
        arrange: 'a file `a.txt`, a hidden `.hidden` and a `node_modules` entry',
        act: 'the files of `.` are listed with hidden entries shown',
        assert: '`.hidden` and `a.txt` are listed, `node_modules` is not',
      },
    },
    async () => {
      let fs: FileSystemPort;
      let result: ListFilesResult;
      arrange: {
        fs = makeFakeFileSystem({ 'a.txt': 'x', '.hidden': 'yy', node_modules: '' }).fs;
      }
      act: {
        result = await makeListFiles({ fs })({ path: '.', showHidden: true });
      }
      assert: {
        expect(listed(result)).toEqual([
          ['.hidden', 2],
          ['a.txt', 1],
        ]);
      }
    },
  );

  it(
    'returns not-found for a missing path',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'list-missing-path',
        arrange: 'an empty file system',
        act: 'the files of `nope` are listed',
        assert: 'the result is `not-found` for `nope`',
      },
    },
    async () => {
      let fs: FileSystemPort;
      let result: ListFilesResult;
      arrange: {
        fs = makeFakeFileSystem().fs;
      }
      act: {
        result = await makeListFiles({ fs })({ path: 'nope' });
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
        spec: 'list-unexpected-failure-thrown',
        arrange: 'a file system whose reads fail with a disk error',
        act: 'the files of `.` are listed',
        assert: 'the disk error is thrown',
      },
    },
    async () => {
      let fs: FileSystemPort;
      let outcome: Promise<ListFilesResult>;
      arrange: {
        fs = {
          ...makeFakeFileSystem().fs,
          readDir: (): Promise<never> => Promise.reject(new Error('disk failure')),
        };
      }
      act: {
        outcome = makeListFiles({ fs })({ path: '.' });
      }
      assert: {
        await expect(outcome).rejects.toThrow('disk failure');
      }
    },
  );
});
