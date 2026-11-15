/**
 * Wraps a plain string as MCP text content.
 * @param t - The text to wrap.
 * @returns A one-element MCP text content array.
 */
export const text = (t: string): { type: 'text'; text: string }[] => [{ type: 'text', text: t }];
