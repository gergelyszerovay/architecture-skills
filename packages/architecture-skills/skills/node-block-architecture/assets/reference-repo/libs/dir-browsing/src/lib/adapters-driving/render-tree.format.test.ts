import { describe, expect, it } from 'vitest';
import type { TreeNode } from '../core/tree-node.model.ts';
import { renderTree } from './render-tree.format.ts';

const file = (name: string): TreeNode => ({ name, kind: 'file', children: [] });
const dir = (name: string, ...children: TreeNode[]): TreeNode => ({
  name,
  kind: 'directory',
  children,
});

const examples: { title: string; tree: TreeNode; lines: string[] }[] = [
  { title: 'an empty root', tree: dir('.'), lines: ['.'] },
  {
    title: 'files and nested directories',
    tree: dir('.', dir('src', file('a.ts')), file('z.md')),
    lines: ['.', '├── src/', '│   └── a.ts', '└── z.md'],
  },
  {
    title: 'a last directory has no continuation bar',
    tree: dir('.', file('a.md'), dir('docs', file('b.md'))),
    lines: ['.', '├── a.md', '└── docs/', '    └── b.md'],
  },
];

describe('renderTree', () => {
  it.each(examples)(
    'renders one line per entry with box-drawing prefixes and a trailing slash on directories ($title)',
    { tags: ['invariant'], meta: { spec: 'tree-box-drawing' } },
    ({ tree, lines }) => {
      expect(renderTree(tree)).toBe(lines.join('\n'));
    },
  );
});
