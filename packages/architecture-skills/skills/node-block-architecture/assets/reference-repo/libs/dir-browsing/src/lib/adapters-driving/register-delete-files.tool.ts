import { type McpServer, inputRequired, acceptedContent } from '@modelcontextprotocol/server';
import type { RegisteredTool } from '@modelcontextprotocol/server';
import type { Logger } from 'pino';
import { withToolLogging } from '#libs/shared/mcp';
import type { DeleteFiles } from '../core/delete-files/delete-files.use-case.ts';
import { ConfirmSchema } from './confirm.schema.ts';
import { DeleteFilesToolInputSchema } from './delete-files-tool-input.schema.ts';
import { resolveWithinRoot } from './resolve-within-root.util.ts';
import { text } from './text.util.ts';

/**
 * Confirmation uses MCP multi-round-trip input (protocol 2026-07-28): the use case says it
 * needs confirmation, the tool returns an input-required elicitation, and the client retries
 * the same call with the user's answer.
 * @param server - The MCP server to register the tool on.
 * @param app - The dir-browsing use cases, including `deleteFiles`.
 * @param root - The directory root paths are confined to.
 * @param log - The logger passed to the tool-logging middleware.
 * @returns The value returned by `server.registerTool`.
 */
export const registerDeleteFilesTool = (
  server: McpServer,
  app: { deleteFiles: DeleteFiles },
  root: string,
  log: Logger,
): RegisteredTool =>
  server.registerTool(
    'delete_files',
    {
      description:
        'Delete files inside the configured root. Large deletions ask the user to confirm.',
      inputSchema: DeleteFilesToolInputSchema,
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    withToolLogging(log, 'delete_files', async ({ paths }, ctx) => {
      const targets = paths.map((p) => resolveWithinRoot(root, p));
      if (targets.some((t) => t === undefined))
        return { isError: true, content: text('All paths must be inside the allowed root.') };
      const answer = acceptedContent(ctx.mcpReq.inputResponses, 'confirm', ConfirmSchema);
      if (answer && !answer.confirm)
        return { content: text('Cancelled by the user; nothing was deleted.') };
      const result = await app.deleteFiles(
        { paths: targets as string[], confirmed: answer?.confirm === true },
        { signal: ctx.mcpReq.signal },
      );
      if (result.kind === 'needs-confirmation') {
        return inputRequired({
          inputRequests: {
            confirm: inputRequired.elicit({
              message: result.question,
              requestedSchema: ConfirmSchema,
            }),
          },
        });
      }
      return { content: text(`Deleted ${String(result.count)} file(s).`) };
    }),
  );
