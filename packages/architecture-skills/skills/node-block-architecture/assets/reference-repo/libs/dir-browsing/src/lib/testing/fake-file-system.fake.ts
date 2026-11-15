import type { FileSystemPort } from '../core/file-system.port.ts';
import type { DirEntry } from '../core/dir-entry.model.ts';
import { PathNotFoundError } from '../core/path-not-found.error.ts';

/**
 * In-memory FileSystemPort. Keys are paths; `null` marks a directory, a string is file content.
 * @param initial - The initial tree of paths to seed the fake with.
 * @returns The fake `FileSystemPort` and the backing node map, for assertions.
 */
export const makeFakeFileSystem = (
  initial: Record<string, string | null> = {},
): { fs: FileSystemPort; nodes: Map<string, string | null> } => {
  const nodes = new Map<string, string | null>(Object.entries(initial));
  const parentOf = (path: string): string =>
    path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.';
  const fs: FileSystemPort = {
    async readDir(path): Promise<DirEntry[]> {
      if (path !== '.' && nodes.get(path) !== null) throw new PathNotFoundError(path);
      const entries: DirEntry[] = [];
      for (const [key, value] of nodes) {
        if (parentOf(key) === path)
          entries.push({
            name: key.slice(key.lastIndexOf('/') + 1),
            kind: value === null ? 'directory' : 'file',
          });
      }
      return entries;
    },
    async stat(path): Promise<{ size: number; modifiedAt: Date }> {
      const value = nodes.get(path);
      if (value === undefined) throw new PathNotFoundError(path);
      return { size: value?.length ?? 0, modifiedAt: new Date(0) };
    },
    async remove(path): Promise<void> {
      if (!nodes.has(path)) throw new PathNotFoundError(path);
      nodes.delete(path);
    },
  };
  return { fs, nodes };
};
