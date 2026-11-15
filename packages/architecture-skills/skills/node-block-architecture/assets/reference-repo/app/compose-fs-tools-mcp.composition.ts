import type { McpServer } from '@modelcontextprotocol/server';
import type { Logger } from 'pino';
import {
  registerDeleteFilesTool,
  registerDirTreeTool,
  registerListFilesTool,
} from '#libs/dir-browsing';
import { composeFsTools } from './compose-fs-tools.composition.ts';
import { createFsToolsMcpServer } from './create-fs-tools-mcp.server.ts';

/**
 * Wires the fs-tools MCP server: the dir-browsing use cases, its three tools bound to them, and
 * the server they are registered on.
 * @param deps - The logger and the directory root the tools are confined to.
 *   - `log`: The logger passed to the use cases and to each tool.
 *   - `root`: The directory root tools are confined to.
 * @returns The configured MCP server, ready to connect to a transport.
 */
export const composeFsToolsMcpServer = (deps: { log: Logger; root: string }): McpServer => {
  const app = composeFsTools({ log: deps.log });
  return createFsToolsMcpServer([
    (server): void => registerDirTreeTool(server, app, deps.root, deps.log),
    (server): void => registerListFilesTool(server, app, deps.root, deps.log),
    (server): void => registerDeleteFilesTool(server, app, deps.root, deps.log),
  ]);
};
