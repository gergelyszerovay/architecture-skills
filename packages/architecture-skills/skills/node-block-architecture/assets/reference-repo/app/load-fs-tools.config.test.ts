import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadFsToolsConfig } from './load-fs-tools.config.ts';

describe('loadFsToolsConfig', () => {
  it(
    'uses FS_TOOLS_ROOT as an absolute path when it is set',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'fs-tools-config-root-from-environment',
        arrange: 'an environment with FS_TOOLS_ROOT set to a relative folder',
        act: 'the configuration is loaded',
        assert: 'the root is that folder resolved to an absolute path',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let config: ReturnType<typeof loadFsToolsConfig>;
      arrange: {
        env = { FS_TOOLS_ROOT: 'some/folder' };
      }
      act: {
        config = loadFsToolsConfig(env);
      }
      assert: {
        expect(config.root).toBe(resolve('some/folder'));
      }
    },
  );

  it(
    'falls back to the working directory when FS_TOOLS_ROOT is not set',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'fs-tools-config-root-defaults-to-cwd',
        arrange: 'an environment without FS_TOOLS_ROOT',
        act: 'the configuration is loaded',
        assert: 'the root is the working directory',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let config: ReturnType<typeof loadFsToolsConfig>;
      arrange: {
        env = {};
      }
      act: {
        config = loadFsToolsConfig(env);
      }
      assert: {
        expect(config.root).toBe(process.cwd());
      }
    },
  );
});
