# Documentation and testing

How a Node package documents itself and specifies its behaviour (constitution [D35](../node-block-architecture.constitution.md#D35)–D51).
The conventions shared with the other architectures (where each fact lives, levels,
behaviour tags, spec kinds, slugs, phase metadata, skeletons, fast-forward) are in the
architecture-docs-and-specs skill; read it first. This reference adds what is specific to
Node. The checkable parts are in [node-block-architecture.architecture-profile.md](../node-block-architecture.architecture-profile.md).

## Docs

| Level                   | Authored                                                                    | Template       |
| ----------------------- | --------------------------------------------------------------------------- | -------------- |
| Package                 | boundaries, approved packages, rule exceptions, package decisions, contexts | `node-package` |
| Lib (feature or shared) | boundaries, owned records, lib decisions, areas                             | `node-lib`     |

A library's role (feature or shared) follows from its path, so the lib doc doesn't declare
it. The templates ship with this skill in `markdown-schema-templates/`.

- **Owned Records** lists the tables, collections, files and external caches the library
  owns (constitution [D11](../node-block-architecture.constitution.md#D11)), with the one block that writes each. In-process state is
  declared by its `.state.ts` block's `@owns`, `@lifetime` and `@cleanup` tags, so it isn't
  listed again; a dynamic view of the lib shows both. Shared libraries usually own none.
- **Areas** (optional) lists the `core/<area>/` directories of a large feature with its use
  cases, flows and steps and what each owns (constitution [D58](../node-block-architecture.constitution.md#D58)). No rule reads it yet.
- **Approved Packages** lists packages that code inside the hexagon may import beyond
  its layer's allowance, for example a types-only workspace package whose types are the
  feature's vocabulary, or `node:crypto` for a pure hash in a rule. The `layer-packages`
  rule reads this table.
- A package states no dependency rule of its own: what one would say (such as "only bridges
  import that package") is a profile row or an Approved Packages row, so the one engine judges
  it (in the backend's package doc, D27, checked by `layer-packages`, replaced D3, a cruiser
  rule; plan 0125).

## Behaviour tags

The primary declaration that carries the tags is the `makeX` factory function, or a port's
type. The profile lists the required tags per block:

| Tag            | Says                                                   | Values                                                                                        |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `@owns`        | the state the block holds                              |                                                                                               |
| `@lifetime`    | how long it lives and who ends it                      | `process`, `request`, `operation`                                                             |
| `@cleanup`     | what releases its resources, and who calls it          |                                                                                               |
| `@concurrency` | the policy for overlapping calls                       | `reject-while-busy`, `serialize`, `latest-wins`, `first-wins`, `dedupe-by-key`, `independent` |
| `@failure`     | what fails, how it surfaces, and what's passed through |                                                                                               |

```ts
/**
 * Creates the process-wide table of open sessions.
 * @param deps - The port that issues session IDs.
 * @returns The sessions state.
 * @owns Open sessions: each one's resolved source and declared open files.
 * @lifetime process — shared by every connection; a session lives as long as its subscription.
 * @cleanup None at shutdown: the open-session flow removes each session when it ends.
 */
export function makeSessionsState(deps: { ids: SessionIdsPort }): SessionsState { … }
```

`tsdoc.json` declares all five tags.

## Specs

Which kind each block gets, and how each is tested (fakes, contract suites, stubbed use
cases, smoke tests), is in [testing.md](testing.md).

## Vitest setup

Specs run on Vitest (constitution [D48](../node-block-architecture.constitution.md#D48)): `node:test` has no tags or task metadata, so its
tests can't carry a kind or a slug and don't count for coverage. Verified with Vitest
4.1.5.

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['libs/**/*.test.ts', 'app/**/*.test.ts'],
    strictTags: true,
    tags: [
      {
        name: 'scenario',
        description: 'A caller-visible scenario with exactly one act.',
      },
      {
        name: 'edge-case',
        description: 'Behaviour at a boundary or under a failure condition.',
      },
      { name: 'invariant', description: 'A rule that holds for all inputs.' },
    ],
    reporters: ['default', ['json', { outputFile: '<path>/unit-tests.json' }]],
  },
});
```

A `vitest-spec-kinds.d.ts` included by the package's `tsconfig.json` types the metadata,
so an unknown tag or a misspelled `meta` key fails the typecheck:

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

Import `describe`, `it` and `expect` from `vitest` explicitly. In ESLint, turn off
`no-unused-labels` for `**/*.test.ts` and `**/*.contract.ts`.

## Checks

Besides the shared checks: the profile's dependency rules, judged by architecture-check
(`reviewer2-check --rule dependencies`, [enforcement.md](enforcement.md)), and `check-block-placement.mjs` from the
architecture-profile skill.
