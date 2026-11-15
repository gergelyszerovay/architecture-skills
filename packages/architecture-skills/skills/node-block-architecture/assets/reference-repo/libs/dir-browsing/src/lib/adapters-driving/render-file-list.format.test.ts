import { describe, expect, it } from 'vitest';
import type { FileInfo } from '../core/file-info.model.ts';
import { renderFileList } from './render-file-list.format.ts';

const at = new Date(0);
const file = (path: string, size: number): FileInfo => ({ path, size, modifiedAt: at });

const examples: { title: string; files: FileInfo[]; text: string }[] = [
  { title: 'no files', files: [], text: '' },
  { title: 'one file', files: [file('a.txt', 5)], text: '         5  a.txt' },
  {
    title: 'sizes align to the right',
    files: [file('a.txt', 5), file('big.bin', 1234567)],
    text: ['         5  a.txt', '   1234567  big.bin'].join('\n'),
  },
];

describe('renderFileList', () => {
  it.each(examples)(
    'renders one line per file with its size right-aligned in ten columns ($title)',
    { tags: ['invariant'], meta: { spec: 'file-list-right-aligned-sizes' } },
    ({ files, text }) => {
      expect(renderFileList(files)).toBe(text);
    },
  );
});
