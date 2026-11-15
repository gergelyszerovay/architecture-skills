import type { ToolOutcome } from './tool-outcome.fixture.ts';

/** A registered MCP tool's handler, ready to call as the transport would. */
export type CapturedTool = {
  name: string;
  /** Calls the handler with the arguments; `inputResponses` are the answers to an earlier elicitation. */
  call: (
    args: Record<string, unknown>,
    inputResponses?: Record<string, unknown>,
  ) => Promise<ToolOutcome>;
};
