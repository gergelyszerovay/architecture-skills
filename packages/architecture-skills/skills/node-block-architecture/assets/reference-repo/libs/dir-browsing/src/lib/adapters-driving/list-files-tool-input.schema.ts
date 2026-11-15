import { z } from 'zod';

/** Validates the `list_files` MCP tool's input. */
export const ListFilesToolInputSchema = z.object({
  path: z.string().default('.').describe('Folder relative to the configured root'),
});
