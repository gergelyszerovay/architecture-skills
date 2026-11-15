import type { FileSystemPort } from '../file-system.port.ts';
import type { FileDeletionAudit } from '../file-deletion-audit.port.ts';
import type { DeleteFilesInput } from './delete-files.input.ts';
import type { DeleteFilesResult } from './delete-files.result.ts';

/** Deletions of more than this many paths in one call require confirmation. */
const CONFIRM_ABOVE = 10;

/** The delete-files use case contract. */
export type DeleteFiles = (
  input: DeleteFilesInput,
  ctx?: { signal?: AbortSignal },
) => Promise<DeleteFilesResult>;

/**
 * Confirmation is part of the contract: the use case returns `needs-confirmation`,
 * and the caller asks the user by its own means and calls again with `confirmed: true`.
 * Every removed file is audited, including those removed before a failure or cancellation.
 * @param deps - The filesystem to delete through and the audit trail to record to.
 *   - `fs`: The filesystem port used to remove each path.
 *   - `audit`: Records the paths actually deleted.
 * @returns The delete-files use case.
 * @failure Above the threshold without confirmation it returns `needs-confirmation`; a port failure or an aborted signal is thrown to the driving adapter after the files already removed are audited.
 */
export const makeDeleteFiles =
  ({ fs, audit }: { fs: FileSystemPort; audit: FileDeletionAudit }): DeleteFiles =>
  /**
   * @param input - The paths to delete, and whether the caller already confirmed.
   * @param ctx - An optional abort signal to cancel the deletion loop.
   * @returns The delete outcome: done, or awaiting confirmation.
   */
  async (
    input: DeleteFilesInput,
    ctx: { signal?: AbortSignal } = {},
  ): Promise<DeleteFilesResult> => {
    if (input.paths.length > CONFIRM_ABOVE && !input.confirmed) {
      return {
        kind: 'needs-confirmation',
        question: `Delete ${String(input.paths.length)} files?`,
      };
    }
    const deleted: string[] = [];
    try {
      for (const path of input.paths) {
        ctx.signal?.throwIfAborted();
        await fs.remove(path);
        deleted.push(path);
      }
    } finally {
      if (deleted.length > 0) audit.recordDeleted(deleted);
    }
    return { kind: 'deleted', count: deleted.length };
  };
