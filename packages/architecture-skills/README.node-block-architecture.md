# Node block architecture

A skill for Node.js/TypeScript applications built as hexagons (ports and adapters): use
cases as primary ports, owned secondary ports, driving and driven adapters, and a
composition root, plus suffix-based building blocks, feature slices, and enforced
dependency direction.

Start with [the Node block architecture skill](skills/node-block-architecture/SKILL.md), which routes to:

- [Constitution](skills/node-block-architecture/node-block-architecture.constitution.md): requirements and decisions, the normative core.
- [Profile](skills/node-block-architecture/node-block-architecture.architecture-profile.md): the checkable rules, read by lint configs and checkers.
- [Documentation and testing](skills/node-block-architecture/references/documentation-and-testing.md): lib and package docs, TSDoc tags, spec kinds, Vitest setup.
- [Architecture](skills/node-block-architecture/references/architecture.md): roles, features grouped by bounded context, and public contracts.
- [Blocks](skills/node-block-architecture/references/blocks.md): domain, application, driven, driving, composition, testing.
- [Declarations](skills/node-block-architecture/references/declarations.md): additions to the source-organization declaration policy, naming.
- [Entry points](skills/node-block-architecture/references/entry-points.md): HTTP, CLI, MCP, consumers, jobs; outcome mapping.
- [Operations](skills/node-block-architecture/references/operations.md): lifetimes, shutdown, concurrency, transactions, failures.
- [Layout](skills/node-block-architecture/references/layout.md): `libs/` feature libraries (Nx-like barrels), context directories, `adapters-driving/`/`adapters-driven/`, monorepos, binaries.
- [Frameworks](skills/node-block-architecture/references/frameworks.md): NestJS, Fastify, Hono, Express as adapter hosts.
- [Enforcement](skills/node-block-architecture/references/enforcement.md): architecture-check (`reviewer2-check`) and Nx rules, verification.
- [Linting](skills/node-block-architecture/references/linting.md): ESLint (typescript-eslint, n, jsdoc, tsdoc, import/export rules) and standalone Prettier, configs and scripts.
- [Example](skills/node-block-architecture/references/examples.md): a CLI and MCP server sharing two features.
- [Package template](skills/node-block-architecture/assets/node-package-skeleton/README.md): `new-package node`, by tier (prototype, product) and kind (app, lib), with one feature library, its specs and the tooling.

See the [block architectures overview](README.md).
