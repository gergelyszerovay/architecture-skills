import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const main = fileURLToPath(new URL('./example.main.ts', import.meta.url));

describe('example.main', () => {
  it(
    'serves the greeting on PORT, says where, and stops on SIGTERM',
    {
      tags: ['scenario'],
      meta: {
        spec: 'main-serves-greeting',
        arrange: 'the entry run as a Node process with PORT=0',
        act: 'it prints its URL and GET /?name=Ada is asked',
        assert: 'the answer is 200 with a greeting for Ada and SIGTERM ends the process with 0',
      },
    },
    async () => {
      let child: ReturnType<typeof spawn>;
      let url: string;
      let status: number;
      let text: string;
      let exitCode: number | null;
      arrange: {
        child = spawn(process.execPath, [main], {
          env: { ...process.env, PORT: '0' },
          stdio: ['ignore', 'pipe', 'inherit'],
        });
        url = await new Promise<string>((resolve, reject) => {
          let out = '';
          child.stdout?.on('data', (chunk: Buffer) => {
            out += chunk.toString();
            const found = /Listening on (http:\/\/\S+)/.exec(out);
            if (found?.[1] !== undefined) resolve(found[1]);
          });
          child.once('close', () => {
            reject(new Error(`ended before it listened: ${out}`));
          });
        });
      }
      act: {
        const response = await fetch(`${url}?name=Ada`);
        status = response.status;
        text = await response.text();
        exitCode = await new Promise((resolve) => {
          child.once('close', resolve);
          child.kill('SIGTERM');
        });
      }
      assert: {
        expect(status).toBe(200);
        expect(text).toMatch(/^Good (morning|afternoon|evening), Ada\n$/);
        expect(exitCode).toBe(0);
      }
    },
  );
});
