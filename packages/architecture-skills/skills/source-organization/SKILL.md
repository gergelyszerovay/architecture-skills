---
name: architecture-source-organization
description: Choose, apply, or migrate the directory layout of a TypeScript package — path-depth, barrel/Nx-like, or fractal-tree — including public surfaces, private placement, and the file/declaration policy (one primary declaration per file with explicit exceptions, or a strict single-declaration profile). Use when creating, splitting, placing, moving, or exposing source files in a package with a selected layout, when choosing a layout for a new package, or when explicitly requested.
metadata:
  version: '0.1.1'
---

# Architecture source organization

A layout decides where files live inside a TypeScript package's libraries and which of them
form each library's public surface. It does not define what the code does; any
architectural contracts (responsibilities, dependency rules) apply equally in every layout.
Preserve the explicit choice of the owning package; read only its selected layout guide.

Every layout shares one file/declaration policy: one primary declaration per implementation
file, with only the explicit supporting cases (primary profile), or exactly one declaration
per file with no supporting cases (strict profile). The owning package's architecture skill
or project instructions select the profile. Every layout also shares one naming rule: the
file stem is derived from the primary declaration's name, with a block suffix that is the
declaration's last word taken out of the stem, so file and declaration map 1:1. For source
file creation, splitting, naming, or declaration changes, read
[declarations.md](references/declarations.md). Layout guides decide where each resulting
file lives and whether it is public.

| Layout           | Public surface                                           | Private placement            | Guide                                      |
| ---------------- | -------------------------------------------------------- | ---------------------------- | ------------------------------------------ |
| Path-depth       | Modules at registered library roots                      | Author-selected directories  | [Path-depth](references/path-depth.md)     |
| Barrel / Nx-like | Named exports in each library's src/index.ts under libs/ | The library's src/lib/       | [Barrel](references/barrel.md)             |
| Fractal-tree     | Configured declarations under project rules              | Dependency-derived placement | [Fractal-tree](references/fractal-tree.md) |

Select one layout for authored code per package, not per app or individual library.
Different packages in the same application or repository may use different layouts.
Generated/vendor roots can retain their required conventions and must be registered
separately. Grouping directories are not libraries. Generated files do not establish the
package's authored-code layout.

Inspect project instructions, configuration, registered roots, aliases, and source together.
A random index.ts or a generated library's barrel does not determine the owning package's
layout. Interpret fractal-tree configuration according to installed tooling; not every
configured package has libraries.

For a new package without a preference, path-depth is lightweight. Barrel gives a compact
explicit API and stable imports. Fractal-tree supports dependency-derived placement when
compatible tooling and project rules exist.

## Migration

Inventory intended exports before moving files. Update callers, aliases, dependency
wiring, compiler/test inputs, and docs together within the authorized scope.

Do not publish every root file automatically when introducing barrels. Do not assume
deleting fractal configuration produces valid path-depth visibility. Preserve intended
contracts explicitly. A broader repository migration must be part of the requested task.
