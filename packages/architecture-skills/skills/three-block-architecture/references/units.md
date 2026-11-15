# Units

A **unit** is a lib that is copied from one lab to another as source, the way shadcn copies a
component: the receiver owns the copy, edits it and is never forced to upgrade it. The rule is
the constitution's **D64**; `lab add` (the `lab` skill) does the copying, `check-units` judges the
lib. This page says when a lib is fit to be one and what travels with it.

## What is a unit

One lib of a package (`libs/<name>/`: its barrel, its blocks, its specs and its lib doc) with a
`unit.json` beside the barrel. A unit is never a package and never a single file:

- a package is too coarse: it brings a host tier, an engine lib and a domain lib the receiver
  does not want;
- a block is too fine: a material is useless without its shader and uniform type, and the lib doc
  (boundaries, owned resources, decisions) has nowhere to go.

Inside one lab a lib is shared by package (product D3 of the lab constitution holds); across labs
copying units is intended duplication.

## When a lib is fit to be a unit

- It does one thing a lesson wants alone (noise, a toon material with its ramp and outline, a
  palette texture, a fixed-step loop). When a lesson wants only a part, split the lib first
  (D60, D61: split when a consumer needs it, not before).
- It imports nothing but itself, other libs of its own package that are units (`~libs/<name>`),
  units of other kits of the same product (`<package>/<lib>`, below), the published runtime
  (an engine package of your own, by package name), `three` and the vendors it
  declares. A non-unit lib, an engine package, a package of another product, a relative path out of
  the lib and a `#` import are not allowed: the receiver has none of them.
- Its lib doc is complete, because it is the only documentation that travels (D48).
- Its specs run in Node (`vitest run`), because a prototype receiver does not run browser specs.
- It states every GPU resource's owner and disposer as always (D17), because the receiver's gate
  checks the copy as it checks its own code.

## `unit.json`

Only what cannot be derived. The files (the lib's tracked files), the units it needs (its
`~libs/<x>` imports) and the block types (the suffixes) are derived, never written down.

```json
{
  "unit": 1,
  "name": "noise",
  "architecture": { "profile": "three-block-architecture", "version": "0.3.3" },
  "role": "render-kit",
  "runtime": { "@acme/engine": "^1.0.0" },
  "peers": { "three": "~0.186.1" },
  "dependencies": { "@dimforge/rapier3d-compat": "0.21.0" },
  "layers": { "@dimforge/rapier3d-compat": ["runtime"] }
}
```

| Field          | Holds                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit`         | The format version, `1`.                                                                                                                                                                                                    |
| `name`         | The lib's folder name.                                                                                                                                                                                                      |
| `architecture` | The profile and the version the lib was written for, a record of the lab it came from. The receiver binds the same profile, and its installed profile is at a compatible version (below 1.0 the same minor, a later patch). |
| `role`         | The lib's role from its lib doc (`domain`, `render-kit`, `runtime`, `engine`, `utility`).                                                                                                                                   |
| `runtime`      | The published runtime packages the lib imports, with the range the receiver depends on.                                                                                                                                     |
| `peers`        | The peer dependencies the lib needs, such as `three`; the receiver should pin the same `three` minor (D4), which the profile's `unit-imports` row declares as `same-minor=three` and `lab add` warns about.                 |
| `dependencies` | The npm vendors the lib imports, with the version it was written against; empty for most units.                                                                                                                             |
| `layers`       | For each vendor, the layers the package doc approves it for (D8), so `lab add` prints the row the receiver pastes into its Approved Packages table.                                                                         |

`runtime`, `peers`, `dependencies` and `layers` may be absent when empty.

## Units of other kits

A **kit** is a package of a product whose libs are all units (`shader-kit`, `render-kit`,
`demo-kit`). A unit may import a unit of another kit of the same product, so a later unit builds on
an earlier one (an SDF part of `demo-kit` on the noise and hash chunks of `shader-kit`) instead of
copying it. The rule is the profile's `unit-imports` row (D64):

- **The form is `<kit package name>/<lib>`**, one unit and nothing inside it:
  `import { snoise } from '@three-demos/shader-kit/noise'`. A kit exposes each unit that another kit
  imports as a subpath export of its own: `"./noise"` in `exports` (`types` and `default` into
  `dist/noise.*`) and a `src/noise.ts` that re-exports the lib's barrel (`export * from
