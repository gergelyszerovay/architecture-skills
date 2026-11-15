import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * The browser specs (`*.browser.spec.ts`): the engine on `WebGPURenderer` with a real canvas and DOM,
 * run in headless Chromium through Vitest browser mode, once per backend (the skill's decision 10):
 * `webgpu` starts Chromium with its WebGPU flags (a SwiftShader adapter on the `localhost` page), and
 * `webgl2` starts it without them and hides `navigator.gpu`, so the renderer falls back to its WebGL 2
 * backend as it does in a browser without WebGPU. A spec reads its backend with `inject('backend')`.
 * `CHROMIUM_PATH` points at a Chromium build when Playwright's own download is not installed;
 * software rendering (SwiftShader) is enough.
 */
const executablePath = process.env['CHROMIUM_PATH'] ?? findChromium();

/** The flags every run passes: software WebGL through SwiftShader. */
const webglArgs = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

/** The flags that expose Chromium's SwiftShader WebGPU adapter headless. */
const webgpuArgs = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-webgpu-adapter=swiftshader',
  '--use-vulkan=swiftshader',
];

const chromium = (args: string[]) =>
  playwright({ launchOptions: { ...(executablePath ? { executablePath } : {}), args } });

function findChromium(): string | undefined {
  const candidates = [
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

export default defineConfig({
  // Pre-bundled up front: found later, `three/webgpu` makes Vite reload the page mid-run.
  optimizeDeps: { include: ['three', 'three/webgpu'] },
  resolve: {
    // Mirrors tsconfig `paths`: `~libs/<name>` resolves only to a lib's public barrel,
    // `~libs/<name>/testing` to its test-only entry.
    alias: [
      {
        find: /^~libs\/([^/]+)\/testing$/,
        replacement: fileURLToPath(new URL('./libs/$1/src/testing.ts', import.meta.url)),
      },
      {
        find: /^~libs\/([^/]+)$/,
        replacement: fileURLToPath(new URL('./libs/$1/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['libs/**/*.browser.spec.ts'],
    strictTags: true,
    tags: [
      { name: 'scenario', description: 'A caller- or user-visible scenario with exactly one act.' },
      { name: 'edge-case', description: 'Behaviour at a boundary or under a failure condition.' },
      { name: 'invariant', description: 'A rule that holds for all inputs.' },
    ],
    // Software WebGPU is slow: bound every spec, and keep pixel comparisons out of them.
    testTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      provider: chromium(webglArgs),
      instances: [
        {
          browser: 'chromium',
          name: 'webgpu',
          provider: chromium([...webglArgs, ...webgpuArgs]),
          provide: { backend: 'webgpu' },
        },
        {
          browser: 'chromium',
          name: 'webgl2',
          provide: { backend: 'webgl2' },
          setupFiles: ['./vitest.browser.webgl2-setup.ts'],
        },
      ],
    },
  },
});
