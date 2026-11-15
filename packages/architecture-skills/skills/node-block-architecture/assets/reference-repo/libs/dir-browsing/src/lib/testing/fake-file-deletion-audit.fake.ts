import type { FileDeletionAudit } from '../core/file-deletion-audit.port.ts';

/**
 * Collects each `recordDeleted` call.
 * @returns The fake `FileDeletionAudit` and the paths recorded so far.
 */
export const makeFakeFileDeletionAudit = (): { audit: FileDeletionAudit; recorded: string[][] } => {
  const recorded: string[][] = [];
  const audit: FileDeletionAudit = {
    recordDeleted(paths) {
      recorded.push([...paths]);
    },
  };
  return { audit, recorded };
};
