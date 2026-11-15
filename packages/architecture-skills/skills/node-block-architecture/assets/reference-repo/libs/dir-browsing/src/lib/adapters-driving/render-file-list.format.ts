import type { FileInfo } from '../core/file-info.model.ts';

/**
 * Renders a file list as one right-aligned size and path per line.
 * @param files - The files to render.
 * @returns The rendered file list.
 */
export const renderFileList = (files: FileInfo[]): string =>
  files.map((f) => `${String(f.size).padStart(10)}  ${f.path}`).join('\n');
