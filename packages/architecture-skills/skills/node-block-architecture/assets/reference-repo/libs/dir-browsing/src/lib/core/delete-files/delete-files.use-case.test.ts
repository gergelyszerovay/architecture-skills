import { describe, expect, it } from 'vitest';
import { makeFakeFileSystem } from '../../testing/fake-file-system.fake.ts';
import { makeFakeFileDeletionAudit } from '../../testing/fake-file-deletion-audit.fake.ts';
import { makeDeleteFiles } from './delete-files.use-case.ts';
import type { DeleteFilesResult } from './delete-files.result.ts';

const many = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`f${String(i)}.txt`, '']));

describe('makeDeleteFiles', () => {
  it(
    'deletes a small batch without asking for confirmation',
    {
      tags: ['scenario'],
      meta: {
        spec: 'delete-small-batch',
        arrange: 'two files',
        act: 'both are deleted without a confirmation',
        assert: 'the result counts two deletions and the audit records both paths',
      },
    },
    async () => {
      let files: ReturnType<typeof makeFakeFileSystem>;
      let auditor: ReturnType<typeof makeFakeFileDeletionAudit>;
      let result: DeleteFilesResult;
      arrange: {
        files = makeFakeFileSystem({ 'a.txt': '', 'b.txt': '' });
        auditor = makeFakeFileDeletionAudit();
      }
      act: {
        result = await makeDeleteFiles({ fs: files.fs, audit: auditor.audit })({
          paths: ['a.txt', 'b.txt'],
        });
      }
      assert: {
        expect(result).toEqual({ kind: 'deleted', count: 2 });
        expect(files.nodes.size).toBe(0);
        expect(auditor.recorded).toEqual([['a.txt', 'b.txt']]);
      }
    },
  );

  it(
    'asks for confirmation above the threshold and deletes nothing',
    {
      tags: ['scenario'],
      meta: {
        spec: 'delete-asks-confirmation',
        arrange: 'eleven files',
        act: 'all eleven are requested for deletion without a confirmation',
        assert: 'the result asks for confirmation, and nothing is deleted or audited',
      },
    },
    async () => {
      let files: ReturnType<typeof makeFakeFileSystem>;
      let auditor: ReturnType<typeof makeFakeFileDeletionAudit>;
      let result: DeleteFilesResult;
      arrange: {
        files = makeFakeFileSystem(many);
        auditor = makeFakeFileDeletionAudit();
      }
      act: {
        result = await makeDeleteFiles({ fs: files.fs, audit: auditor.audit })({
          paths: Object.keys(many),
        });
      }
      assert: {
        expect(result.kind).toBe('needs-confirmation');
        expect(files.nodes.size).toBe(11);
        expect(auditor.recorded).toEqual([]);
      }
    },
  );

  it(
    'deletes once confirmed and audits the deleted paths',
    {
      tags: ['scenario'],
      meta: {
        spec: 'delete-confirmed-batch',
        arrange: 'eleven files',
        act: 'all eleven are deleted with a confirmation',
        assert: 'the result counts eleven deletions and the audit records every path',
      },
    },
    async () => {
      let files: ReturnType<typeof makeFakeFileSystem>;
      let auditor: ReturnType<typeof makeFakeFileDeletionAudit>;
      let result: DeleteFilesResult;
      arrange: {
        files = makeFakeFileSystem(many);
        auditor = makeFakeFileDeletionAudit();
      }
      act: {
        result = await makeDeleteFiles({ fs: files.fs, audit: auditor.audit })({
          paths: Object.keys(many),
          confirmed: true,
        });
      }
      assert: {
        expect(result).toEqual({ kind: 'deleted', count: 11 });
        expect(files.nodes.size).toBe(0);
        expect(auditor.recorded).toEqual([Object.keys(many)]);
      }
    },
  );

  it(
    'audits the files removed before a failure and then throws the failure',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'delete-audits-before-failure',
        arrange: 'files `a.txt` and `b.txt`',
        act: 'deletion is requested for `a.txt`, a missing file, then `b.txt`',
        assert: 'the missing file is thrown, and the audit holds only `a.txt`',
      },
    },
    async () => {
      let files: ReturnType<typeof makeFakeFileSystem>;
      let auditor: ReturnType<typeof makeFakeFileDeletionAudit>;
      let outcome: Promise<DeleteFilesResult>;
      arrange: {
        files = makeFakeFileSystem({ 'a.txt': '', 'b.txt': '' });
        auditor = makeFakeFileDeletionAudit();
      }
      act: {
        outcome = makeDeleteFiles({ fs: files.fs, audit: auditor.audit })({
          paths: ['a.txt', 'missing.txt', 'b.txt'],
        });
      }
      assert: {
        await expect(outcome).rejects.toThrow('Path not found: missing.txt');
        expect(auditor.recorded).toEqual([['a.txt']]);
      }
    },
  );

  it(
    'audits the files removed before the signal aborted and then stops',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'delete-audits-before-abort',
        arrange: 'files `a.txt` and `b.txt`, and a signal that aborts once `a.txt` is removed',
        act: 'both files are requested for deletion with that signal',
        assert:
          'the call rejects with the abort reason, `b.txt` is left, and the audit holds `a.txt`',
      },
    },
    async () => {
      let files: ReturnType<typeof makeFakeFileSystem>;
      let auditor: ReturnType<typeof makeFakeFileDeletionAudit>;
      let controller: AbortController;
      let outcome: Promise<DeleteFilesResult>;
      arrange: {
        files = makeFakeFileSystem({ 'a.txt': '', 'b.txt': '' });
        auditor = makeFakeFileDeletionAudit();
        controller = new AbortController();
        const remove = files.fs.remove.bind(files.fs);
        files.fs.remove = async (path): Promise<void> => {
          await remove(path);
          controller.abort(new Error('cancelled'));
        };
      }
      act: {
        outcome = makeDeleteFiles({ fs: files.fs, audit: auditor.audit })(
          { paths: ['a.txt', 'b.txt'] },
          { signal: controller.signal },
        );
      }
      assert: {
        await expect(outcome).rejects.toThrow('cancelled');
        expect([...files.nodes.keys()]).toEqual(['b.txt']);
        expect(auditor.recorded).toEqual([['a.txt']]);
      }
    },
  );
});
