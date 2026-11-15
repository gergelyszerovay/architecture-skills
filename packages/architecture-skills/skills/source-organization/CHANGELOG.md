# Changelog: architecture-source-organization

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

## 0.1.1

### Changed

- **Schema/type checks are type-only.** `references/declarations.md` writes the two compatibility checks of a
  schema/type pair as `_`-prefixed type aliases whose default must satisfy their constraint
  (`type _XExhaustive<T extends X = z.infer<typeof XSchema>> = T`), not as `const` assignments marked used with
  `void _x;`, which typescript-eslint 8.71's `no-meaningless-void-operator` rejects. Rewrite existing checks the same way.

## 0.1.0

### Added

- **The skill.** The directory layout of a TypeScript package (path-depth, barrel/Nx-like or fractal-tree), its public surfaces and private placement, and the file and declaration policy (one primary declaration per file with explicit exceptions, or a strict single-declaration profile).
- **Contract entry and context grouping.**
  - `references/barrel.md`: a library may have a second, narrower entry `src/contract.ts`
    (`#libs/<lib>/contract`) when its architecture defines one, and grouping directories may
    be one level deep (`libs/<context>/<lib>`).
- **File name derived 1:1 from the declaration name.**
  - `references/declarations.md` gains **File name from declaration name**: the file stem is
    the kebab-cased primary declaration; when that name ends with the block's suffix word, the
    word becomes the file suffix and leaves the stem (`flight.controller.ts` ↔
    `FlightController`, `create-voxel.engine.ts` ↔ `createVoxelEngine`); otherwise the whole
    name is the stem and the suffix is appended (`apply-voxel-params.rules.ts` ↔
    `applyVoxelParams`). Verb prefixes stay in the stem; an architecture may document one
    factory prefix its file names omit.
  - In a block architecture every implementation file carries a suffix; product-independent
    helpers take the architecture's helper suffix (`.util.ts`) instead of going unsuffixed, so the
    file-suffix classifier and the naming check cover every file. The bare-stem case applies only
    to packages without a block architecture.
  - `SKILL.md` names the rule next to the declaration policy.

### Changed

- **One barrel per library.**
  - `references/barrel.md`: the paragraph on a second, narrower contract entry
    (`src/contract.ts`, `#libs/<lib>/contract`) goes; an architecture that offers some importers
    less than the whole barrel states it as a rule over the barrel's exports, judged by the
    declaration imported. One-level grouping directories stay.
  - `references/barrel.md`: the bundling paragraph says a single barrel relies on the package's
    `sideEffects` field to drop its unused exports, and an ESLint rule refusing imports with no
    bindings keeps the field safe.
- **Private helper functions beside the primary declaration.**
  - `references/declarations.md`, primary profile: every implementation file exports exactly
    one declaration (except a coupled pair, a supporting co-export, and two mutually recursive
    functions that both have external callers), and unexported types, constants, enums and
    functions used only in that file are supporting declarations. A function file may keep its
    private helper functions; a private class still gets its own file, and so does a companion
    type another file needs. The strict profile is unchanged.
