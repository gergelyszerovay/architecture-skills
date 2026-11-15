import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirrors tsconfig `paths`: `~libs/<name>` resolves only to a lib's public barrel.
    alias: [
      {
        find: /^~libs\/([^/]+)$/,
        replacement: fileURLToPath(new URL('./libs/$1/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['libs/**/*.spec.ts', 'src/**/*.spec.ts'],
    // Browser specs need a real WebGL context: `pnpm run test:browser`.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.browser.spec.ts'],
    environment: 'node',
    strictTags: true,
    tags: [
      { name: 'scenario', description: 'A caller- or user-visible scenario with exactly one act.' },
      { name: 'edge-case', description: 'Behaviour at a boundary or under a failure condition.' },
      { name: 'invariant', description: 'A rule that holds for all inputs.' },
    ],
  },
});
