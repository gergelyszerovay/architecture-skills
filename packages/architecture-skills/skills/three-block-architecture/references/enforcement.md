# Enforcement

How the rules are checked. The profile's Structural rules and Coverage rules tables say which
tool checks each rule today (`Enforced by`); this page says how to run them. The rules are
the constitution's **Enforcement** decisions.

## Binding

A package binds to the profile in its `package.json`:

```json
"architecture": { "profile": "three-block-architecture" }
```

The architecture-profile skill's loader (`load-profile.cjs`) finds the profile through the
installed skill, `.claude/skills/three-block-architecture/`, searched upward from the
package, so the skill must be installed (linked) where the package can find it.

## What checks what

| Rule                                                                                                        | Checked by                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No UI framework in the package, no `three` in the host                                                      | package dependencies (pnpm's strict isolation: a forbidden import doesn't resolve) and `layer-packages`                                                                                                      |
| `file-naming`                                                                                               | `scripts/check-names.mjs <package-dir>…`, in each package's `lint`                                                                                                                                           |
| `entry-excludes-package`                                                                                    | `scripts/check-host-tier.mjs <package-dir>`, in each package's `build`                                                                                                                                       |
| `unit-manifest` (the `unit.json` of a unit, D64)                                                            | `scripts/check-units.mjs <package-dir>…`, in each package's `lint` (the template's has it); `lab check` judges the same in a lab                                                                             |
| `unit-imports` (a unit imports units of other kits of its product, D64)                                     | the same script, and `lab check` in a lab                                                                                                                                                                    |
| `layer-packages`, `block-allow-list`, `library-roles`, `public-entry-only`, `no-testing-in-prod`, `acyclic` | architecture-check (`reviewer2-check --rule dependencies`), which the profile rows name: the repository's architecture gate, not a package script                                                            |
| `tsdoc-tags` (the required tags, and the optional `@requires native-webgpu` where it is present)            | the architecture-profile skill's `check-tsdoc-tags.mjs`, in each package's `lint`                                                                                                                            |
| `no-symbol` (DOM globals)                                                                                   | oxlint's `no-restricted-globals`, from `assets/oxlint-no-symbol.json`, in each package's `lint`                                                                                                              |
| The lib and package docs                                                                                    | `validate-md`, in each package's `lint`                                                                                                                                                                      |
| `spec-structure`, coverage rules                                                                            | planned; review meanwhile                                                                                                                                                                                    |
| Disposal                                                                                                    | specs: dispose twice; a browser spec mounts and disposes five times and the GPU objects stay flat, on both backends of a `webgpu` engine (D66)                                                               |
| Both backends (D66)                                                                                         | the engine's browser specs, run as a `webgpu` and a `webgl2` instance of `vitest.browser.config.ts`; review checks that a `webgpu` engine has both                                                           |
| Generated assets (D68)                                                                                      | the asset pipeline: the Khronos glTF-Validator on every `.glb` it writes (errors fail the build), the group budgets (bytes, triangles, texture memory) and the recipe's own checks, in the package's `build` |

A rule marked `planned` is checked in review until its tool runs (constitution skill,
"Status").

## A package's checks

A product's scripts (the template's, made by `new-package`):

```json
"scripts": {
  "build": "pkgroll --clean-dist && check-host-tier .",
  "lint": "oxlint --deny-warnings --type-aware --type-check src libs && check-names . && check-units . && check-tsdoc-tags . && validate-md layered-docs libs/*/layered-docs"
}
```

A product app builds with `vite build` instead. A prototype (always an app, see
[layout.md](layout.md), "Starting a package") has no build and no docs, so its `lint` is
`oxlint --deny-warnings --type-aware --type-check src libs && check-names . && check-units .`; the tier binds
`"enforcement": "advisory"` in `architecture`.

