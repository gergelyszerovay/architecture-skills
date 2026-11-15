# Layout

The default is the barrel (Nx-like) layout from the architecture-source-organization
skill: libraries in `libs/` at the package root (the repository root when there are no
workspace packages), each with a `src/index.ts` public entry and all other source under
`src/lib/`. The file/declaration policy comes from
the same skill (see [declarations.md](declarations.md)).

## Feature libraries (default)

Each feature is a library directly under `libs/`, or under its context's directory once the
package groups its features by bounded context (`libs/<context>/<feature>`, constitution [D52](../node-block-architecture.constitution.md#D52);
see [Contexts](#contexts)). Its `src/lib/core/` folder holds everything
inside its hexagon: domain ring, primary ports (use cases), and secondary ports. The two
adapter folders hold everything outside, one per side.

```
libs/
  <feature>/
    src/
      index.ts            # public entry: primary ports, composition-facing exports
      testing.ts          # test-only entry: fakes, fixtures, contract suites
      lib/
        core/             # .model .rules .policy .error .events .use-case .flow .step .port .input .result
                          # .dto (in a contract package)
        adapters-driving/ # .route .procedure .router .resolver .socket .handler
                          # .tool .resource .prompt .cli .consumer .job .format .schema .mapper
        adapters-driven/  # .repository .gateway .publisher .mapper .wire
        testing/          # .fake .fixture .contract  (tests may also sit beside their subject)
  shared/                 # grouping directory, no source files
    <name>/
      src/
        index.ts
        lib/
          core/
          adapters-driving/
          adapters-driven/
app/
  <app>.composition.ts
  <app>.config.ts
  <a>-<b>.bridge.ts       # implements A's port by calling B's (or another package's) public use cases; no I/O
  <binary>.main.ts        # one per bin entry: http, cli, mcp, worker
```

`libs/shared/` is a grouping directory, so no feature is named `shared`. Each
library under it is a small shared kernel with its own public entry; it never imports
features. Create only the folders a library needs. Group use cases in their own folders
(`src/lib/core/get-dir-tree/`) once a feature has several, keeping input, use case, steps, and
test together. A large feature may group those folders by area (`src/lib/core/<area>/`), each
area listed in the lib doc's Areas table (D58); an area is not a library and has no entry.

`app/` is not a library: it holds composition, bridges, config, and binaries, and
imports libraries only through their public aliases (`#libs/<feature>`,
`#libs/shared/<name>`, `#libs/<context>/<feature>`). Nothing under `libs/` imports `app/`.

## Contexts

A package with several features groups them by bounded context (constitution [D52](../node-block-architecture.constitution.md#D52)), one
directory per context and one level deep:

```
libs/
  <context>/              # grouping directory, no source files; a row of the Contexts table
    <feature>/            # a feature library, as above
    shared/               # or shared-<name>/: a shared library only this context's features use
  shared/                 # shared libraries two or more contexts use
    <name>/
```

The package doc's Contexts table names, per context, the contexts it may depend on; the
`context-access` rule reads it, and a bridge in `app/` connects two contexts' features only
where it allows (D53). A library's role still follows from its path (D7): `shared/<name>`,
`<context>/shared` and `<context>/shared-<name>` are shared libraries, every other library is
a feature. A flat `libs/` is one implicit context; group when the features' graph needs it.
The architecture-profile skill's [grouping reference](../../architecture-profile/references/grouping.md)
explains the grouping every block architecture shares.

## Public entries

A library's `src/index.ts` contains named re-exports only. A feature exports its primary
ports and what composition needs to build it: use-case factories and types, the
secondary-port types composition implements in bridges, the driven adapters composition
instantiates, and the registration surface of its driving adapters (router factories,
`registerXTool` functions, command factories). Everything else stays private.

A library with testing blocks that other libraries' or `app/` tests need also has a
test-only entry, `src/testing.ts`: named re-exports of its fakes, fixtures and contract
suites (constitution [D46](../node-block-architecture.constitution.md#D46)). Only test files import it.

Same-library imports are relative. A package.json `imports` pattern that resolves only to
the entries (`"#libs/*": "./libs/*/src/index.ts"` and `"#libs/*/testing": "./libs/*/src/testing.ts"`)
makes a deep import fail at resolution time; see [setup.md](setup.md).

## One feature minimum

Even a small tool with one capability has one feature library, `libs/main/` or named after
the capability. Add features beside it when a second capability arrives.

## Large features

There are no sub-features and no nested libraries. When a feature grows past the split
signals in [architecture.md](architecture.md), split it into sibling features in its
context (in a flat `libs/`, a common prefix such as `orders-checkout` and `orders-returns`
keeps them adjacent; with contexts, they share the context directory). Code both need, and
that owns no records, moves to a shared library: the context's `shared` or `shared-<name>`
library, or `libs/shared/<name>/` when another context needs it too; everything else follows
the collaboration rules between features.

## Monorepos

In Nx, Turborepo, or pnpm workspaces, each package has its own `libs/` and `app/` at its
root. Tag libraries by role and feature and enforce tags (see
[enforcement.md](enforcement.md)). Framework-specific integration packages
(`<name>-nestjs`, `<name>-fastify`) depend on the package holding the hexagon, never the
reverse.

## Binaries

Each binary has its own `.main.ts` and `bin` entry in `package.json`. Binaries share the
composition root; if they need different adapters (a CLI using a local cache, a server
using Redis), pass options to the composition function rather than duplicating it.

## Migration

Inventory public contracts before moving files. Move by feature, one at a time, updating
imports, aliases, and enforcement together. Do not perform a repository-wide rename as an
implicit part of an unrelated task.
