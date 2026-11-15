import { describe, expect, it } from 'vitest';
import { loadLoggingConfig } from './load-logging.config.ts';

describe('loadLoggingConfig', () => {
  it(
    'defaults to info when LOG_LEVEL is not set',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'logging-config-defaults-to-info',
        arrange: 'an environment without LOG_LEVEL',
        act: 'the configuration is loaded',
        assert: 'the level is `info`',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let config: ReturnType<typeof loadLoggingConfig>;
      arrange: {
        env = {};
      }
      act: {
        config = loadLoggingConfig(env);
      }
      assert: {
        expect(config.level).toBe('info');
      }
    },
  );

  it(
    'rejects a level pino does not know',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'logging-config-rejects-unknown-level',
        arrange: 'an environment with LOG_LEVEL set to `loud`',
        act: 'the configuration is loaded',
        assert: 'loading fails with an error',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let failure: unknown;
      arrange: {
        env = { LOG_LEVEL: 'loud' };
      }
      act: {
        try {
          loadLoggingConfig(env);
        } catch (error) {
          failure = error;
        }
      }
      assert: {
        expect(failure).toBeInstanceOf(Error);
      }
    },
  );
});
