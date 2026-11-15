import type { DirEntry } from './dir-entry.model.ts';

/**
 * What dir-browsing needs from a file system. Paths are joined with "/".
 * @failure A missing path fails with `PathNotFoundError`; any other failure is thrown unchanged and is unexpected.
 */
export interface FileSystemPort {
  readDir(path: string): Promise<DirEntry[]>;
  stat(path: string): Promise<{ size: number; modifiedAt: Date }>;
  remove(path: string): Promise<void>;
}
