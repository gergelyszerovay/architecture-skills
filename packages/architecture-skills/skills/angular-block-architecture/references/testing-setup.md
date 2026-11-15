# Spec setup for Angular CLI and Vitest

How to configure an Angular CLI project that runs unit tests through
`@angular/build:unit-test` with Vitest, so specs carry the metadata the architecture
requires (constitution [D31](../angular-block-architecture.constitution.md#D31)–D33, D37). Verified with `@angular/build` 22.1.3 and `vitest`
4.1.5, and the browser setup with `@angular/build` 22.2.2, `vitest` and
`@vitest/browser-playwright` 4.1.11; check the installed versions before copying.

## Spec shape

The spec shape (kind tag, `meta` with the slug and phase descriptions, labeled phases,
skeletons) is in the architecture-docs-and-specs skill. The steps below make an Angular
CLI project run it.

## 1. Tag definitions

Create `vitest-base.config.ts` in the project root (`ng generate config vitest` creates a
starting file). Keep it to the tag definitions; the Angular team doesn't support other
contents of this file.

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    strictTags: true,
    tags: [
      {
        name: 'scenario',
        description: 'A caller- or user-visible scenario with exactly one act.',
      },
      {
        name: 'edge-case',
        description: 'Behaviour at a boundary or under a failure condition.',
      },
      { name: 'invariant', description: 'A rule that holds for all inputs.' },
    ],
  },
});
```

The builder merges the file's `test` section into the project it generates. `tags` and
`strictTags` are project-level options and survive the merge; `test.projects` and
`test.include` are overridden, and the file's `reporters` are dropped when the builder's
own `reporters` option is set.

## 2. Test target

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "include": ["**/*.spec.ts", "../libs/**/*.spec.ts"],
    "runnerConfig": "vitest-base.config.ts",
    "browsers": ["ChromiumHeadless"],
    "browserViewport": "1280x800",
    "reporters": ["default", ["json", { "outputFile": "<path>/unit-tests.json" }]]
  }
}
```

- **`browsers`** runs the specs in Vitest's browser mode, here headless Chromium through
  Playwright: add `@vitest/browser-playwright` at the installed `vitest`'s version and
  `playwright` as dev dependencies, and drop `jsdom`. A real browser lays out, focuses,
  scrolls and measures; jsdom fakes all four, so a spec of a strip that scrolls, a dialog that
  takes focus or a view that measures its lines passes there without proving anything.
  Install Chromium with `pnpm exec playwright install chromium`, or point `CHROME_BIN` at one
  already installed: the builder launches that executable.
- **`browserViewport`** fixes the page's size, so a spec that measures sees the same
  width on every machine.

- **`include` globs from the source root** (`sourceRoot`, usually `src/`), not the
  project root as the builder's schema says. Libraries outside `src/` need a
  `../libs/**/*.spec.ts` pattern, or the builder reports "No tests found".
- **Reporters** are configured here only. The JSON report records each test's `tags` and
  `meta`, which documentation generators join by `meta.spec`.

## 3. Types

Declare the metadata types in a `.d.ts` file included by the spec tsconfig, so an unknown
tag or a misspelled `meta` key fails at compile time as well as at runtime:

```ts
import 'vitest';

declare module 'vitest' {
  interface TaskMeta {
    spec?: string;
    arrange?: string;
    act?: string;
    assert?: string;
  }
  interface TestTags {
    kind: 'scenario' | 'edge-case' | 'invariant';
  }
}
```

## 4. TypeScript configurations

- **`tsconfig.spec.json`** includes the library specs and the declaration file, and sets
  `"noEmit": true` when the base config enables `allowImportingTsExtensions` (otherwise
  the build fails with TS5096):

  ```json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": { "types": ["vitest/globals"], "noEmit": true },
    "include": ["src/**/*.d.ts", "src/**/*.spec.ts", "libs/**/*.spec.ts", "vitest-spec-kinds.d.ts"]
  }
  ```

- **`tsconfig.app.json`** excludes the library specs when it includes library sources
  (for example `libs/**/src/**/*.ts`); otherwise the application build type-checks specs
  without the Vitest globals:

  ```json
  "exclude": ["src/**/*.spec.ts", "libs/**/*.spec.ts"]
  ```

## Verify

- An unknown tag fails the build through the `TestTags` augmentation, and, with the type
  bypassed, Vitest rejects it at runtime (`The tag "…" is not defined in the
configuration`).
- The JSON report lists every spec with its `tags` and `meta.spec`.
- The application build and its typecheck still pass.
