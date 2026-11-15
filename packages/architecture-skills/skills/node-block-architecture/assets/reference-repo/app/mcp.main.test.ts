import { existsSync } from 'node:fs';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// the source entry runs under type stripping; the built entry is what `bin` publishes
const entries: [label: string, main: string][] = [
  ['source', fileURLToPath(new URL('./mcp.main.ts', import.meta.url))],
  ['built', fileURLToPath(new URL('../dist/mcp.main.mjs', import.meta.url))],
];
const root = fileURLToPath(new URL('../', import.meta.url));

type JsonRpcLine = { jsonrpc: string; result?: { tools?: { name: string }[] } };
type LogLine = { msg?: string; tool?: string; callId?: number; outcome?: string };

const parseJsonRpcLine = (text: string): JsonRpcLine => JSON.parse(text) as JsonRpcLine;
const parseLogLine = (text: string): LogLine => JSON.parse(text) as LogLine;

for (const [label, main] of entries) {
  describe(`mcp.main (${label} entry)`, () => {
    // the built entry exists only after `pnpm run build`
    it.skipIf(!existsSync(main))(
      'writes only JSON-RPC messages to stdout while logging to stderr',
      {
        tags: ['scenario'],
        meta: {
          spec: 'mcp-binary-stdout-only-json-rpc',
          arrange:
            'the binary started with debug logging and the repository as its root, ready to serve',
          act: 'a client initializes, lists the tools and calls `dir_tree`',
          assert:
            'stdout holds only JSON-RPC responses listing the three tools, and stderr logs the `dir_tree` call as `ok`',
        },
      },
      async () => {
        let child: ChildProcessWithoutNullStreams;
        let closed: Promise<[number | null, NodeJS.Signals | null]>;
        let responses: Promise<void>;
        const lines: string[] = [];
        let stderr = '';
        let exit: [number | null, NodeJS.Signals | null];
        arrange: {
          child = spawn(process.execPath, [main], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, LOG_LEVEL: 'debug', FS_TOOLS_ROOT: root },
          });
          closed = new Promise((resolve) => {
            child.once('close', (code, signal) => {
              resolve([code, signal]);
            });
          });
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 5000);
            const finish = (): void => {
              clearTimeout(timer);
              resolve();
            };
            child.stderr.on('data', (chunk: Buffer) => {
              stderr += chunk.toString();
              if (stderr.includes('fs-tools MCP server running')) finish();
            });
            child.once('error', finish);
            child.once('close', finish);
          });
          let buffer = '';
          responses = new Promise<void>((resolve) => {
            child.stdout.on('data', (chunk: Buffer) => {
              buffer += chunk.toString();
              const parts = buffer.split('\n');
              buffer = parts.pop() ?? '';
              lines.push(...parts);
              if (lines.length >= 3) resolve();
            });
            child.stdout.once('end', () => {
              if (buffer.length > 0) lines.push(buffer);
              resolve();
            });
            child.once('error', () => {
              resolve();
            });
            child.once('close', () => {
              resolve();
            });
          });
        }
        act: {
          const send = (m: unknown): boolean => child.stdin.write(JSON.stringify(m) + '\n');
          send({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2025-06-18',
              capabilities: {},
              clientInfo: { name: 'test', version: '1' },
            },
          });
          send({ jsonrpc: '2.0', method: 'notifications/initialized' });
          send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
          send({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: { name: 'dir_tree', arguments: { path: '.', maxDepth: 1 } },
          });
          await responses;
          child.kill();
          exit = await closed;
        }
        assert: {
          expect(
            lines.length,
            `expected three JSON-RPC responses; exit=${JSON.stringify(exit)} stdout=${JSON.stringify(lines)} stderr=${stderr}`,
          ).toBeGreaterThanOrEqual(3);
          for (const line of lines) expect(parseJsonRpcLine(line).jsonrpc).toBe('2.0');
          const tools = (parseJsonRpcLine(lines[1] ?? '{}').result?.tools ?? []).map((t) => t.name);
          expect(tools.sort()).toEqual(['delete_files', 'dir_tree', 'list_files']);
          const logs = stderr
            .trim()
            .split('\n')
            .map((l) => parseLogLine(l));
          expect(
            logs.some(
              (l) =>
                l.msg === 'tool call' &&
                l.tool === 'dir_tree' &&
                l.callId === 3 &&
                l.outcome === 'ok',
            ),
          ).toBe(true);
        }
      },
    );
  });
}
