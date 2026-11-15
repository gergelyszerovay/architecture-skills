import type { FileSystemPort } from '../file-system.port.ts';
import type { TreeNode } from '../tree-node.model.ts';
import { PathNotFoundError } from '../path-not-found.error.ts';
import { isVisible } from '../is-visible.rules.ts';
import { joinPath } from '../join-path.rules.ts';
import type { GetDirTreeInput } from './get-dir-tree.input.ts';
import type { GetDirTreeResult } from './get-dir-tree.result.ts';

/** The get-dir-tree use case contract. */
export type GetDirTree = (
  input: GetDirTreeInput,
  ctx?: { signal?: AbortSignal },
) => Promise<GetDirTreeResult>;

/**
 * Builds the get-dir-tree use case.
 * @param deps - The filesystem to walk.
 *   - `fs`: The filesystem port used to read directory entries.
 * @returns The get-dir-tree use case.
 * @failure A missing path becomes the `not-found` result; an aborted signal or any other port failure is thrown to the driving adapter.
 */
export const makeGetDirTree = ({ fs }: { fs: FileSystemPort }): GetDirTree => {
  const walk = async (
    path: string,
    name: string,
    depth: number,
    input: GetDirTreeInput,
    signal?: AbortSignal,
  ): Promise<TreeNode> => {
    signal?.throwIfAborted();
    const node: TreeNode = { name, kind: 'directory', children: [] };
    if (input.maxDepth !== undefined && depth >= input.maxDepth) return node;
    const entries = (await fs.readDir(path))
      .filter((e) => isVisible(e, input.showHidden ?? false))
      .sort((a, b) =>
        a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1,
      );
    for (const entry of entries) {
      node.children.push(
        entry.kind === 'directory'
          ? await walk(joinPath(path, entry.name), entry.name, depth + 1, input, signal)
          : { name: entry.name, kind: 'file', children: [] },
      );
    }
    return node;
  };

  return async (
    input: GetDirTreeInput,
    ctx: { signal?: AbortSignal } = {},
  ): Promise<GetDirTreeResult> => {
    try {
      return { kind: 'ok', tree: await walk(input.path, input.path, 0, input, ctx.signal) };
    } catch (error) {
      if (error instanceof PathNotFoundError) return { kind: 'not-found', path: error.path };
      throw error;
    }
  };
};
