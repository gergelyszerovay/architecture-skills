import type { CallToolResult, InputRequiredResult } from '@modelcontextprotocol/server';

/** Either a normal tool result or an input-required elicitation. */
export type ToolOutcome = CallToolResult | InputRequiredResult;
