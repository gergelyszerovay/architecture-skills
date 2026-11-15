/** A node in a rendered directory tree. */
export type TreeNode = {
  name: string;
  kind: 'file' | 'directory';
  children: TreeNode[];
};
