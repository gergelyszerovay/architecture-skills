import { defineConfig } from 'tsdown';

/**
 * Bundles the library's entry as Node ESM with declarations; `#libs/*` aliases are inlined and
 * package dependencies stay external.
 */
export default defineConfig({
  entry: { index: 'libs/example/src/package.entry.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  dts: true,
  sourcemap: true,
  clean: true,
});
