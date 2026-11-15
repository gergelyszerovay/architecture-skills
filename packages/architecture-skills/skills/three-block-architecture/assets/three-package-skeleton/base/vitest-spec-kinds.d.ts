import 'vitest';

declare module 'vitest' {
  interface TaskMeta {
    spec?: string;
    arrange?: string;
    act?: string;
    assert?: string;
  }
  /** What a browser-spec run provides (`vitest.browser.config.ts`): the backend it runs on. */
  interface ProvidedContext {
    backend: 'webgpu' | 'webgl2';
  }
  interface TestTags {
    kind: 'scenario' | 'edge-case' | 'invariant';
  }
}
