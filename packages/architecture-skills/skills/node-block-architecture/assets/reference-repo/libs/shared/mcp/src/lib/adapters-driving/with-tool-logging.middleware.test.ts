import {
  inputRequired,
  type CallToolResult,
  type ServerContext,
} from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { pino, type Logger } from 'pino';
import { z } from 'zod';
import { withToolLogging } from './with-tool-logging.middleware.ts';

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

const ctx = { mcpReq: { id: 7 }, sessionId: 's1' } as unknown as ServerContext;
const ok: CallToolResult = { content: [{ type: 'text', text: 'done' }] };

describe('withToolLogging', () => {
  it(
    'logs one info entry with the tool, the request ID and an ok outcome, and returns the result untouched',
    {
      tags: ['scenario'],
      meta: {
        spec: 'tool-logging-ok-outcome',
        arrange: 'a handler answering a normal result, wrapped for tool `dir_tree`',
        act: 'the wrapped handler is called for request 7',
        assert: 'the result is returned as is and one info entry says `ok` for `dir_tree`, call 7',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      let wrapped: ReturnType<typeof withToolLogging<object>>;
      let result: unknown;
      arrange: {
        captured = captureLog();
        wrapped = withToolLogging(captured.log, 'dir_tree', () => Promise.resolve(ok));
      }
      act: {
        result = await wrapped({}, ctx);
      }
      assert: {
        expect(result).toBe(ok);
        expect(captured.lines).toHaveLength(1);
        expect(captured.lines[0]).toMatchObject({
          level: 30,
          tool: 'dir_tree',
          callId: 7,
          sessionId: 's1',
          outcome: 'ok',
          msg: 'tool call',
        });
      }
    },
  );

  it(
    'logs an error result as an expected outcome at info level, not as a failure',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tool-logging-error-result',
        arrange: 'a handler answering a result marked `isError`',
        act: 'the wrapped handler is called',
        assert: 'one info entry says `error`',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      let wrapped: ReturnType<typeof withToolLogging<object>>;
      arrange: {
        captured = captureLog();
        wrapped = withToolLogging(captured.log, 'dir_tree', () =>
          Promise.resolve({ isError: true, content: [] }),
        );
      }
      act: {
        await wrapped({}, ctx);
      }
      assert: {
        expect(captured.lines).toHaveLength(1);
        expect(captured.lines[0]).toMatchObject({ level: 30, outcome: 'error' });
      }
    },
  );

  it(
    'logs an input-required result with its own outcome',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tool-logging-input-required',
        arrange: 'a handler answering an input-required elicitation',
        act: 'the wrapped handler is called',
        assert: 'one info entry says `input-required`',
      },
    },
    async () => {
      let captured: ReturnType<typeof captureLog>;
      let wrapped: ReturnType<typeof withToolLogging<object>>;
      arrange: {
        captured = captureLog();
        wrapped = withToolLogging(captured.log, 'delete_files', () =>
          Promise.resolve(
            inputRequired({
              inputRequests: {
                confirm: inputRequired.elicit({
                  message: 'Delete?',
                  requestedSchema: z.object({ confirm: z.boolean() }),
                }),
              },
            }),
          ),
        );
      }
      act: {
        await wrapped({}, ctx);
      }
      assert: {
        expect(captured.lines[0]).toMatchObject({ level: 30, outcome: 'input-required' });
      }
    },
  );

  it(
    'logs an unexpected throw once at error level with its cause, and rethrows it',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'tool-logging-throw',
        arrange: 'a handler that throws `boom`',
        act: 'the wrapped handler is called',
        assert: 'the same error is thrown and one error entry carries it',
      },
    },
    async () => {
      const boom = new Error('boom');
      let captured: ReturnType<typeof captureLog>;
      let wrapped: ReturnType<typeof withToolLogging<object>>;
      let outcome: Promise<unknown>;
      arrange: {
        captured = captureLog();
        wrapped = withToolLogging(captured.log, 'dir_tree', () => Promise.reject(boom));
      }
      act: {
        outcome = wrapped({}, ctx);
      }
      assert: {
        await expect(outcome).rejects.toBe(boom);
        expect(captured.lines).toHaveLength(1);
        expect(captured.lines[0]).toMatchObject({
          level: 50,
          msg: 'tool call failed',
          err: { message: 'boom' },
        });
      }
    },
  );
});
