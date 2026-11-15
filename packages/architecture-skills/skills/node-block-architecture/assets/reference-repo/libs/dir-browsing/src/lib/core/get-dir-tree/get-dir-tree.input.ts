/** Input for the get-dir-tree use case. */
export type GetDirTreeInput = {
  path: string;
  maxDepth?: number;
  showHidden?: boolean;
};
