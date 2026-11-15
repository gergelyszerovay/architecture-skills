import type { McpServer } from '@modelcontextprotocol/server';
import type { RegisteredTool } from '@modelcontextprotocol/server';
import type { Logger } from 'pino';
import { withToolLogging } from '#libs/shared/mcp';
import { relative } from 'node:path';
import type { ListFiles } from '../core/list-files/list-files.use-case.ts';
import { ListFilesToolInputSchema } from './list-files-tool-input.schema.ts';
import { resolveWithinRoot } from './resolve-within-root.util.ts';
import { text } from './text.util.ts';
import { renderFileList } from './render-file-list.format.ts';

/**
 * Registers the `list_files` MCP tool.
 * @param server - The MCP server to register the tool on.
 * @param app - The dir-browsing use cases, including `listFiles`.
 * @param root - The directory root paths are confined to.
 * @param log - The logger passed to the tool-logging middleware.
 * @returns The value returned by `server.registerTool`.
 */
export const registerListFilesTool = (
  server: McpServer,
  app: { listFiles: ListFiles },
  root: string,
  log: Logger,
): RegisteredTool =>
  server.registerTool(
    'list_files',
    {
      description:
        'List the files (not folders) directly inside a folder of the configured root, with sizes in bytes.',
      inputSchema: ListFilesToolInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    withToolLogging(log, 'list_files', async ({ path }) => {
      const target = resolveWithinRoot(root, path);
      if (!target)
        return {
          isError: true,
          content: text('Path is outside the allowed root. Use a relative path inside it.'),
        };
      const result = await app.listFiles({ path: target });
      if (result.kind === 'not-found')
        return { isError: true, content: text(`No folder at "${path}".`) };
      return {
        content: text(
          renderFileList(result.files.map((f) => ({ ...f, path: relative(root, f.path) }))),
        ),
      };
    }),
  );
