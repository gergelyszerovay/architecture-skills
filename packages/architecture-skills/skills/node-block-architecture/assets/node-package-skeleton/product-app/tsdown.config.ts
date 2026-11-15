import { defineConfig } from 'tsdown';

/**
 * Bundles the package's binary into one Node ESM file; `#libs/*` aliases are inlined and package
 * dependencies stay external.
 */
export default defineConfig({
  entry: { 'example.main': 'app/example.main.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  dts: false,
  clean: true,
});
