import type { Logger } from 'pino';
import type { FileDeletionAudit } from '../core/file-deletion-audit.port.ts';

/**
 * Writes audit records as structured log entries; a database-backed audit would implement the same port.
 * @param deps - The logger to write audit entries to.
 *   - `log`: The logger used for each `recordDeleted` call.
 * @returns A `FileDeletionAudit` that logs each deletion.
 * @failure None surfaces: logger write errors are the logger's, and recording never throws to the caller.
 */
export const makeLogFileDeletionAudit = ({ log }: { log: Logger }): FileDeletionAudit => ({
  recordDeleted(paths): void {
    log.info({ audit: 'files-deleted', count: paths.length, paths }, 'files deleted');
  },
});
