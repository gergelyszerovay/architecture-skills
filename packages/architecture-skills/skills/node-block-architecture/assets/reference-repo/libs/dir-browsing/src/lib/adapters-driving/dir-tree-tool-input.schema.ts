import { z } from 'zod';

/** Validates the `dir_tree` MCP tool's input. */
export const DirTreeToolInputSchema = z.object({
  path: z.string().default('.').describe('Folder relative to the configured root'),
  maxDepth: z.number().int().positive().max(10).optional().describe('Maximum depth, 1-10'),
});
