# @gergelyszerovay/install-skills

Installs the agent skills of the packages a repository lists in `installSkills` into
`.claude/skills` and `.agents/skills`, where agents look for them (agents do not scan
`node_modules`). Plain Node, no dependencies, one bin: `install-skills`.

```sh
pnpm add -D @gergelyszerovay/install-skills @gergelyszerovay/architecture-skills
# add "installSkills": ["@gergelyszerovay/architecture-skills"] to the root package.json (required: without it install-skills fails)
pnpm exec install-skills                 # copies the skills of the listed packages into .claude/skills/ and .agents/skills/ (once, when the first links to the second)
pnpm exec install-skills --link          # links them instead, through node_modules/<package>/skills/
pnpm exec install-skills --check         # reports what a run would change, writes nothing (exit 1 when anything would change)
```

The architecture skills are one package among the others: they are installed when the root lists them, and
not otherwise. A repository that took this bin from `@gergelyszerovay/architecture-skills` (before this package existed) and used its
`install-skills` bin must add this package to its dependencies (`pnpm add -D @gergelyszerovay/install-skills`);
in a lab, `lab update` adds the pin.

## What it installs

`install-skills` installs the skills of the packages the root `package.json` lists in `installSkills`. A listed
package is one the root declares in `dependencies` or `devDependencies` (an undeclared or hoisted transitive
package is ignored): such a package, installed in `node_modules`, whose `exports` maps `./skills/*` to a folder
contributes the skills in it. A skill name two packages provide is installed or refreshed from neither (what is
installed stays) and named, and fails the run; with `--link`, each skill is linked through its own package's
`node_modules` path.

The root `package.json` must hold `installSkills`, an array of package names (`[]` installs nothing and
succeeds). The list is the person's decision: adding a package to it is a tracked change, so an upgrade or a new
dependency cannot add agent instructions unseen. A declared package that exports skills and is not listed is
reported with its skill names and installs nothing (what it installed earlier is removed), and a listed package
that is not declared or exports no skills is reported and fails the run. Without the field (or without a readable
root `package.json`) nothing is installed from any package: the command says the field is missing, names each
declared package that exports skills with its skill names, and exits 1. Skills an earlier run installed stay in
place, neither removed nor refreshed, and the record and `.gitignore` are not rewritten; add the field (`[]` to
remove them on the next run). Every run prints the skills installed for the first time and those removed.

`installSkills` is matched against the key the root declares, not against a name an installed manifest claims: a
declared package whose `package.json` names another package is skipped, reported with both names, and fails the
run (it signals a tampered `node_modules`); a declared key that is not a plain package name (no `..`) is ignored.
A skill name that is not letters, digits, `.`, `_` and `-` (starting with a letter or digit) is refused and
reported, when installing and when keeping a recorded entry, so the generated `.gitignore` lists only safe names.
A skill's symbolic links are never copied.

## Where it installs

In a lab (lab D19) `.claude/skills` is a committed relative link to `../.agents/skills`: the command then
installs once, into `.agents/skills/`, and reports one target. Any other link at `.claude`, `.agents`,
`.agents/skills` or `.claude/skills` is refused before anything is written, so a link the agent planted cannot
make the command write or delete outside those folders. Each target folder also gets a generated `.gitignore`: a
header saying so, `/.install-skills.json`, `/.gitignore` and one `/<skill>/` line per skill the command
installed there (no trailing slash for a skill installed with `--link`, which is a link), and nothing else; a
skill of your own, or one `npx skills add` installed, is not listed, so Git tracks it.

Each target folder keeps a record of what was installed there, `.install-skills.json` (with a hash of each copy
and the package of each skill). Running `install-skills` again after an upgrade refreshes what the record lists,
and links into `node_modules/<package>/`, and removes the skills a package dropped. Anything else of the same
name is left alone and named, and so is a copy changed since it was installed (`--force` replaces it); either
fails the run. A link a person made into a package that was never listed or recorded is kept. `--root <dir>`
names the repository (by default the nearest folder above with `.git`).

Copies are the default because links leave documents bound to the skills' templates (a
`markdown-schema-templates/` link to `.claude/skills/<skill>/markdown-schema-templates/<name>`) unbound:
`validate-md` reads no template through a symbolic link on the way (it warns of such a link), and Node strips no
types from a `*.refine.ts` under `node_modules`.

## `--check`

`install-skills --check [--link] [--force]` computes what a run would do and writes nothing. It exits 0 and prints
nothing when a run would change nothing and fail on nothing. Otherwise it exits 1 and prints one line per finding on
standard output, in this order:

- `would install "<target>/<skill>" (copied from <package>)`, `would refresh …` (a copy whose package changed, or
  that a `--link` run would link, or the reverse) and `would remove "<target>/<entry>" (…)`;
- `would write` or `would rewrite "<target>/.install-skills.json"` and `"<target>/.gitignore"`;
- `would fail: …` for what a run leaves alone and fails on, in the words of a run: an entry it did not install, a copy
  changed since it was installed, a skill two packages provide, a package that exports skills and is not listed, a
  listed package that is not declared or exports nothing, a refused name, a missing `installSkills`.

It exits 2 on a usage error or a layout a run refuses (a link at `.claude`, `.agents`, `.agents/skills`, or a
`.claude/skills` that links elsewhere than `../.agents/skills`), with the problem on standard error; a run exits 1
on a layout problem. Names read from files are quoted. It lstats what it compares and reads no record, `.gitignore`
or skill through a link, and it creates no folder. It hashes each recorded copy, so its cost grows with the installed
skills (tens of small folders in a lab), not with the repository: a doctor or a hook can ask on every call.

## Develop

```sh
pnpm exec workspace-hooks turbo run test format:check publint --filter=@gergelyszerovay/install-skills
```

It is released with the architecture skills (the `block-architecture` group); see `CHANGELOG.md`.
