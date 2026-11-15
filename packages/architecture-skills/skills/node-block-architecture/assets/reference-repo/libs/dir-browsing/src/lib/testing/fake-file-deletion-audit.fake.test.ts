import { makeFakeFileDeletionAudit } from './fake-file-deletion-audit.fake.ts';
import { fileDeletionAuditContract } from './file-deletion-audit.contract.ts';

fileDeletionAuditContract('fake', () => {
  const { audit, recorded } = makeFakeFileDeletionAudit();
  return { audit, recorded: (): string[][] => recorded };
});