with `@gergelyszerovay/markdown-schema` (the profile
loader's parser and `validate-md`) and the skills' package `@gergelyszerovay/architecture-skills` (whose bins are
`check-host-tier`, `check-names`, `check-units` and `check-tsdoc-tags`; the architecture-profile skill's
[rules.md](../../architecture-profile/references/rules.md), "Scripts") as devDependencies, and the package's
`tsdoc.json` declaring the profile's tags
([documentation-and-testing.md](documentation-and-testing.md)). `validate-md` finds the two
templates through a `markdown-schema-templates/` folder above the packages that links them
(`three-package`, `three-lib`).

### Dependency rules

No package has a dependency config: the repository's architecture gate runs `reviewer2-check
--rule dependencies` once over every bound package, reading the bound profile's rows, so no
block or layer rule is written by hand. A violation the package keeps is a row of its package
doc's Rule Exceptions (`block-allow-list:system`: `legacy.system`), which turns the finding into
an `info` with the reason.

`library-roles` reads each lib's role from its lib doc, and `layer-packages` adds the package
doc's Approved Packages per layer. An approval names a package, not one of its entries: a
domain lib that may import a shared kit's `three`-free entry approves the whole package, and
the kit's own host-tier check keeps that entry free of `three`.

### DOM globals

The browser globals are mostly read (`window.innerWidth`), not called, so the call-based
`eslint-rules.cjs` of the architecture-profile skill doesn't fit them. oxlint's
`no-restricted-globals` reports reads and calls, scoped by file glob: `scripts/build-oxlint-config.mjs`
builds `assets/oxlint-no-symbol.json` from the profile's `no-symbol` row (one override per
restricted block suffix), and a package's `.oxlintrc.json` extends it, through the skills'
package, after `assets/oxlint-base.json` (the skill's own correctness rules, so a package needs no
config of its workspace):

```json
{
  "extends": [
    "./node_modules/@gergelyszerovay/architecture-skills/skills/three-block-architecture/assets/oxlint-base.json",
    "./node_modules/@gergelyszerovay/architecture-skills/skills/three-block-architecture/assets/oxlint-no-symbol.json"
  ],
  "ignorePatterns": ["**/*.spec.ts", "dist/", "coverage/"]
}
```

This is the template's form; the engine packages of `products/three-demos/` still extend
`products/three-demos/packages/.oxlintrc.json` (its rules are the ones of `oxlint-base.json`)
until their conversion.

`ignorePatterns` is repeated because a config's ignores don't carry over through `extends`.
Rerun the builder after changing the row (`--check` reports a stale asset).

## The scripts

They live in this skill's `scripts/`, need only Node, and read their defaults from the
profile beside them; `build-oxlint-config.mjs` is above.

- **`check-names.mjs <package-dir>…`** walks every lib's `src/lib/` and reports a file without
  a block suffix of the profile, a primary declaration whose kebab-cased name is neither the
  stem nor `<stem>-<suffix>`, and a file that exports more than one function, class or value
  (or, with none, more than one type). Specs and `.d.ts` files are skipped. A package's
  `lint` runs it after the linter:

  ```json
  "lint": "oxlint --deny-warnings --type-aware --type-check src libs && check-names ."
  ```

- **`check-units.mjs <package-dir>…`** judges the `unit.json` of each lib that has one
  ([units.md](units.md)): the manifest, the profile and version of the package's binding, the
  `runtime` entries against its dependencies, the role against the lib doc, the lib doc itself, the
  imports of the lib (its own, the libs of the package that are units, the declared packages, and
  units of other kits of the same product as `<package>/<lib>`, found among the package's siblings
  in `products/<product>/packages/`; the kit must have only units and none of the role `engine`, be
  listed in the package's `dependencies`, not depend back and have an `exports['./<lib>']` entry;
  `peers` and `dependencies` name no package of the lab) and the vendors against the package doc's Approved Packages.
  A package without units passes. The file, its format and its keys are the `unit-manifest` row of
  the profile, the scope of the imports of other kits and the refusal of cycles its `unit-imports`
  row; the script reads both.
  It belongs in the `lint` of every package, after `check-names` (the template has it, so a package
  that later receives a unit from another lab judges it):

  ```json
  "lint": "oxlint --deny-warnings --type-aware --type-check src libs && check-names . && check-units . && check-tsdoc-tags . && validate-md layered-docs libs/*/layered-docs"
  ```

- **`check-host-tier.mjs <package-dir> [--entry <subpath>] [--packages <a,b>]`** reads the
  package's `exports`, finds the entry's built `.d.ts` (`types`), follows its relative imports
  through the built output's shared chunks, and reports any import of an excluded package
  (`three` matches `three/tsl` and `three/addons/…`). The profile's row gives `entry=.` and
  `packages=three`; a shared kit whose host-facing entry is another one passes `--entry`
  (`--entry ./contract`), and a package with an element checks that entry too
  (`check-host-tier . --entry ./element`). It needs the built output, so it runs right after the build:

  ```json
  "build": "pkgroll --clean-dist && check-host-tier ."
  ```

  It doesn't follow imports of other packages: a type re-exported from another package's
  entry that imports `three` goes unreported. Import contract types from such a package's
  `three`-free entry, which the check of that package covers.

Each script has a `node:test` scenario beside it; run them from the skill's folder with
`node --test scripts/*.test.mjs`.

## Exceptions

A violation the package keeps on purpose is a row of its package doc's Rule Exceptions, with
the rule, the files and the reason, which `reviewer2-check` reads (another tool's exception
sits next to it in that tool's own mechanism, such as an `--entry` option). An exemption comment alone never disables
a rule.
