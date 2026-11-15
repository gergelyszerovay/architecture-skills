---
name: node-block-architecture
description: Design, implement, or review Node.js/TypeScript servers, CLIs, MCP servers, workers, serverless functions and libraries as hexagons of feature libraries with suffix-named blocks (.use-case.ts, .port.ts, .gateway.ts, .tool.ts, …). Use when creating or restructuring a Node app, adding a feature or entry point, deciding where code lives, or enforcing dependency boundaries.
---

# Node block architecture

An application is a hexagon of feature libraries. Driving adapters (routes, commands,
tools, consumers) call use cases; use cases reach the outside world only through ports,
which driven adapters implement; a composition root wires them. Files are named by block
suffix, and each suffix fixes a layer and a folder.

## Rules

[node-block-architecture.constitution.md](node-block-architecture.constitution.md) holds the rules, and it overrides anything else in
this skill. Read its Requirements, then only the decision topics your task touches (the
table below names them); every decision cites how it is checked. The references explain
the decisions and give examples; they don't restate them.

[node-block-architecture.architecture-profile.md](node-block-architecture.architecture-profile.md) is the machine-readable form of the checkable rules, for
generating and debugging enforcement. You don't need to read it to write code.

## What to read

Inspect the project first: its instructions, runtime (Node version, ESM or CJS),
framework host, layout, aliases and existing enforcement. Keep an existing layout and
naming unless the task is to migrate them.

| Task                                                                             | Read                                                                                                                                                                                             | Decision topics        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| Understand the architecture, whether it fits                                     | [architecture.md](references/architecture.md), "The hexagon"                                                                                                                                     | Hexagon                |
| Find, split or merge features; features that collaborate; group them by context  | [architecture.md](references/architecture.md); [layout.md](references/layout.md), "Contexts"; the package doc's Contexts table                                                                   | Features               |
| Create or change blocks                                                          | [blocks.md](references/blocks.md), [declarations.md](references/declarations.md)                                                                                                                 | Blocks, Hexagon        |
| Place files, set up folders                                                      | [layout.md](references/layout.md)                                                                                                                                                                | Blocks                 |
| Start a project; modules, aliases, building; pick a library                      | `new-package node <dir> …` ([setup.md](references/setup.md), "Starting a package"), then [setup.md](references/setup.md) (with the default stack)                                                | Adoption               |
| Add an entry point                                                               | [entry-points.md](references/entry-points.md), then only the one `entry-<transport>.md`                                                                                                          | Driving adapters       |
| Lifetimes, cancellation, concurrency, transactions, errors, logging              | [operations.md](references/operations.md)                                                                                                                                                        | Operations             |
| Wire adapters; a framework host (NestJS, Fastify, Hono, Express) or DI container | [frameworks.md](references/frameworks.md)                                                                                                                                                        | Composition            |
| Public contracts and their evolution                                             | [architecture.md](references/architecture.md), "Public contracts"                                                                                                                                | Contracts              |
| Enforce boundaries                                                               | [enforcement.md](references/enforcement.md), [node-block-architecture.architecture-profile.md](node-block-architecture.architecture-profile.md)                                                  | Enforcement            |
| ESLint and Prettier                                                              | [linting.md](references/linting.md)                                                                                                                                                              | Blocks                 |
| Lib and package docs, TSDoc tags, spec metadata                                  | the architecture-docs-and-specs skill, then [documentation-and-testing.md](references/documentation-and-testing.md); citations of declarations and of rows of documents: the citations skill     | Documentation, Testing |
| Write or plan tests                                                              | [testing.md](references/testing.md), the architecture-docs-and-specs skill                                                                                                                       | Testing                |
| See it worked out                                                                | [examples.md](references/examples.md); runnable code in `assets/reference-repo` (read files as needed, don't copy it wholesale; a new package starts from `assets/node-package-skeleton`, below) | —                      |

Source files also follow the architecture-source-organization skill (declarations and
the barrel layout); this skill's additions are in the references above.

## Finishing

Verify behaviour and boundaries as [testing.md](references/testing.md) describes, and
report the actual coverage and any rule left unenforced.

Start small and adopt incrementally (constitution [D49](./node-block-architecture.constitution.md#D49), [D50](./node-block-architecture.constitution.md#D50)): no empty features, no
dependencies or migrations the task doesn't need, and no blocks before a second
consumer, transport or coordination problem calls for them.
