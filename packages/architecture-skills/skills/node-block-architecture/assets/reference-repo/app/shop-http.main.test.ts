import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// the shop server is not published, so it runs from source only
const main = fileURLToPath(new URL('./shop-http.main.ts', import.meta.url));

describe('shop-http.main', () => {
  it(
    'serves the tRPC API over HTTP and shuts down cleanly on SIGTERM',
    {
      tags: ['scenario'],
      meta: {
        spec: 'shop-http-binary-serves-and-shuts-down',
        arrange: 'the binary started on a port the OS picks, and announced that it is listening',
        act: 'a client queries the price of `tea`, and the process then receives SIGTERM',
        assert: 'the query answers 450 EUR, and the process exits with code 0',
      },
    },
    async () => {
      let child: ChildProcessWithoutNullStreams;
      let closed: Promise<number | null>;
      let port: number;
      let answer: { result: { data: unknown } };
      let exitCode: number | null;
      arrange: {
        child = spawn(process.execPath, [main], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PORT: '0', LOG_LEVEL: 'info' },
        });
        closed = new Promise((resolve) => {
          child.once('close', resolve);
        });
        port = await new Promise<number>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('the server did not announce that it is listening'));
          }, 10000);
          let buffered = '';
          child.stdout.on('data', (chunk: Buffer) => {
            buffered += chunk.toString();
            for (const line of buffered.split('\n')) {
              if (!line.includes('shop listening')) continue;
              clearTimeout(timer);
              resolve((JSON.parse(line) as { port: number }).port);
            }
          });
          child.once('close', () => {
            clearTimeout(timer);
            reject(new Error('the server exited before it was listening'));
          });
        });
      }
      act: {
        const input = encodeURIComponent(JSON.stringify({ skus: ['tea'] }));
        const response = await fetch(
          `http://127.0.0.1:${String(port)}/catalog.prices?input=${input}`,
        );
        answer = (await response.json()) as { result: { data: unknown } };
        child.kill('SIGTERM');
        exitCode = await closed;
      }
      assert: {
        expect(answer.result.data).toEqual([
          { sku: 'tea', listPrice: { amount: 450, currency: 'EUR' } },
        ]);
        expect(exitCode).toBe(0);
      }
    },
  );
});