'~libs/noise';`); `pkgroll` builds it as a second entry. The barrel (`@three-demos/shader-kit`)
  and a path inside a unit (`…/noise/src/index`) are findings, because a barrel names no unit and
  the copy would have to guess which ones are meant. No kit has a subpath entry yet, because no unit
  imports across kits yet: the first plan that imports a unit of another kit adds the `exports`
  entry and the `src/<lib>.ts` to the kit it imports from, and `check-units` finds the entry
  missing (`exports['./<lib>']`).
- **Only a kit's units.** A package with a lib that is no unit (an engine, a host) is not a kit; nor
  is a package with a unit whose `unit.json` role is `engine`, so a lesson or an engine package
  can never pass as a kit. The role is declared in the profile's `unit-imports` row
  (`kit=all-libs-units-no-engine`), which `lab check` and `lab add` read. A package of another product is not reachable, and a package never
  imports itself by name (it uses `~libs/<lib>`).
- **No package of the lab in `peers` or `dependencies`.** A unit takes the code of another package
  of the lab only as `<kit>/<lib>` or `~libs/<lib>`; naming such a package in `peers` or
  `dependencies` is a finding, so the declaration cannot hide an engine package or a barrel
  import. `runtime` stays allowed: it names the published runtime, which `lab add` checks.
- **The kits are declared.** The importing package lists the kit in its `dependencies`
  (`workspace:*` inside the product), and kits form no cycles: a kit that depends back on the
  importing package, directly or through other kits, is a finding. A unit's imports of other kits'
  units are derived from its files, not written into `unit.json`; the profile version that states
  the rule is 0.3.2.
- **A name is one unit.** Two units of different kits with one lib name would land in one folder of
  a receiver, so `lab add` refuses the copy; pick lib names that are unique across the kits of a
  product when units are meant to meet.

`check-units` finds the other kits among the package's siblings (`products/<product>/packages/*`);
`lab check` finds them among the lab's packages.

## The runtime contract

The runtime is one package of your own that the units of a lab share (an engine package, published or
linked by `workspace:`): the host contract, the frame loop and the fixed-step loop, controls, the camera rig,
render sizing, the present pipeline with the retro pass, and the shared **effect and surface
contract** (`.kit-model.ts`, D63): the types `Effect` (renders into a target it is given, D28) and
`Surface` (owns a target and exposes a stable `texture`, D29). Units of different kits implement
these types structurally and so compose without knowing each other (R7). A unit imports the runtime
by package name and lists it in `runtime`; it never imports another engine package, because only
the runtime is shared.

Adding a type to the runtime is a version event for every package that depends on it; keep the
runtime small and let anything a lab may want to adjust be a unit.

## What the receiver does

`lab add <source> units/<package>/<lib> --into <package>` copies the lib with the units it imports,
adds the runtime range to the receiver's `package.json`, records the source in `lab.added` and
installs nothing. The units of other kits that the lib needs are copied beside it into the same
`libs/` folder and every import of them in the copied files is rewritten to `~libs/<lib>`
(`@three-demos/shader-kit/noise` becomes `~libs/noise`), so the receiver needs no kit package; the
report lists each rewrite, and the provenance records each unit's own source package. The rewrite
reads import statements as code: the text of a comment, a string or a template literal that only
looks like an import, and a mock (`vi.mock('…')`), is not changed.
It then prints the to-do, which is the receiver's:

1. re-export what the libs offer from `src/kit.ts` (and `src/index.ts` for host-safe parts);
2. add the libs to Boundaries in the package doc and the vendors to Approved Packages;
3. install (`lab add --install`), then run the package's checks and the architecture gate.

The `~libs/*` alias needs no change in a package made from the skeleton (`tsconfig.json` maps
`"~libs/*"` to `"./libs/*/src/index.ts"` by wildcard, and the Vite and Vitest configs alias it);
`lab add` warns when the receiver has no such path.

## The check

`check-units <package-dir>…` (`scripts/check-units.mjs`) runs in the package's `lint`. It reads each
`libs/*/unit.json` and reports a manifest that does not read, a `name` that is not the folder, a
profile other than the package's own or a version the installed profile cannot take (the receiving
side is the `Version` of the profile the repository installs, not a `version` the binding still names;
a frozen package's units are not judged, and the check prints one line for it), a `runtime` entry that is no
dependency of the package, a role that differs from the lib doc, a missing lib doc, an import of a
lib that is no unit or does not exist, an import that leaves the lib, an import of a package no
field declares and no kit of the product explains, a package of the lab named in `peers` or
`dependencies`, an import of a kit that breaks the rules above (including a kit without the
`exports['./<lib>']` entry),
and a vendor the package doc does not approve for the layers named. `lab check`
runs the same judgement over the lab's units, without the lib and package docs.

The check is the `unit-manifest` rule of the profile (the file, its format and its keys are the row's
parameters) and its `unit-imports` rule (the scope of the imports of other kits, and the refusal of cycles). It reads the files Git tracks in a lib, the files `lab add` copies, and never follows a
link (a link in a unit is a finding). The import scan is a fitness check, not a boundary: it reads
import statements and literal `import()` and `require()` calls, and a template-literal `import()` or a
`/*` inside a string can hide one. What bounds a lib is the receiver's gate (the dependency rules).
