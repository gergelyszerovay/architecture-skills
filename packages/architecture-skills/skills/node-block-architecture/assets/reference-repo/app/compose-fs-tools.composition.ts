import type { Logger } from 'pino';
import {
  makeGetDirTree,
  makeListFiles,
  makeDeleteFiles,
  makeLogFileDeletionAudit,
  nodeFileSystem,
  type DeleteFiles,
  type FileSystemPort,
  type GetDirTree,
  type ListFiles,
} from '#libs/dir-browsing';

/** The dir-browsing use cases wired for the CLI and MCP adapters. */
export type FsToolsApp = {
  getDirTree: GetDirTree;
  listFiles: ListFiles;
  deleteFiles: DeleteFiles;
};

/**
 * Wires the dir-browsing use cases to the Node filesystem gateway and a logging audit trail.
 * @param deps - The logger to audit deletions with, and an optional filesystem override for tests.
 *   - `log`: The logger passed to the deletion audit gateway.
 *   - `fs`: The filesystem port to use; defaults to the Node filesystem gateway.
 * @returns The dir-browsing use cases, ready for a CLI or MCP adapter.
 */
export const composeFsTools = (deps: { log: Logger; fs?: FileSystemPort }): FsToolsApp => {
  const fs = deps.fs ?? nodeFileSystem;
  return {
    getDirTree: makeGetDirTree({ fs }),
    listFiles: makeListFiles({ fs }),
    deleteFiles: makeDeleteFiles({ fs, audit: makeLogFileDeletionAudit({ log: deps.log }) }),
  };
};
