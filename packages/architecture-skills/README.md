# Block architectures

Architecture skills for TypeScript applications, plus a framework-independent guide to
organizing source files and declarations.

Publishing, commands and hooks: [README.tools.md](README.tools.md).

Choose the guide that matches the work:

- [Angular block architecture](README.angular-block-architecture.md) for Angular capability boundaries, state ownership, building blocks, and dependency enforcement.
- [Node block architecture](README.node-block-architecture.md) for Node.js applications using ports and adapters, feature slices, and explicit dependency direction.
- [three.js block architecture](README.three-block-architecture.md) for framework-independent three.js and shader packages: suffix-named rendering and runtime blocks, a plain-data host tier, a three.js kit tier, and declared ownership of GPU resources.
- [Product profile](skills/product-profile/SKILL.md) for a product's group-level documents (brief, domain model, permission matrix, information architecture, use cases) and its end-to-end journeys.
- [Source organization](README.source-organization.md) for choosing package layouts and applying shared file and declaration rules.

Shared foundation skills, used by the architecture skills:

- [Constitution](skills/constitution/SKILL.md) for the short normative core of a skill, product, or package: numbered requirements, non-goals, and decisions.
- [Architecture profile](skills/architecture-profile/SKILL.md) for the machine-readable copy of an architecture's checkable rules, and the scripts that build lint rules from it. Its [grouping reference](skills/architecture-profile/references/grouping.md) explains once the grouping the architectures share (contexts and their map, contract surfaces, places, shared and infrastructure code) and what each maps it to.
- [Layered documentation authoring](skills/layered-documentation-authoring/SKILL.md) and [reading](skills/layered-documentation-reading/SKILL.md) for `layered-docs/` trees and their templates.
- [Planning](skills/planning/SKILL.md) for numbered plans and a roadmap printed on demand, with their templates.
- [Citations](skills/citations/SKILL.md) for citing TypeScript declarations and rows of documents (decisions, requirements, a region's rules) from documentation and TSDoc.
- [Architecture docs and specs](skills/architecture-docs-and-specs/SKILL.md) for the documentation and spec conventions the architectures share: where each fact lives, lib and package docs, behaviour tags, spec kinds and metadata, skeletons and fast-forward coverage.

The documentation skills build on the `markdown-schema` package and its skill, which is a
prerequisite.

Each overview links to its skill and detailed references. The source organization skill
applies across frameworks; use it alongside an application architecture when you need both
architectural boundaries and file placement guidance.

## The package in this repository

The package lives in `packages/architecture-skills/` of this repository, next to `install-skills`. A repository that
uses the skills' scripts declares the package as a devDependency, runs the checkers as its bins (`check-tsdoc-tags`,
`check-block-placement`, `check-names`, `check-host-tier`, and the planning scripts `check-planning`, `plan-history`,
`roadmap`, `promote-plan`, `move-plan`), and requires `@gergelyszerovay/architecture-skills/load-profile.cjs`,
`@gergelyszerovay/architecture-skills/eslint-rules.cjs` and `@gergelyszerovay/architecture-skills/vendor-roots.cjs`.
Here, `@gergelyszerovay/markdown-schema` comes from the registry for `validate-md` (`pnpm install` at the root).

```sh
pnpm install
pnpm test             # the scripts' specs (node --test)
pnpm validate         # validate-md over the folder: the skills' documents and every template's examples
pnpm templates:check  # markdown-schema-templates/ links every template of the skills (templates:sync fixes it)
pnpm check            # the three
```

The repository installs the skills into its `.agents/skills/` with `install-skills --link` (the root's
`pnpm hook:setup`), from the root's `installSkills` list. `install-skills` is the package
[`@gergelyszerovay/install-skills`](../install-skills/README.md), beside this one in the product.

## Package templates

The node and three.js skills ship a package template as an asset, and `new-package` (a bin of this
package, plain Node) instantiates it:

```sh
pnpm exec new-package node packages/hello --name hello --tier prototype --kind app
pnpm exec new-package three packages/demo --name @three-demos/demo --tier product --kind lib
```

A template is parameterized by tier (`prototype`: oxlint, `private`, `"enforcement": "advisory"`, no
docs, no build; `product`: the full lint, build and docs) and kind (`app`, `lib`). It extends only
assets of this package, so a package made from it works outside the repository it came from. The
node template is
[`skills/node-block-architecture/assets/node-package-skeleton/`](skills/node-block-architecture/assets/node-package-skeleton/README.md),
the three.js one
[`skills/three-block-architecture/assets/three-package-skeleton/`](skills/three-block-architecture/assets/three-package-skeleton/README.md);
`new-package` prints what is left to do (the workspace glob, `pnpm install`, the catalog templates
the docs bind to). No instance of a template is committed: `pnpm run test:templates` makes every
variant in a temporary workspace and runs its scripts.

## In another repository

The package is the skills' source of truth outside this repository (inside it, `.claude/skills/`
links the folders directly). It ships the skills with their profiles, templates and scripts, the
bins above. It is
published privately to GitHub Packages as `@gergelyszerovay/architecture-skills`: GitHub Packages
accepts only the owner's scope, and an unscoped name would resolve from the public npm registry,
where anyone could publish a package by that name. A repository maps the scope in its `.npmrc`
(`@gergelyszerovay:registry=https://npm.pkg.github.com`), and the user keeps a classic token with
`read:packages` in `~/.npmrc` (`//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}`).

```sh
pnpm add -D @gergelyszerovay/architecture-skills @gergelyszerovay/install-skills
# add "installSkills": ["@gergelyszerovay/architecture-skills"] to the root package.json (required: the installer installs nothing from a package that is not listed)
pnpm exec install-skills                 # copies the skills of the listed packages into .claude/skills/ and .agents/skills/
pnpm exec install-skills --link          # links them instead, through node_modules/@gergelyszerovay/architecture-skills/skills/
pnpm exec promote-plan planning <slug>   # the planning scripts are bins too
```

`install-skills` is not a bin of this package any more (architecture-skills plan 0001): it is
[`@gergelyszerovay/install-skills`](../install-skills/README.md), which installs the skills of every
package the root `package.json` lists in `installSkills`, this one like any other, and has a `--check`
that reports what a run would change. A repository that took the bin from this package adds the
installer (`pnpm add -D @gergelyszerovay/install-skills`; in a lab, `lab update` adds it). Its README holds the
rules: the list, the layout (`.claude/skills` as a link to `../.agents/skills` in a lab), the record
and the generated `.gitignore`, and why copies are the default. The documentation skills need
`@gergelyszerovay/markdown-schema` (`validate-md`) in the same repository; its own skill
ships in that package. The release steps are in [README.tools.md](README.tools.md).
