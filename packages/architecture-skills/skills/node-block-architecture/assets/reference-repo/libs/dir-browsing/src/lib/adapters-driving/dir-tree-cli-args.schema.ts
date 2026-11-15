import { z } from 'zod';

/** citty returns strings and booleans; coerce and validate here. */
export const DirTreeCliArgsSchema = z.object({
  path: z.string().default('.'),
  depth: z.coerce.number().int().positive().optional(),
  all: z.boolean().default(false),
  json: z.boolean().default(false),
});
