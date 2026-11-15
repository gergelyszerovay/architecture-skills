import { afterEach, describe, expect, it } from 'vitest';
import type { FileSystemPort } from '../core/file-system.port.ts';
import { PathNotFoundError } from '../core/path-not-found.error.ts';

/** Builds a fresh `FileSystemPort` seeded from a tree, and returns how to clean it up. */
export type FileSystemContractSetup = (tree: Record<string, string | null>) => Promise<{
  fs: FileSystemPort;
  root: string;
  cleanup: () => Promise<void>;
}>;

/** The tree every spec of the suite starts from: `null` marks a directory. */
const tree = { docs: null, 'docs/a.md': 'hello', 'b.txt': '' };

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test from a seed tree.
 */
export const fileSystemContract = (name: string, setup: FileSystemContractSetup): void => {
  describe(`FileSystemPort contract: ${name}`, () => {
    const cleanups: (() => Promise<void>)[] = [];
    /**
     * Builds the port under test over the suite's tree and remembers how to release it.
     * @returns The port and a helper joining a relative path onto its root.
     */
    const setUp = async (): Promise<{
      fs: FileSystemPort;
      root: string;
      at: (p: string) => string;
    }> => {
      const { fs, root, cleanup } = await setup(tree);
      cleanups.push(cleanup);
      return { fs, root, at: (p) => (root === '.' ? p : `${root}/${p}`) };
    };
    afterEach(async () => {
      for (const cleanup of cleanups.splice(0)) await cleanup();
    });

    it(
      'lists direct children with their kinds',
      {
        tags: ['scenario'],
        meta: {
          spec: 'file-system-lists-children',
          arrange: 'a root holding the directory `docs` and the file `b.txt`',
          act: 'the root is read',
          assert: 'both entries come back with their kinds, and nothing deeper',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let entries: Awaited<ReturnType<FileSystemPort['readDir']>>;
        arrange: {
          context = await setUp();
        }
        act: {
          entries = await context.fs.readDir(context.root);
        }
        assert: {
          expect(entries.sort((x, y) => x.name.localeCompare(y.name))).toEqual([
            { name: 'b.txt', kind: 'file' },
            { name: 'docs', kind: 'directory' },
          ]);
        }
      },
    );

    it(
      'reports a file size in bytes',
      {
        tags: ['scenario'],
        meta: {
          spec: 'file-system-reports-file-size',
          arrange: 'a five-byte file `docs/a.md`',
          act: 'the file is statted',
          assert: 'the size is 5',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let stat: Awaited<ReturnType<FileSystemPort['stat']>>;
        arrange: {
          context = await setUp();
        }
        act: {
          stat = await context.fs.stat(context.at('docs/a.md'));
        }
        assert: {
          expect(stat.size).toBe(5);
        }
      },
    );

    it(
      'removes a file',
      {
        tags: ['scenario'],
        meta: {
          spec: 'file-system-removes-file',
          arrange: 'a root holding the file `b.txt`',
          act: '`b.txt` is removed',
          assert: 'the root no longer lists it',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let names: string[];
        arrange: {
          context = await setUp();
        }
        act: {
          await context.fs.remove(context.at('b.txt'));
          names = (await context.fs.readDir(context.root)).map((e) => e.name);
        }
        assert: {
          expect(names).toEqual(['docs']);
        }
      },
    );

    it(
      'fails with PathNotFoundError when reading a missing directory',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'file-system-read-missing-directory',
          arrange: 'a root without a `missing` entry',
          act: '`missing` is read',
          assert: 'the read fails with PathNotFoundError',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let outcome: Promise<unknown>;
        arrange: {
          context = await setUp();
        }
        act: {
          outcome = context.fs.readDir(context.at('missing'));
        }
        assert: {
          await expect(outcome).rejects.toBeInstanceOf(PathNotFoundError);
        }
      },
    );

    it(
      'fails with PathNotFoundError when statting a missing file',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'file-system-stat-missing-file',
          arrange: 'a root without a `missing.txt` entry',
          act: '`missing.txt` is statted',
          assert: 'the stat fails with PathNotFoundError',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let outcome: Promise<unknown>;
        arrange: {
          context = await setUp();
        }
        act: {
          outcome = context.fs.stat(context.at('missing.txt'));
        }
        assert: {
          await expect(outcome).rejects.toBeInstanceOf(PathNotFoundError);
        }
      },
    );

    it(
      'fails with PathNotFoundError when removing a file that is already gone',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'file-system-remove-missing-file',
          arrange: '`b.txt` was removed',
          act: '`b.txt` is removed again',
          assert: 'the second removal fails with PathNotFoundError',
        },
      },
      async () => {
        let context: Awaited<ReturnType<typeof setUp>>;
        let outcome: Promise<unknown>;
        arrange: {
          context = await setUp();
          await context.fs.remove(context.at('b.txt'));
        }
        act: {
          outcome = context.fs.remove(context.at('b.txt'));
        }
        assert: {
          await expect(outcome).rejects.toBeInstanceOf(PathNotFoundError);
        }
      },
    );
  });
};
