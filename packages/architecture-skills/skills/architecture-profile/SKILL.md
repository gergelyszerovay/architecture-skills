---
name: architecture-profile
description: Read, write, bind, or override an architecture profile — the machine-readable, normative copy of the checkable rules of an architecture or of a product's end-to-end package (block types, layers, library roles, allowed dependencies, required TSDoc tags, spec kinds, coverage). Use when adding or changing a checkable rule, wiring a lint or checker config to a profile, binding a package to a profile, or explaining which rule a violation breaks.
metadata:
  version: '0.3.1'
---

# Architecture profile

An architecture skill states its rules in prose (references) and its normative core in a
constitution. The **profile** is the only machine-readable copy of the rules tools can
check. Lint configs, checkers, documentation generators and review tools read it instead
of hard-coding their own copies, which would drift apart.

Every profile row cites the constitution decision it implements, so a violation can name
both the rule and the decision it breaks.

## Where profiles live

- A skill's profile is `<skill>.architecture-profile.md` next to its `SKILL.md` and its
  `<skill>.constitution.md`; the names make both bind to their templates like any document.
- The format isn't limited to package architectures. Any skill whose rules apply to a kind
  of package can ship one:

  | Profile                      | Governs                                                      |
  | ---------------------------- | ------------------------------------------------------------ |
  | `angular-block-architecture` | Angular application packages                                 |
  | `node-block-architecture`    | Node.js packages                                             |
  | `three-block-architecture`   | three.js and shader packages                                 |
  | `product-profile`            | a group's end-to-end package (page objects, seeds, journeys) |

- A package binds to one profile in its `package.json`:

  ```json
  "architecture": { "profile": "angular-block-architecture" }
  ```

  The binding names no version: the package is checked against the profile the repository installs
  (**Versioning**, below), and a `version` an older binding still names is ignored. Tools find the profile through the installed skill (`.claude/skills/<profile>/<profile>.architecture-profile.md`,
  searched from the package upward; `profile.md` is read for skills installed from older versions). A package without the field is shown but not checked.

- **Setup in another repository.** The skills, their profiles, templates and scripts ship as the
  skills package (the repository's `packages/architecture-skills/`, published to GitHub Packages as
  `@gergelyszerovay/architecture-skills`: map the scope in `.npmrc`, `@gergelyszerovay:registry=https://npm.pkg.github.com`,
  and keep a token with `read:packages` in `~/.npmrc`). Install it with
  `pnpm add -D @gergelyszerovay/architecture-skills @gergelyszerovay/install-skills` and run `install-skills` (the second package's command), which copies each skill into `.claude/skills/` and `.agents/skills/`
  (run it again after an upgrade); it installs the skills of the packages the root `package.json` lists in its required
  `installSkills` array (each also declared in `dependencies` or `devDependencies`, and exporting `./skills/*`), not only this one's:
  add `"installSkills": ["@gergelyszerovay/architecture-skills"]` first, or it installs nothing and exits 1. `--link` links them instead, but then documents bound to the
  skills' templates stay unbound: `validate-md` reads no template through a symbolic link on the
  way (it warns of the link), and Node strips no types from a `*.refine.ts` under
  `node_modules`. `reviewer2-check` also reads a profile from
  `node_modules/@gergelyszerovay/architecture-skills/skills/` when no skill is installed; `load-profile.cjs` and
  the checkers read only the installed skill.

- An optional `"coverage"` field in the binding sets what satisfies coverage rules:
  `"implemented"` (the default) counts only implemented specs; `"specified"`
  (fast-forward) also counts todo specs with complete metadata, and coverage reports list
  each one as debt. Switching back to `"implemented"` turns every remaining todo into a
  coverage failure.
- An optional `"enforcement"` field sets what `reviewer2-check` does with the package's
  findings: `"gate"` (the default) leaves them as they are; `"advisory"` reports each as an
  `info` marked `advisory` with the severity it has under `gate`, and none of them fails the
  check. Any other value is rejected by `load-profile.cjs`, so `lint:tsdoc` and `lint:placement`
  fail on a typo, while `reviewer2-check` reads every other value as `gate`. The lint scripts
  report the same either way.
- An optional `"frozen"` field, `{ "reason": "<why>" }`, freezes the package (**Overrides**,
  below).

## Template

`markdown-schema-templates/architecture-profile/architecture-profile.template.md` in this
skill, with its `refine.ts` and `examples/`. Use the markdown-schema skill for the
directive grammar, and validate every change:

```sh
validate-md --template <path-to>/architecture-profile.template.md <skill>.architecture-profile.md
```

Programmatic readers parse the profile with markdown-schema's `parseTemplate` (plus
`loadRefine` from `@gergelyszerovay/markdown-schema/node`) and use the resulting
JSON. The loader (`load-profile.cjs`) needs that package resolvable from the bound
package: declare `@gergelyszerovay/markdown-schema` as a devDependency (the
loader tries it first, then the legacy `markdown-schema`), and build it first when it is a
workspace package or a `link:`. The bound package reaches the scripts by package name: it
declares the skills' package (`@gergelyszerovay/architecture-skills`) as a devDependency, runs the checkers as its
bins and requires `@gergelyszerovay/architecture-skills/load-profile.cjs` ([rules.md](references/rules.md),
"Scripts").

