import { describe, expect, it } from 'vitest';
import { loadShopHttpConfig } from './load-shop-http.config.ts';

describe('loadShopHttpConfig', () => {
  it(
    'defaults to port 3000 when PORT is not set',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-http-config-defaults-to-3000',
        arrange: 'an environment without PORT',
        act: 'the configuration is loaded',
        assert: 'the port is 3000',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let config: ReturnType<typeof loadShopHttpConfig>;
      arrange: {
        env = {};
      }
      act: {
        config = loadShopHttpConfig(env);
      }
      assert: {
        expect(config.port).toBe(3000);
      }
    },
  );

  it(
    'reads PORT as a number, accepting 0 so the OS can pick a port',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-http-config-reads-port',
        arrange: 'an environment with PORT set to `0`',
        act: 'the configuration is loaded',
        assert: 'the port is the number 0',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let config: ReturnType<typeof loadShopHttpConfig>;
      arrange: {
        env = { PORT: '0' };
      }
      act: {
        config = loadShopHttpConfig(env);
      }
      assert: {
        expect(config.port).toBe(0);
      }
    },
  );

  it(
    'rejects a PORT that is not a valid TCP port',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'shop-http-config-rejects-invalid-port',
        arrange: 'an environment with PORT set to `70000`',
        act: 'the configuration is loaded',
        assert: 'loading fails with an error',
      },
    },
    () => {
      let env: NodeJS.ProcessEnv;
      let failure: unknown;
      arrange: {
        env = { PORT: '70000' };
      }
      act: {
        try {
          loadShopHttpConfig(env);
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
