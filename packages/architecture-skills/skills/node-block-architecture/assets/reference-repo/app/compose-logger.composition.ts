import { pino, destination, type Logger } from 'pino';
import type { LoggingConfig } from './load-logging.config.ts';

/**
 * The only place that configures pino: level, redaction, destination. Stdio binaries pass
 * `stderr` because stdout carries their protocol or output. Synchronous writes keep entries
 * ordered with other stderr output and flushed before a short-lived process exits.
 */
/**
 * @param config - The logging configuration to apply.
 * @param stream - Which stream to write to; stdio binaries pass `stderr`.
 * @param name - The logger's name, included in every entry.
 * @returns A configured pino logger.
 */
export const composeLogger = (
  config: LoggingConfig,
  stream: 'stdout' | 'stderr',
  name: string,
): Logger =>
  pino(
    {
      name,
      level: config.level,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
        censor: '[redacted]',
      },
    },
    destination({ dest: stream === 'stderr' ? 2 : 1, sync: true }),
  );
