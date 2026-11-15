import type { FileInfo } from '../file-info.model.ts';

/** The outcome of a list-files call: the files, or that the path was not found. */
export type ListFilesResult =
  { kind: 'ok'; files: FileInfo[] } | { kind: 'not-found'; path: string };
