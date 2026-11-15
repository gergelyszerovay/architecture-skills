import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { nodeFileSystem } from './node-file-system.gateway.ts';
import { fileSystemContract } from '../testing/file-system.contract.ts';

fileSystemContract('node fs', async (tree) => {
  const root = await mkdtemp(join(tmpdir(), 'fs-contract-'));
  for (const [path, content] of Object.entries(tree)) {
    const full = join(root, path);
    if (content === null) await mkdir(full, { recursive: true });
    else {
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, content);
    }
  }
  return {
    fs: nodeFileSystem,
    root,
    cleanup: (): Promise<void> => rm(root, { recursive: true, force: true }),
  };
});
