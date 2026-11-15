# architecture-skills

Agent skills for TypeScript repositories: block architectures for Node, Angular and three.js, machine-readable architecture profiles, layered documentation, planning, changelogs and citations, with the scripts that check them.

Two npm packages live here:

| Package                                | What it is                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@gergelyszerovay/architecture-skills` | The skills and the scripts they run (`check-planning`, `check-changelogs`, `new-package`, lint rules, ...).    |
| `@gergelyszerovay/install-skills`      | Copies (or links) the skills of the packages you list into `.agents/skills/` and `.claude/skills/` for agents. |

Agents do not scan `node_modules`, so the skills must be installed into a folder they read. That is the job of `install-skills`.

## Install

```sh
pnpm add -D @gergelyszerovay/install-skills @gergelyszerovay/architecture-skills
```

List the packages whose skills you want in the root `package.json`. The list is yours to change: a new dependency cannot add agent instructions unseen.

```json
{
  "installSkills": ["@gergelyszerovay/architecture-skills"]
}
```

```sh
pnpm exec install-skills          # copy the skills into .agents/skills/ and .claude/skills/
pnpm exec install-skills --link   # or link them through node_modules
pnpm exec install-skills --check  # report what a run would change; writes nothing
```

Commit the installed skills (or add the command to your `prepare` script), then ask your agent for the work a skill covers; it loads the skill by its description. The documentation skills build on [`@gergelyszerovay/markdown-schema`](https://www.npmjs.com/package/@gergelyszerovay/markdown-schema) (`validate-md`), which you add the same way.

The skills' checkers are bins of `@gergelyszerovay/architecture-skills`; run them with `pnpm exec`, for example `pnpm exec check-planning` or `pnpm exec check-changelogs`. All options of the installer are in [packages/install-skills/README.md](packages/install-skills/README.md); an overview of the skills, the bins and the package templates is in [packages/architecture-skills/README.md](packages/architecture-skills/README.md).

## The skills

| Skill                                                                                                           | What it is for                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [node-block-architecture](packages/architecture-skills/skills/node-block-architecture/SKILL.md)                 | Node.js servers, CLIs, MCP servers and libraries as hexagons of feature libraries with suffix-named blocks.      |
| [angular-block-architecture](packages/architecture-skills/skills/angular-block-architecture/SKILL.md)           | Angular capability boundaries, building blocks, state ownership and dependency enforcement.                      |
| [three-block-architecture](packages/architecture-skills/skills/three-block-architecture/SKILL.md)               | Framework-independent three.js and shader packages: a plain-data host tier and a three.js kit tier.              |
| [source-organization](packages/architecture-skills/skills/source-organization/SKILL.md)                         | Directory layout of a TypeScript package (path-depth, barrel, fractal tree) and the file and declaration policy. |
| [architecture-profile](packages/architecture-skills/skills/architecture-profile/SKILL.md)                       | The machine-readable copy of an architecture's checkable rules, bound to lint and checker configuration.         |
| [architecture-docs-and-specs](packages/architecture-skills/skills/architecture-docs-and-specs/SKILL.md)         | Which fact goes in code, TSDoc, a layered doc or a spec; lib and package docs, behaviour tags, spec kinds.       |
| [constitution](packages/architecture-skills/skills/constitution/SKILL.md)                                       | The short normative core of a skill, product or package: numbered requirements, non-goals and decisions.         |
| [product-profile](packages/architecture-skills/skills/product-profile/SKILL.md)                                 | A product's group-level documents (brief, domain model, permissions, use cases) and its end-to-end journeys.     |
| [layered-documentation-authoring](packages/architecture-skills/skills/layered-documentation-authoring/SKILL.md) | Adding, splitting and validating files in a `layered-docs/` tree and binding them to templates.                  |
| [layered-documentation-reading](packages/architecture-skills/skills/layered-documentation-reading/SKILL.md)     | Navigating a `layered-docs/` tree: which index to open and how much context to load.                             |
| [planning](packages/architecture-skills/skills/planning/SKILL.md)                                               | Numbered plans, their implementation notes and reviews, and a roadmap printed from them.                         |
| [changelog](packages/architecture-skills/skills/changelog/SKILL.md)                                             | Writing, releasing and checking a changelog for every published package and skill.                               |
| [citations](packages/architecture-skills/skills/citations/SKILL.md)                                             | Citing TypeScript declarations and rows of documents (decisions, requirements) from docs and TSDoc.              |

## Repository layout

| Path                                     | What it holds                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/architecture-skills/`          | The skills (`skills/`), their scripts (`scripts/`) and the template catalog.              |
| `packages/architecture-skills/README.md` | Overview of the architectures, the foundation skills, the bins and the package templates. |
| `packages/install-skills/`               | The `install-skills` command (plain Node, no dependencies) and its tests.                 |
| `layered-docs/`                          | The group-level documents of the skills ([index](layered-docs/0.index.md)).               |
| `CHANGELOG.md`                           | The changelog of the release group, one version for both packages.                        |

Both packages are released together, under one version.

## About this repository

This repository is a read-only copy of the `architecture-skills` part of a private repository, made at each release. It holds the source of the version 0.8.2.

| Package | Version | Folder |
| ------- | ------- | ------ |
| `@gergelyszerovay/install-skills` | 0.8.2 | `packages/install-skills` |
| `@gergelyszerovay/architecture-skills` | 0.8.2 | `packages/architecture-skills` |

The packages are published to npm from the maintainer's machine, from the tagged commit `v<version>` of this repository.

This repository has no lockfile: a lockfile made by the private repository would name its private registry. Install with `pnpm install`; the packages of this repository link to each other as a workspace.

- [CHANGELOG.md](CHANGELOG.md): what changed in each release
- [CONTRIBUTING.md](CONTRIBUTING.md): issues only; pull requests are not accepted
- [LICENSE](LICENSE)
