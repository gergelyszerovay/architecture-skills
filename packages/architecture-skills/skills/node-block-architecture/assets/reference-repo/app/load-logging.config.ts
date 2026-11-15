import { z } from 'zod';

/** The accepted pino log levels, validated from the environment. */
const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

/** The resolved logging configuration. */
export type LoggingConfig = { level: z.infer<typeof LogLevelSchema> };

/**
 * Reads LOG_LEVEL once; defaults to info.
 * @param env - The process environment to read from; defaults to `process.env`.
 * @returns The resolved logging configuration.
 */
export const loadLoggingConfig = (env: NodeJS.ProcessEnv = process.env): LoggingConfig => ({
  level: LogLevelSchema.parse(env.LOG_LEVEL ?? 'info'),
});
