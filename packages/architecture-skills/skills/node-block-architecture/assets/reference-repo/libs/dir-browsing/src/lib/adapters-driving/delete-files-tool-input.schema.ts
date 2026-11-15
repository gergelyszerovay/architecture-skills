import { z } from 'zod';

/** Validates the `delete_files` MCP tool's input. */
export const DeleteFilesToolInputSchema = z.object({
  paths: z.array(z.string()).min(1).describe('Files relative to the configured root'),
});
