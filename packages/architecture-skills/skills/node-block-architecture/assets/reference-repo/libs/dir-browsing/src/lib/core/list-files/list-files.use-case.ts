import type { FileSystemPort } from '../file-system.port.ts';
import { PathNotFoundError } from '../path-not-found.error.ts';
import { isVisible } from '../is-visible.rules.ts';
import { joinPath } from '../join-path.rules.ts';
import type { ListFilesInput } from './list-files.input.ts';
import type { ListFilesResult } from './list-files.result.ts';

/** The list-files use case contract. */
export type ListFiles = (input: ListFilesInput) => Promise<ListFilesResult>;

/**
 * Builds the list-files use case.
 * @param deps - The filesystem to list from.
 *   - `fs`: The filesystem port used to read entries and stat them.
 * @returns The list-files use case.
 * @failure A missing path becomes the `not-found` result; any other port failure is thrown to the driving adapter.
 */
export const makeListFiles =
  ({ fs }: { fs: FileSystemPort }): ListFiles =>
  async (input) => {
    try {
      const entries = (await fs.readDir(input.path))
        .filter((e) => e.kind === 'file' && isVisible(e, input.showHidden ?? false))
        .sort((a, b) => a.name.localeCompare(b.name));
      const files = [];
      for (const entry of entries) {
        const path = joinPath(input.path, entry.name);
        files.push({ path, ...(await fs.stat(path)) });
      }
      return { kind: 'ok', files };
    } catch (error) {
      if (error instanceof PathNotFoundError) return { kind: 'not-found', path: error.path };
      throw error;
    }
  };
