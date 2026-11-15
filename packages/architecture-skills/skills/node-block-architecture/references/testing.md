# Testing

Test each block at its own boundary. Most tests are fast use-case tests with fakes; a few
slower tests prove that the fakes and the real adapters agree.

| Subject                                           | Test with                                                                                                                                                    | Proves                                                                                                     | Spec kinds                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Domain rules, policies, formats, mappers, schemas | Plain inputs, an example table or properties                                                                                                                 | Business logic, translation                                                                                | invariant                                         |
| Use case or flow                                  | Fakes of its ports, real state blocks, a fixed clock; never a transport or DI container (constitution [D45](../node-block-architecture.constitution.md#D45)) | Orchestration, outcomes, failure policy                                                                    | scenario, edge-case                               |
| State block, flow, consumer, job, socket          | The same, driving overlapping calls                                                                                                                          | Failure paths and the concurrency policy                                                                   | scenario, edge-case (state blocks also invariant) |
| Driven adapter                                    | Real infrastructure (container, temp dir, sandbox API) via the port contract                                                                                 | The adapter honors the port                                                                                | the port's contract suite                         |
| Fake                                              | The same port contract                                                                                                                                       | The fake honors the port                                                                                   | the port's contract suite                         |
| Driving adapter                                   | Stubbed use case                                                                                                                                             | Outcome mapping: status and body, tool result and `isError`, `TRPCError` code, exit code and stdout/stderr | scenario, edge-case                               |
| Composition                                       | Build it once (with Awilix, resolve every registration)                                                                                                      | Wiring is complete                                                                                         | scenario                                          |
| Binary                                            | One smoke test per `.main.ts`                                                                                                                                | Startup, transport, shutdown                                                                               | scenario                                          |

The spec kinds each block allows are in the [profile](../node-block-architecture.architecture-profile.md); slugs, metadata and skeletons
are in the architecture-docs-and-specs skill.

## Port contract tests

A `.contract.ts` block holds one test suite per secondary port, written against the
interface and parameterized by a factory. Run it against the fake and against each real
adapter, so fakes cannot drift from reality:

```ts
// libs/dir-browsing/src/lib/testing/file-system.contract.ts
export const fileSystemContract = (
  name: string,
  setup: () => Promise<{
    fs: FileSystemPort;
    given: (tree: Record<string, string | null>) => Promise<void>; // null = directory
    cleanup: () => Promise<void>;
  }>,
) =>
  describe(`FileSystemPort contract: ${name}`, () => {
    it(
      'lists direct children with their kinds',
      {
        tags: ['scenario'],
        meta: { spec: 'file-system-lists-children', arrange: '…', act: '…', assert: '…' },
      },
      async () => {
        /* ... */
      },
    );
    it(
      'fails with a not-found port error for a missing path',
      {
        tags: ['edge-case'],
        meta: { spec: 'file-system-missing-path', arrange: '…', act: '…', assert: '…' },
      },
      async () => {
        /* ... */
      },
    );
  });

// fake-file-system.fake.test.ts
fileSystemContract('fake', async () => {
  /* in-memory fake */
});

// node-file-system.gateway.test.ts
fileSystemContract('node fs', async () => {
  /* temp directory */
});
```

Each spec is declared once, with the port's spec kinds and a slug like any other spec
(constitution [D42](../node-block-architecture.constitution.md#D42), [D46](../node-block-architecture.constitution.md#D46)); every run shares that slug, and the suite name, which includes the
implementation's name, tells the runs apart.

**Reaching every adapter.** A library exposes its fakes, fixtures and contract suites
through a test-only entry, `src/testing.ts`, next to `src/index.ts` (constitution [D46](../node-block-architecture.constitution.md#D46)).
Tests in other libraries and in `app/` import it as `#libs/<lib>/testing`; production
code can't (`no-testing-in-prod`). That is how a bridge, the real adapter of its feature's
port, runs the port's contract:

```ts
// app/catalog-price-lookup.bridge.test.ts
priceLookupContract('catalog bridge', (prices) =>
  makeCatalogPriceLookup({
    getPrices: makeGetPrices({ products: makeFakeProductStore(seed(prices)) }),
  }),
);
```

A port that composition would satisfy with an inline value (`asValue({ next: randomUUID })`)
gets a named adapter block instead (`crypto-id-generator.gateway.ts`), so its contract
runs against the real thing.

Include failure behavior in the contract (not found, conflict, unavailable), not only
the happy path; use cases depend on those failures being translated.

## In-memory adapters are not fakes

An in-memory driven adapter used in production or demos (`in-memory-order-store.repository.ts`)
is still an adapter. Use-case tests import fakes from `testing/`, never adapters;
the `directory-allow-list` rule catches a use-case test in `core/` that imports an adapter.
Run the port contract against both to keep them equivalent.

## Other rules

- For stdio binaries (MCP servers, piped CLIs), start the process with logging at
  `debug` and assert stdout contains only protocol messages or final output, and stderr
  contains the expected log entries. For a published binary, run the same test against
  the built entry too (skipped until `build` has run), so bundling cannot break the
  protocol stream.
- To assert log entries, pass pino an in-memory destination instead of mocking the
  logger (see the logging rules in [operations.md](operations.md)).
- Keep tests beside their subject (`x.use-case.test.ts`); fakes, fixtures, and contracts
  live in the library's `testing/` folder until shared. A use-case test may use real
  `.state.ts` blocks with fakes of the ports they read from.

## Converting `node:test` suites

A package whose specs still use `node:test` cannot carry spec metadata (constitution [D48](../node-block-architecture.constitution.md#D48)).
`node assets/codemods/node-test-to-vitest.mjs <folder>` does the mechanical part: imports, the
renamed calls, and a `TODO`-tagged `meta` with a slug on each spec, and reports what it cannot
convert (`--help` lists the options, the counts and every reported construct; `--write`
rewrites). The `TODO` tag is not a spec kind, so under `strictTags` the files fail until the
hand pass gives each spec a real kind tag, a slug that says something and is unique in the lib,
the phase strings and the labeled blocks (an invariant keeps only the slug), and the package's
formatter has run. The Vitest config and scripts are in [setup.md](setup.md), "Moving a
package from `node:test` to Vitest".
