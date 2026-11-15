import { describe, expect, it } from 'vitest';
import { pino, type Logger } from 'pino';
import { authedProcedure } from './authed-procedure.middleware.ts';
import { createCallerFactory } from './create-caller-factory.middleware.ts';
import { publicProcedure } from './public-procedure.middleware.ts';
import { router } from './router.middleware.ts';

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

const probe = router({
  ok: publicProcedure.query(() => 'fine'),
  boom: publicProcedure.query((): string => {
    throw new Error('boom');
  }),
  me: authedProcedure.query(({ ctx }) => ctx.user.id),
});
const callerFor = createCallerFactory(probe);

describe('the tRPC base procedures', () => {
  it(
    'log one info entry per call with the path, type and an ok outcome',
    {
      tags: ['scenario'],
      meta: {
        spec: 'trpc-logs-ok-call',
        arrange: 'a query that answers, and a request logger',
        act: 'the query is called',
        assert: 'one info entry names path `ok`, type `query` and outcome `ok`',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      arrange: {
        captured = captureLog();
      }
      act: {
        await callerFor({ log: captured.log }).ok();
      }
      assert: {
        expect(captured.lines).toHaveLength(1);
        expect(captured.lines[0]).toMatchObject({
          level: 30,
          path: 'ok',
          type: 'query',
          outcome: 'ok',
          msg: 'trpc call',
        });
      }
    },
  );

  it(
    'log an unexpected failure at error level with its cause',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'trpc-logs-unexpected-failure',
        arrange: 'a query that throws `boom`, and a request logger',
        act: 'the query is called',
        assert: 'the call fails and one error entry carries the cause',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      let outcome: Promise<unknown>;
      arrange: {
        captured = captureLog();
      }
      act: {
        outcome = callerFor({ log: captured.log }).boom();
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        expect(captured.lines).toHaveLength(1);
        expect(captured.lines[0]).toMatchObject({
          level: 50,
          msg: 'trpc call failed',
          err: { message: 'boom' },
        });
      }
    },
  );

  it(
    'log an expected failure at info level with its code',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'trpc-logs-expected-failure',
        arrange: 'an authenticated query, and a request logger without a user',
        act: 'the query is called',
        assert: 'the call fails with UNAUTHORIZED and one info entry carries that code',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      let outcome: Promise<unknown>;
      arrange: {
        captured = captureLog();
      }
      act: {
        outcome = callerFor({ log: captured.log }).me();
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(captured.lines[0]).toMatchObject({ level: 30, outcome: 'UNAUTHORIZED' });
      }
    },
  );

  it(
    'let an authenticated call see the caller as `ctx.user`',
    {
      tags: ['scenario'],
      meta: {
        spec: 'trpc-authed-sees-user',
        arrange: 'an authenticated query returning the user ID',
        act: 'the query is called by user `c1`',
        assert: 'the answer is `c1`',
      },
    },
    async () => {
      let caller: ReturnType<typeof callerFor>;
      let result: string;
      arrange: {
        caller = callerFor({ user: { id: 'c1' } });
      }
      act: {
        result = await caller.me();
      }
      assert: {
        expect(result).toBe('c1');
      }
    },
  );
});
