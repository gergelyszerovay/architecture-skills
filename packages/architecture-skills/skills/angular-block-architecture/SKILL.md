---
name: angular-block-architecture
description: Design, implement, or review Angular capability boundaries, building blocks, state ownership, and dependency enforcement. Use for applications adopting this architecture or when explicitly requested; supports path-depth, barrel/Nx-like, and fractal-tree layouts.
---

# Angular block architecture

Capabilities are libraries with public contracts and private interiors, grouped by bounded
context, and composed by one library per place. Inside each, a facade forms the view-model
seam: components render its values and forward intent, while stores, flows, resources and
data access stay below it, and pure domain code stays free of Angular. Files are named by
block suffix, and each suffix has one responsibility; a capability's index is its one public
surface, from which other capabilities import only the blocks the architecture lists.

## Rules

[angular-block-architecture.constitution.md](angular-block-architecture.constitution.md) holds the rules, and it overrides anything else in
this skill. Read its Requirements, then only the decision topics your task touches (the
table below names them); every decision cites how it is checked. The references explain
the decisions and give examples; they don't restate them.

[angular-block-architecture.architecture-profile.md](angular-block-architecture.architecture-profile.md) is the machine-readable form of the checkable rules, for
generating and debugging enforcement. You don't need to read it to write code.

## What to read

Inspect the project first: its instructions, Angular version, registered library roots,
aliases and existing enforcement. Keep the owning package's layout and naming unless the
task is to migrate them.

| Task                                                           | Read                                                                                                                                                                                         | Decision topics                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Understand the seams; library roles, public contracts, facades | [architecture.md](references/architecture.md)                                                                                                                                                | Libraries, View-model seam      |
| Group libraries: contexts, contracts, places, infrastructure   | [architecture.md](references/architecture.md), "Contexts, contracts and places"; the package doc's Contexts table                                                                            | Libraries, View-model seam      |
| Create or change blocks, components, routes                    | [blocks.md](references/blocks.md)                                                                                                                                                            | Blocks, View-model seam         |
| State, loading, operations, subscriptions, combined results    | [state-and-operations.md](references/state-and-operations.md)                                                                                                                                | State and operations            |
| Data access, wire contracts, validation                        | [blocks.md](references/blocks.md), "Data access and pure logic"                                                                                                                              | Data access, Framework boundary |
| Integrate a vendor (query, store, validation library)          | [vendors.md](references/vendors.md)                                                                                                                                                          | Vendors                         |
| Place files, create declarations                               | the architecture-source-organization skill: its declarations reference and the owning package's layout guide                                                                                 | Blocks                          |
| Enforce boundaries                                             | [enforcement.md](references/enforcement.md), [angular-block-architecture.architecture-profile.md](angular-block-architecture.architecture-profile.md)                                        | Enforcement                     |
| ESLint and Prettier                                            | [linting.md](references/linting.md)                                                                                                                                                          | Enforcement, Blocks             |
| Lib docs, TSDoc tags, spec metadata                            | the architecture-docs-and-specs skill, then [documentation-and-testing.md](references/documentation-and-testing.md); citations of declarations and of rows of documents: the citations skill | Documentation, Testing          |
| Set up or write specs (Angular CLI and Vitest)                 | [testing-setup.md](references/testing-setup.md)                                                                                                                                              | Testing                         |

Layout is chosen per package, not per app or library, so packages in one application may
use different layouts; read only the owning package's layout guide.

## Finishing

Verify the behaviour and the boundaries you changed, and report the actual coverage and
any rule left unenforced. Adopt incrementally (constitution [D38](./angular-block-architecture.constitution.md#D38)): no future libraries,
dependencies, migrations or hooks the task doesn't need, and no renaming of unrelated files
to follow a newer version of this skill.
