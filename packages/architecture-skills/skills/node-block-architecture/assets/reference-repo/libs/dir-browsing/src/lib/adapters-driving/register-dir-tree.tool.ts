import type { McpServer } from '@modelcontextprotocol/server';
import type { RegisteredTool } from '@modelcontextprotocol/server';
import type { Logger } from 'pino';
import { withToolLogging } from '#libs/shared/mcp';
import type { GetDirTree } from '../core/get-dir-tree/get-dir-tree.use-case.ts';
import { DirTreeToolInputSchema } from './dir-tree-tool-input.schema.ts';
import { resolveWithinRoot } from './resolve-within-root.util.ts';
import { text } from './text.util.ts';
import { renderTree } from './render-tree.format.ts';

/**
 * Registers the `dir_tree` MCP tool.
 * @param server - The MCP server to register the tool on.
 * @param app - The dir-browsing use cases, including `getDirTree`.
 * @param root - The directory root paths are confined to.
 * @param log - The logger passed to the tool-logging middleware.
 * @returns The value returned by `server.registerTool`.
 */
export const registerDirTreeTool = (
  server: McpServer,
  app: { getDirTree: GetDirTree },
  root: string,
  log: Logger,
): RegisteredTool =>
  server.registerTool(
    'dir_tree',
    {
      description:
        'Show the directory tree of a folder inside the configured root. Hidden entries, node_modules, and .git are omitted.',
      inputSchema: DirTreeToolInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    withToolLogging(log, 'dir_tree', async ({ path, maxDepth }, ctx) => {
      const target = resolveWithinRoot(root, path);
      if (!target)
        return {
          isError: true,
          content: text('Path is outside the allowed root. Use a relative path inside it.'),
        };
      const result = await app.getDirTree(
        { path: target, maxDepth },
        { signal: ctx.mcpReq.signal },
      );
      if (result.kind === 'not-found')
        return {
          isError: true,
          content: text(`No folder at "${path}". List the parent folder to find the right name.`),
        };
      return { content: text(renderTree({ ...result.tree, name: path })) };
    }),
  );
