import { makeFakeFileSystem } from './fake-file-system.fake.ts';
import { fileSystemContract } from './file-system.contract.ts';

fileSystemContract('fake', async (tree) => ({
  fs: makeFakeFileSystem(tree).fs,
  root: '.',
  cleanup: async (): Promise<void> => {
    // the in-memory fake holds no external resources to release
  },
}));
