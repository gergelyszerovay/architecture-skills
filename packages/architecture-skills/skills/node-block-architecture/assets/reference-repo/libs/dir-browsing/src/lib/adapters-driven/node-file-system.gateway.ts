import { readdir, stat, rm } from 'node:fs/promises';
import type { FileSystemPort } from '../core/file-system.port.ts';
import type { DirEntry } from '../core/dir-entry.model.ts';
import { translateNotFound } from './translate-not-found.mapper.ts';

/**
 * The `FileSystemPort` implementation backed by Node's `node:fs/promises`.
 * @failure `ENOENT` and `ENOTDIR` become `PathNotFoundError`; every other error is thrown unchanged.
 */
export const nodeFileSystem: FileSystemPort = {
  async readDir(path): Promise<DirEntry[]> {
    const entries = await readdir(path, { withFileTypes: true }).catch(translateNotFound(path));
    return entries.map((e) => ({ name: e.name, kind: e.isDirectory() ? 'directory' : 'file' }));
  },
  async stat(path): Promise<{ size: number; modifiedAt: Date }> {
    const s = await stat(path).catch(translateNotFound(path));
    return { size: s.size, modifiedAt: s.mtime };
  },
  async remove(path): Promise<void> {
    await rm(path).catch(translateNotFound(path));
  },
};