## Rules

- **A fixed vocabulary.** Structural and coverage rules name rule types the tools
  implement (listed in the template and enforced by its refine; parameters and
  implementations in [rules.md](references/rules.md)). A profile selects and
  parameterizes them. A rule that doesn't fit becomes a new rule type in the tools first,
  or stays in the references and is checked in review.
- **Role names are parameters.** A rule that needs a library role (`library-roles` with
  `role-source=context-path`, `contract-only`) takes it from its row (`default-role`,
  `places-role`, `shared-role`, `contract-roles`, `index-roles`); no tool has a role name of
  its own, so every architecture uses the rules with its own roles.
- **Grouping.** The vertical axis several rules implement (contexts and their map, the
  contract surface, places, shared and infrastructure code, inside a package and across
  packages) is explained once in [grouping.md](references/grouping.md), with what each
  architecture maps it to. Each architecture's constitution decides what it adopts.
- **Enforced by** says which tool checks a rule today: `architecture-check` (the rules over
  imports, judged by symbol over the manifest by `reviewer2-check`), `eslint`, `oxlint`,
  `checker`, `dependency-cruiser` (a value of profiles written before plan 0121,
  read as `architecture-check`), or `planned`. A row names one engine, and `reviewer2-check` is
  the one engine of the import rules; `eslint-rules.cjs` builds the syntax rules
  ([rules.md](references/rules.md), "Engines"). Don't mark a rule enforced until a tool actually
  checks it.
- **One copy.** References explain the rules and link to profile rows; they don't
  restate the tables.
- **Classifier.** `file-suffix` classifies TypeScript files by suffix; `sql-object`
  classifies database objects. Every block name must fit the classifier.
- **Versioning.** The profile's version is its skill's version, so it rises with every change to
  the skill that gets a changelog entry, not only when a rule changes (the changelog skill,
  "Versions"). A binding names no version: a repository has one version of the skills package
  installed, and every package is checked against the profiles it installs. Raising the skills
  package is a migration of the repository: the update and the changes it calls for in every
  package land together, under one plan, whose input is what changed between the two versions,
  the changelog entries marked `**Migration:**`, and the new findings of the checks. A release that
  changes only wording has nothing to migrate. A package that is not to be migrated now is frozen
  (below).
- **Overrides** by a project or package carry a stated reason and stay visible to review;
  an arbitrary exemption comment never disables a rule. A package doc can approve extra
  packages per layer (read by `layer-packages` with `approved=package-doc`) and list
  rule exceptions with reasons; the `dependencies` rule of architecture-check reads the
  exceptions table (and nothing else), while ESLint does not, so an exception of a rule ESLint
  judges still needs ESLint's own mechanism next to it.
  - **Frozen.** A package that is not migrated to the installed version now says so in its
    binding, with a reason: `"architecture": { "profile": "<name>", "frozen": { "reason": "<why>" } }`.
    `frozen` has exactly one key, `reason`, one line of 1 to 300 characters, not only spaces,
    with no control characters (C0, DEL, C1, U+2028, U+2029); `load-profile.cjs`
    refuses any other shape (so `lint:tsdoc` and `lint:placement` fail on a typo). It records no
    version: the version the package was last checked against is the skills package in the
    lockfile at the commit that froze it (`git log -S '"frozen"' -- <package>/package.json`). A
    frozen package is out of the migration (a migration plan does not change it; the migration
    input lists only the package and its reason) and is not checked against the current rules: no
    rule of its profile judges it. `check-tsdoc-tags`, `check-block-placement` and `check-units`
    print one line, `<package name>: frozen (<reason>); not checked against <profile> <installed
version>`, and exit 0; the ESLint builders of `eslint-rules.cjs` return no rule, so its lint
    keeps the package's own rules only. It is still built and tested: frozen is about the
    architecture's rules, not about the code. Removing `frozen` is a change planned like any
    migration, whose input is the package's findings under the installed profile.
  - **Frozen is not advisory.** An `"enforcement": "advisory"` package is checked and its findings
    reported as `info`s; a frozen one is not checked.
