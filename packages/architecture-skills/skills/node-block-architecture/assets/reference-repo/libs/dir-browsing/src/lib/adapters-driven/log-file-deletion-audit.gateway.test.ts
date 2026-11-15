import { describe, expect, it } from 'vitest';
import { pino, type Logger } from 'pino';
import { fileDeletionAuditContract } from '../testing/file-deletion-audit.contract.ts';
import { makeLogFileDeletionAudit } from './log-file-deletion-audit.gateway.ts';

/**
 * Builds a logger that keeps every entry it writes, parsed.
 * @returns The logger and the entries written so far.
 */
const captureLog = (): { log: Logger; lines: Record<string, unknown>[] } => {
  const lines: Record<string, unknown>[] = [];
  const log = pino(
    { base: null, timestamp: false },
    { write: (line: string) => void lines.push(JSON.parse(line) as Record<string, unknown>) },
  );
  return { log, lines };
};

fileDeletionAuditContract('log gateway', () => {
  const { log, lines } = captureLog();
  return {
    audit: makeLogFileDeletionAudit({ log }),
    recorded: (): string[][] => lines.map((line) => line.paths as string[]),
  };
});

describe('makeLogFileDeletionAudit', () => {
  it(
    'writes one structured audit entry per call',
    {
      tags: ['scenario'],
      meta: {
        spec: 'log-audit-entry-shape',
        arrange: 'a logger keeping its entries',
        act: '`a.txt` and `b.txt` are recorded as deleted',
        assert: 'one info entry holds the audit marker, the count, the paths and the message',
      },
    },
    () => {
      let captured: ReturnType<typeof captureLog>;
      arrange: {
        captured = captureLog();
      }
      act: {
        makeLogFileDeletionAudit({ log: captured.log }).recordDeleted(['a.txt', 'b.txt']);
      }
      assert: {
        expect(captured.lines).toEqual([
          {
            level: 30,
            audit: 'files-deleted',
            count: 2,
            paths: ['a.txt', 'b.txt'],
            msg: 'files deleted',
          },
        ]);
      }
    },
  );
});
