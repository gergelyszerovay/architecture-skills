import type { McpServer, ServerContext } from '@modelcontextprotocol/server';
import type { CapturedTool } from './captured-tool.fixture.ts';
import type { ToolOutcome } from './tool-outcome.fixture.ts';

/** The shape of the handler a tool is registered with. */
type RegisteredHandler = (
  args: Record<string, unknown>,
  ctx: ServerContext,
) => Promise<ToolOutcome>;

/**
 * Registers a tool on a stand-in server and captures its handler, so tests call it without a
 * transport.
 * @param register - Registers the tool on the server it is given.
 * @returns The tool's name and a function calling its handler.
 */
export const captureTool = (register: (server: McpServer) => unknown): CapturedTool => {
  let captured: { name: string; handler: RegisteredHandler } | undefined;
  const server = {
    registerTool: (name: string, _config: unknown, handler: RegisteredHandler): object => {
      captured = { name, handler };
      return {};
    },
  } as unknown as McpServer;
  register(server);
  if (!captured) throw new Error('the register function did not register a tool');
  const { name, handler } = captured;
  return {
    name,
    call: (args, inputResponses) =>
      handler(args, {
        mcpReq: { id: 1, signal: new AbortController().signal, inputResponses },
        sessionId: 'test-session',
      } as unknown as ServerContext),
  };
};
