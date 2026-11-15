import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Set by cage in a session whose person has an OpenRouter key: `http://127.0.0.1:<port>/<secret>/api/v1`,
 * the session's gateway (cage plan 0007). Unset outside a session and with no key.
 */
const openrouter = process.env.OPENROUTER_BASE_URL;

/**
 * Serves and bundles the page; `~libs/<name>` resolves to a lib's public barrel, as in `tsconfig.json`.
 * The page reaches OpenRouter through this dev server, never directly and never with a key: it calls
 * `/openrouter/chat/completions` on its own origin, and the dev server forwards that to the gateway
 * (which adds the person's key for the models they allowed). With no gateway the proxy is absent and
 * `/openrouter/…` answers 404; a built app (`vite build`) has no gateway.
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~libs\/([^/]+)$/,
        replacement: fileURLToPath(new URL('./libs/$1/src/index.ts', import.meta.url)),
      },
    ],
  },
  server: {
    proxy: openrouter
      ? {
          '/openrouter': {
            target: openrouter,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/openrouter/, ''),
          },
        }
      : undefined,
  },
});
