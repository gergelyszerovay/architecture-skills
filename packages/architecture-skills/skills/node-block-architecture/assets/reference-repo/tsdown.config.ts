import { defineConfig } from 'tsdown';

// Bundles each published binary into one ESM file per entry; `#libs/*` aliases are inlined and
// package dependencies stay external. The shop HTTP server is not published, so it runs from source.
export default defineConfig({
  entry: { 'cli.main': 'app/cli.main.ts', 'mcp.main': 'app/mcp.main.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  dts: false,
  clean: true,
});
