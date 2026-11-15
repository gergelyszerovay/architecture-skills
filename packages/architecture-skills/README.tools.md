# architecture-skills: tools

Publishing and commands of `@gergelyszerovay/architecture-skills`, one of the two packages of this repository. Commands
run from the repository root as `pnpm --filter @gergelyszerovay/architecture-skills …` or through Turbo.

## Publishable packages

The repository has two packages, released together as the group `architecture-skills`: this one and
[`@gergelyszerovay/install-skills`](../install-skills/README.md) (the `install-skills` command).

| Order | Package                                | Version | Folder                         | Registry                                          | Ships                                                                                                                                                                                                                                                                                                                      |
| ----- | -------------------------------------- | ------- | ------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `@gergelyszerovay/install-skills`      | 0.8.2   | `packages/install-skills`      | GitHub Packages (`publishConfig.registry` is set) | the `install-skills` command: `bin`, README, CHANGELOG (published as is, no build)                                                                                                                                                                                                                                         |
| 2     | `@gergelyszerovay/architecture-skills` | 0.8.2   | `packages/architecture-skills` | GitHub Packages (`publishConfig.registry` is set) | `skills/`, `scripts/new-package.mjs`, `README*.md`, `CHANGELOG*.md` (no `*.test.mjs`); bins `new-package`, `check-tsdoc-tags`, `check-block-placement`, `check-host-tier`, `check-names`, `check-units`, `check-planning`, `plan-history`, `roadmap`, `promote-plan`, `move-plan`, `check-changelogs`, `release-changelog` |

Neither package is private.

## How to publish

The maintainer releases both packages from the private source repository with its release tooling: the versions and
changelogs are bumped there, the packages are published to GitHub Packages, and the public copy of the repository is
staged, reviewed and pushed; the public repository's workflow publishes to npm after the maintainer approves it.

- **Order**: `@gergelyszerovay/markdown-schema` is a devDependency of this repository, and this repository's package is a
  devDependency of markdown-schema: a change that needs both is two releases, markdown-schema first.
- **Checks**: `pnpm check` (specs, `validate-md` over the skills, `templates:check`, and `test:templates`: `new-package`
  makes every variant of both package templates in a temporary workspace outside the repository, installs it and runs every
  script the variant declares; `test:browser` runs only when Chromium is found).
- **Build and `prepack`**: nothing builds; the package ships sources. `prepack` generates the `*.refine.js` files and
  `postpack` removes them. The catalog `markdown-schema-templates/` is not shipped (it holds only symbolic links).
- **Check the tarball**: `pnpm --filter @gergelyszerovay/architecture-skills pack --dry-run` lists the files.
- **Use it elsewhere**: `pnpm add -D @gergelyszerovay/architecture-skills`, then
  `pnpm add -D @gergelyszerovay/install-skills` and `pnpm exec install-skills` (copies the skills of the packages the root
  `package.json`'s `installSkills` list names into `.claude/skills/` and `.agents/skills/`; `--link` links them; `--check`
  reports what a run would change), and `pnpm exec new-package` to make a package from a template.

## Commands

```sh
pnpm install
pnpm setup-hooks      # once per clone: git config core.hooksPath .githooks
```

| Task             | Command                                                              | Covers                                                                                       |
| ---------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Test             | `pnpm --filter @gergelyszerovay/architecture-skills test`            | `node --test` over `scripts/*.test.mjs`, the skills' `scripts/*.test.mjs` and template specs |
| Validate         | `pnpm --filter @gergelyszerovay/architecture-skills validate`        | `validate-md .` over the skills' documents                                                   |
| Templates: check | `pnpm --filter @gergelyszerovay/architecture-skills templates:check` | the template catalog `markdown-schema-templates/` matches the skills' templates              |
| Templates: sync  | `pnpm --filter @gergelyszerovay/architecture-skills templates:sync`  | regenerates the catalog                                                                      |
| All checks       | `pnpm check`                                                         | build, typecheck, lint, test, validate, templates, changelogs, publint, format               |
| Format           | `pnpm format:check` / `pnpm format`                                  | the root's Prettier                                                                          |

`devEngines.runtime` (`onFail: "error"`) makes pnpm stop with `ERR_PNPM_BAD_RUNTIME_VERSION` unless Node is 24.21.0.

## Git hook

`core.hooksPath` is `.githooks`; its `pre-commit` runs the root's `hook:pre-commit`: lint-staged formats the staged files
with Prettier and runs `validate-md` on the staged Markdown (a file staged in part stops the commit), then Turbo runs the
tests, `validate`, `templates:check` and `check:changelogs` over the packages that differ from `HEAD`.
