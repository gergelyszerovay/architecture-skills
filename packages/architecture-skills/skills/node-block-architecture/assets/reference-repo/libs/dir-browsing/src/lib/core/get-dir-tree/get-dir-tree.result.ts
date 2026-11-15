import type { TreeNode } from '../tree-node.model.ts';

/** The outcome of a get-dir-tree call: the tree, or that the path was not found. */
export type GetDirTreeResult = { kind: 'ok'; tree: TreeNode } | { kind: 'not-found'; path: string };
