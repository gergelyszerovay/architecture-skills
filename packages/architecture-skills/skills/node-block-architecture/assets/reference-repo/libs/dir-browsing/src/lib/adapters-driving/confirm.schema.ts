import { z } from 'zod';

/** Validates the user's answer to a delete-confirmation elicitation. */
export const ConfirmSchema = z.object({ confirm: z.boolean() });
