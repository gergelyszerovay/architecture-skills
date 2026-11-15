import { resolve, relative, isAbsolute } from 'node:path';

/**
 * MCP-only sandbox: the model may browse only inside `root`.
 * @param root - The directory root paths are confined to.
 * @param path - The path to resolve, relative to `root`.
 * @returns The resolved absolute path, or `undefined` when it escapes `root`.
 */
export const resolveWithinRoot = (root: string, path: string): string | undefined => {
  const target = resolve(root, path);
  const rel = relative(resolve(root), target);
  return rel.startsWith('..') || isAbsolute(rel) ? undefined : target;
};
