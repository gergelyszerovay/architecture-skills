import { McpServer } from '@modelcontextprotocol/server';

/** Registers one tool on an MCP server; the composition binds it to its use cases. */
export type McpToolRegistration = (server: McpServer) => void;

/**
 * Builds the fs-tools MCP server and registers its tools.
 * @param tools - The tool registrations, bound to the composed use cases by the composition.
 * @returns The configured MCP server, ready to connect to a transport.
 * @cleanup Opens nothing itself: the entry point connects the transport, and the process ending releases it.
 */
export const createFsToolsMcpServer = (tools: readonly McpToolRegistration[]): McpServer => {
  const server = new McpServer({ name: 'fs-tools', version: '0.1.0' });
  for (const register of tools) register(server);
  return server;
};
