/**
 * Business-relevant record of files this feature removed. Not a general logger.
 * @failure Recording is fire-and-forget: it never fails the deletion that triggered it.
 */
export interface FileDeletionAudit {
  recordDeleted(paths: string[]): void;
}
