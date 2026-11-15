import { z } from 'zod';

/** Validates and coerces the `ls` command's raw CLI arguments. */
export const ListFilesCliArgsSchema = z.object({
  path: z.string().default('.'),
  all: z.boolean().default(false),
  json: z.boolean().default(false),
});
