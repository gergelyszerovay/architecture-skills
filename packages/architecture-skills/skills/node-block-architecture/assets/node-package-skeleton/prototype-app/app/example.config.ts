/** Where the server listens: the host and the port. */
export type ExampleConfig = { readonly host: string; readonly port: number };

/** The port used when `PORT` is not set (portless sets it). */
const DEFAULT_PORT = 3000;

/**
 * Reads the server's configuration from the environment: `PORT` (portless sets it) and `HOST`
 * (portless sets it to 127.0.0.1); a missing or invalid port falls back to 3000.
 * @param env - The process environment.
 * @returns The configuration.
 */
export const loadExampleConfig = (
  env: Readonly<Record<string, string | undefined>>,
): ExampleConfig => {
  const port = Number(env.PORT);
  return {
    host: env.HOST ?? '127.0.0.1',
    port:
      env.PORT !== undefined && Number.isInteger(port) && port >= 0 && port <= 65535
        ? port
        : DEFAULT_PORT,
  };
};

/**
 * The process environment, read here because only a `.config.ts` block may touch `process.env`.
 * @returns The live `process.env` object.
 */
export const readProcessEnv = (): NodeJS.ProcessEnv => process.env;
