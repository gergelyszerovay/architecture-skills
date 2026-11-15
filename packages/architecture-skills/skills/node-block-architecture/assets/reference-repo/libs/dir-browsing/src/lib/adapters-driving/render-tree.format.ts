import type { TreeNode } from '../core/tree-node.model.ts';

/**
 * Renders a directory tree as box-drawing text, one line per entry.
 * @param tree - The tree to render.
 * @returns The rendered tree, with the root name on the first line.
 */
export const renderTree = (tree: TreeNode): string => {
  const lines = [tree.name];
  const walk = (node: TreeNode, prefix: string): void => {
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1;
      lines.push(
        `${prefix}${last ? '└── ' : '├── '}${child.name}${child.kind === 'directory' ? '/' : ''}`,
      );
      walk(child, prefix + (last ? '    ' : '│   '));
    });
  };
  walk(tree, '');
  return lines.join('\n');
};
