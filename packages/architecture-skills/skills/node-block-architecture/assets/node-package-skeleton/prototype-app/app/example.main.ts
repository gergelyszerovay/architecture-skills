import { composeExample } from './compose-example.composition.ts';
import { loadExampleConfig, readProcessEnv } from './example.config.ts';
import { makeExampleServer } from './example.server.ts';

const config = loadExampleConfig(readProcessEnv());
const server = makeExampleServer({ route: composeExample(), ...config });
const port = await server.listen();
process.stdout.write(`Listening on http://${config.host}:${String(port)}/\n`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void server.close();
  });
}
