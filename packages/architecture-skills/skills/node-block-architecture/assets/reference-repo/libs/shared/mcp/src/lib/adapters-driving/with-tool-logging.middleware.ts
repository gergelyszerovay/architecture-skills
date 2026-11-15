import {
  isInputRequiredResult,
  type CallToolResult,
  type InputRequiredResult,
  type ServerContext,
} from '@modelcontextprotocol/server';
import type { Logger } from 'pino';

/** Either a normal tool result or an input-required elicitation. */
type ToolResult = CallToolResult | InputRequiredResult;
/** A tool handler that returns a normal MCP result or an input-required result. */
type ToolHandler<Args> = (args: Args, ctx: ServerContext) => Promise<ToolResult>;

/**
 * Wraps one MCP tool handler: logs the call's outcome once, bound to the JSON-RPC request ID.
 * Results with `isError` are expected outcomes (info); a throw is unexpected (error, with the cause).
 * @param log - The logger to write the call's outcome to.
 * @param tool - The tool's name, included in every log entry.
 * @param handler - The tool handler to wrap.
 * @returns A handler with the same signature, logging once per call.
 */
export const withToolLogging =
  <Args>(log: Logger, tool: string, handler: ToolHandler<Args>): ToolHandler<Args> =>
  async (args: Args, ctx: ServerContext): Promise<ToolResult> => {
    const callLog = log.child({ tool, callId: ctx.mcpReq.id, sessionId: ctx.sessionId });
    const started = performance.now();
    try {
      const result = await handler(args, ctx);
      const ms = Math.round(performance.now() - started);
      const outcome = isInputRequiredResult(result)
        ? 'input-required'
        : result.isError
          ? 'error'
          : 'ok';
      callLog.info({ outcome, ms }, 'tool call');
      return result;
    } catch (err) {
      callLog.error({ err, ms: Math.round(performance.now() - started) }, 'tool call failed');
      throw err;
    }
  };
