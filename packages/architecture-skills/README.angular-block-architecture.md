# Angular block architecture

A skill for Angular capability boundaries, state ownership, building blocks, and
dependency enforcement.

Start with [the Angular block architecture skill](skills/angular-block-architecture/SKILL.md), which routes to:

- [Constitution](skills/angular-block-architecture/angular-block-architecture.constitution.md): requirements and decisions.
- [Profile](skills/angular-block-architecture/angular-block-architecture.architecture-profile.md): the checkable rules, read by lint and checkers.

- [Architecture](skills/angular-block-architecture/references/architecture.md): library roles and public contracts.
- [Blocks](skills/angular-block-architecture/references/blocks.md): rendering, state, commands, APIs, and pure logic.
- [State and operations](skills/angular-block-architecture/references/state-and-operations.md): lifetimes and consistency.
- [Vendors](skills/angular-block-architecture/references/vendors.md): containment and integration.
- [Enforcement](skills/angular-block-architecture/references/enforcement.md): coverage, pitfalls, and verification.
- [Linting](skills/angular-block-architecture/references/linting.md): ESLint and Prettier setup and rules.
- [Documentation and testing](skills/angular-block-architecture/references/documentation-and-testing.md): lib and package docs, TSDoc tags, spec kinds, and coverage.
- [Testing setup](skills/angular-block-architecture/references/testing-setup.md): spec tags, metadata, and Angular CLI with Vitest.

Libraries encapsulate capabilities even with one consumer, grouped by bounded context, with
one index, of which other capabilities import only the listed blocks and the place that composes them the rest. A screen may
compose multiple facades while each component consumes at most one. Stores own state, flows own processes,
and provider scope determines lifetime. Domain dependencies are explicit, acyclic, and pure.

Architectural invariants are distinguished from implementation conventions. Load detailed
references only when relevant to the task. Directory layouts (path-depth, barrel/Nx-like,
fractal-tree) and the file/declaration policy live in the separate
[`source-organization` skill](skills/source-organization/SKILL.md).

See the [block architectures overview](README.md).
