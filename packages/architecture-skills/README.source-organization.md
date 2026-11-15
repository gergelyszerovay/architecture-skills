# Architecture source organization

A skill for choosing, applying, and migrating the directory layout of a TypeScript package,
and for the file/declaration policy shared by every layout. Layouts govern file placement and
public surfaces; the declaration policy governs what each file contains. Both are
framework-independent and combine with whatever architectural contracts the project defines.

Start with the [source organization skill](skills/source-organization/SKILL.md), which routes to:

- [Path-depth](skills/source-organization/references/path-depth.md): public modules at library roots, private descendants.
- [Barrel / Nx-like](skills/source-organization/references/barrel.md): one `src/index.ts` per library under `libs/`, private code in `src/lib/`.
- [Fractal-tree](skills/source-organization/references/fractal-tree.md): dependency-derived placement under project rules.
- [Declarations](skills/source-organization/references/declarations.md): primary declarations, explicit companions, naming, and enforcement across layouts.

Layout is selected per package. Read only the selected layout's guide.

See the [block architectures overview](README.md).
