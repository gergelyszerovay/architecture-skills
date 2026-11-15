#!/usr/bin/env node
// check-changelogs: checks that every published package and every skill under a folder has a
// changelog in the standard shape, the part a template cannot see, then runs `validate-md` over
// the changelogs with the skill's template. No dependencies; Node 20+.
//
//   check-changelogs <path> [--no-validate]     every package and skill under <path>
//   check-changelogs --staged [<file>...]       warn about staged changes without an entry
//   check-changelogs --release <dir> [--no-validate]
//                                               <dir> is a package about to be released
//
// A `CHANGELOG.public.md` beside a `CHANGELOG.md` (the changelog skill, "The public changelog") is checked
// whenever it exists: `validate-md` with the same template, and against its twin (the same title,
// `## Unreleased` first, the same version headings in the same order; a missing, an extra or an
// out-of-order version is named). `--public` also reports every package, skill and group changelog that
// has a `CHANGELOG.md` and no `CHANGELOG.public.md`; `--public=<path>,<glob>,…` (repeatable) restricts
// that to the folders it names (relative to the folder checked; a pattern also covers the folders
// below the one it matches), so a repository can say which of its changelogs are public. With
// `--release`, `--public` checks both files at the release (the public `## Unreleased` must be empty too).
// `--staged` also warns about a staged `CHANGELOG.md` change whose `CHANGELOG.public.md` beside it is not staged.
//
// A published package is a `package.json` with a name that is not private and has a `publishConfig`
// (lab D21); a skill is a folder with a `SKILL.md` inside a published package (a lab's own skills
// need no changelog). Files come from Git (tracked and untracked but
// not ignored), so `node_modules` and ignored output are never searched.
//
// The default check fails when a named `package.json` is neither private nor given a `publishConfig`,
// or is both (`pnpm publish` would send the first to the default registry); when a package or skill
// has no `CHANGELOG.md`; when its changelog has
// no `## Unreleased` section (or one below a version heading) or a title other than `# Changelog: <name>`; when a package's `files`
// leaves the changelog out; when the top version heading differs from the version (a package's
// `version`; a skill's profile version, else its `metadata.version`); or when `validate-md` rejects the
// changelog against `markdown-schema-templates/changelog/changelog.template.md`. It also fails when a
// skill's `**Breaking:**` entry not released yet (under `## Unreleased`, or under a version heading
// above every heading the changelog had at a release tag of the package that ships the skill, its
// own `<name>@<version>` or its group's `<group>@<version>`; without such a tag only `## Unreleased`) has no
// indented `**Migration:**` line; a package's entries need none (the `changelog` skill, "The
// shape").
//
// `--staged` only warns (exit 0): it names each package or skill whose shipped files are staged
// (or deleted: a deleted path is still owned by the package or skill whose folder it was in) with no
// entry in its `CHANGELOG.md`: a staged changelog counts only when it adds a line under
// `## Unreleased`. A shipped file of a package with a `files` list is one that list includes, a
// `.md` too. A published package whose `changelog.covers` names a private
// package counts that package's shipped files as its own; the covering packages are the workspace's
// (the root `pnpm-workspace.yaml`). `--staged` reads no manifest under `archive/`, `node_modules` or a
// dot-folder, and checks no staged file of `archive/` or of a note; the default check refuses a name
// that is not a private package of the folder (the `changelog` skill, "Bundled private packages").
// Files are paths relative to the Git top level; without any it reads the staged files.
//
// `--release <dir>` is run before a package is published: for the package and the skills it
// contains it refuses unless the top section is the version being released, `## Unreleased` is
// empty, and a `**Breaking:**` entry since the last release comes with the step the changelog
// skill requires (from 1.0 a new major version, in 0.x at least a new minor version). The last
// release is the package's newest tag `<name without scope>@<version>`; a skill, which has no
// tag, is compared with the version heading below its top one, and every `**Breaking:**` entry of
// a skill's sections above its last release (as the default check finds them) needs a
// `**Migration:**` line; released sections are never judged.
//
// A package that says `"changelog": { "group": "<name>" }` belongs to a release group (the `changelog` skill,
// "Release groups"): it lists only the versions it changed in, so its top version heading may be below its
// version but not above it, and the group's generated changelog (`# Changelog: <name>`, found in a folder above
// the package) must have the group's version as its top heading, an empty `## Unreleased` and no heading other
// than versions. `--release` also requires that changelog to exist, and counts a **Breaking:** entry since the
// newest tag of the group, `<name>@<version>`, as well as of the package.
//
// `validate-md` is looked up on PATH; run the script through `pnpm exec` in a package that
// depends on the markdown-schema package, or pass --no-validate.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHANGELOG,
  compareVersions,
  coversOf,
  entriesOf,
  findGroupChangelog,
  findSubjects,
  groupOf,
  hasBreaking,
  hasMigration,
  isBreakingEntry,
  isBreakingStep,
  isInNotesFolder,
  isPrivatePackage,
  isPublished,
  isUnscanned,
  listFiles,
  listsChangelog,
  parseChangelog,
  posix,
  PUBLIC_CHANGELOG,
  publishRuleProblem,
  readManifest,
  readManifests,
  VERSION,
  workspacePackages,
} from './changelog-lib.mjs';

const TEMPLATE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'markdown-schema-templates',
  'changelog',
  'changelog.template.md',
);

const USAGE =
  'Usage: check-changelogs <path> [--no-validate] [--public[=<path>,<glob>,...]]\n' +
  '       check-changelogs --staged [<file>...]\n' +
  '       check-changelogs --release <dir> [--no-validate] [--public[=<path>,<glob>,...]]\n';

/**
 * Compares a `CHANGELOG.public.md` with the `CHANGELOG.md` beside it: the same title, `## Unreleased`
 * first, and the same version headings in the same order.
 * @param {string} label - What the changelogs belong to, for the messages.
 * @param {string} internalText - The text of the `CHANGELOG.md`.
 * @param {string} publicText - The text of the `CHANGELOG.public.md`.
 * @returns {string[]} The problems; versions are named.
 */
export function twinProblems(label, internalText, publicText) {
  const internal = parseChangelog(internalText);
  const published = parseChangelog(publicText);
  const problems = [];
  if (published.title !== internal.title) {
    problems.push(
      `${label}: the title of ${PUBLIC_CHANGELOG} is "${published.title ?? ''}", it must be "${internal.title ?? ''}" as in ${CHANGELOG}.`,
    );
  }
  if (!published.hasUnreleased)
    problems.push(`${label}: no "## Unreleased" section in ${PUBLIC_CHANGELOG}.`);
  else if (!published.unreleasedFirst) {
    problems.push(
      `${label}: "## Unreleased" must come before every version heading in ${PUBLIC_CHANGELOG}.`,
    );
  }
  for (const heading of published.otherHeadings) {
    problems.push(
      `${label}: the "## ${heading}" heading of ${PUBLIC_CHANGELOG} is neither "Unreleased" nor a version.`,
    );
  }
  const own = internal.versions.map(({ version }) => version);
  const theirs = published.versions.map(({ version }) => version);
  const missing = own.filter((version) => !theirs.includes(version));
  const extra = theirs.filter((version) => !own.includes(version));
  if (missing.length > 0) {
    problems.push(
      `${label}: ${PUBLIC_CHANGELOG} lacks the version${missing.length > 1 ? 's' : ''} ${missing.join(', ')} of ${CHANGELOG}; a version with nothing public says "No changes for users of the package.".`,
    );
  }
  if (extra.length > 0) {
    problems.push(
      `${label}: ${PUBLIC_CHANGELOG} has the version${extra.length > 1 ? 's' : ''} ${extra.join(', ')} that ${CHANGELOG} does not have.`,
    );
  }
  const commonOwn = own.filter((version) => theirs.includes(version));
  const commonTheirs = theirs.filter((version) => own.includes(version));
  if (commonOwn.join() !== commonTheirs.join()) {
    problems.push(
      `${label}: the versions of ${PUBLIC_CHANGELOG} are out of order (${commonTheirs.join(', ')}); ${CHANGELOG} has ${commonOwn.join(', ')}.`,
    );
  }
  return problems;
}

/**
 * Checks the `CHANGELOG.public.md` beside a changelog, when there is one.
 * @param {string} label - What the changelogs belong to, for the messages.
 * @param {string} changelog - The absolute path of the `CHANGELOG.md`.
 * @returns {string[]} The problems; none when there is no public twin.
 */
function publicTwinProblems(label, changelog) {
  const twin = join(dirname(changelog), PUBLIC_CHANGELOG);
  if (!existsSync(twin)) return [];
  return twinProblems(label, readFileSync(changelog, 'utf8'), readFileSync(twin, 'utf8'));
}

/**
 * Turns the paths and globs of `--public=…` into a test on a folder (relative to the folder checked,
 * with `/`). `*` matches within a segment, `**` across segments; a pattern also covers the folders below
 * the one it matches.
 * @param {string[]} patterns - The paths and globs; none means every folder.
 * @returns {(folder: string) => boolean} The test.
 */
export function publicFolderTest(patterns) {
  if (patterns.length === 0) return () => true;
  const expressions = patterns.map((pattern) => {
    const cleaned = pattern.replace(/^\.\//, '').replace(/\/+$/, '');
    const source = cleaned
      .split(/(\*\*\/?|\*|\?)/)
      .map((part) => {
        if (part.startsWith('**')) return part.endsWith('/') ? '(?:.*/)?' : '.*';
        if (part === '*') return '[^/]*';
        if (part === '?') return '[^/]';
        return part.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    return new RegExp(`^${source}(?:/.*)?$`);
  });
  return (folder) => expressions.some((expression) => expression.test(folder));
}

/**
 * Reports each changelog that has no `CHANGELOG.public.md` beside it (`--public`).
 * @param {string} root - The absolute folder checked; the patterns are relative to it.
 * @param {{ label: string, changelog: string }[]} changelogs - The changelogs found (packages, skills, groups).
 * @param {string[]} patterns - The paths and globs that restrict which must have one; none means all.
 * @returns {string[]} The problems.
 */
export function missingPublicProblems(root, changelogs, patterns) {
  const wanted = publicFolderTest(patterns);
  return changelogs
    .filter(({ changelog }) => {
      const folder = posix(relative(root, dirname(changelog))) || '.';
      return wanted(folder) && !existsSync(join(dirname(changelog), PUBLIC_CHANGELOG));
    })
    .map(
      ({ label, changelog }) =>
        `${label}: no ${PUBLIC_CHANGELOG} beside ${CHANGELOG} (${posix(relative(root, changelog))}); a changelog that a public copy holds has a public twin (changelog skill, "The public changelog").`,
    );
}

/**
 * Checks one package or skill against the changelog rules, without `validate-md`.
 * @param {ReturnType<typeof findSubjects>[number]} subject - The package or skill.
 * @returns {{ problems: string[], changelog: string | undefined }} The problems, and the changelog's path when there is one.
 */
export function checkSubject(subject) {
  const label = `${subject.kind} ${subject.name}`;
  const path = join(subject.dir, CHANGELOG);
  const problems = [];
  if (subject.version === undefined || !VERSION.test(subject.version)) {
    problems.push(
      `${label}: no valid version in ${subject.source} (${subject.version ?? 'missing'}); a skill without a profile declares \`metadata:\` \`version: "x.y.z"\` in SKILL.md.`,
    );
  }
  if (!existsSync(path)) {
    problems.push(
      `${label}: no ${CHANGELOG} beside ${subject.kind === 'package' ? 'package.json' : 'SKILL.md'}.`,
    );
    return { problems, changelog: undefined };
  }
  if (subject.kind === 'package' && !listsChangelog(subject.manifest)) {
    problems.push(
      `${label}: package.json \`files\` does not list ${CHANGELOG}, so it is not published.`,
    );
  }
  const parsed = parseChangelog(readFileSync(path, 'utf8'));
  if (parsed.title !== `Changelog: ${subject.name}`) {
    problems.push(
      `${label}: the title is "${parsed.title ?? ''}", it must be "Changelog: ${subject.name}".`,
    );
  }
  if (!parsed.hasUnreleased) problems.push(`${label}: no "## Unreleased" section.`);
  else if (!parsed.unreleasedFirst) {
    problems.push(`${label}: "## Unreleased" must come before every version heading.`);
  }
  for (const heading of parsed.otherHeadings) {
    problems.push(`${label}: the "## ${heading}" heading is neither "Unreleased" nor a version.`);
  }
  const top = parsed.versions[0]?.version;
  const group = subject.manifest === undefined ? undefined : groupOf(subject.manifest);
  if (group === null) {
    problems.push(`${label}: \`changelog.group\` must be a group name such as "reviewer2".`);
  }
  if (top === undefined) {
    problems.push(`${label}: no version heading ("## ${subject.version ?? 'x.y.z'}").`);
  } else if (typeof group === 'string') {
    // a package of a release group lists only the versions it changed in (gaps allowed)
    if (
      subject.version !== undefined &&
      VERSION.test(subject.version) &&
      compareVersions(top, subject.version) > 0
    ) {
      problems.push(
        `${label}: the top version heading is ${top}, above the version in ${subject.source}, ${subject.version}.`,
      );
    }
  } else if (subject.version !== undefined && top !== subject.version) {
    problems.push(
      `${label}: the top version heading is ${top}, the version in ${subject.source} is ${subject.version}; they must be equal.`,
    );
  }
  problems.push(...publicTwinProblems(label, path));
  return { problems, changelog: path };
}

/**
 * Finds the `**Breaking:**` entries of a skill's section that carry no `**Migration:**` line
 * (the changelog skill, "The shape"): a skill's breaking entry says what
 * to change in existing code. A package's entries are not judged: there the line is optional.
 * @param {string} label - The subject's label (`skill <name>`).
 * @param {string} where - The section's heading text (`Unreleased`, a version).
 * @param {string} body - The section's text.
 * @returns {string[]} The problems, one per entry.
 */
export function migrationProblems(label, where, body) {
  return entriesOf(body)
    .filter((entry) => isBreakingEntry(entry) && !hasMigration(entry))
    .map(
      (entry) =>
        `${label}: a **Breaking:** entry under "## ${where}" has no **Migration:** line ("${entry.split('\n')[0].slice(0, 80)}"); add an indented "**Migration:** …" line that says what to change in existing code.`,
    );
}

/**
 * The tags a package's releases are known by: `<name without scope>@<version>`, and, for a package of a
 * release group, `<group>@<version>` (the `changelog` skill, "Release groups").
 * @param {ReturnType<typeof findSubjects>[number]} owner - The package.
 * @returns {string[]} The tags found in the repository, any order; none outside a repository.
 */
function releaseTagsOf(owner) {
  const names = [owner.name.replace(/^@[^/]+\//, '')];
  const group = owner.manifest === undefined ? undefined : groupOf(owner.manifest);
  if (typeof group === 'string') names.push(group);
  try {
    return execFileSync('git', ['tag', '--list', ...names.map((name) => `${name}@*`)], {
      cwd: owner.dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter((tag) =>
        names.some(
          (name) => VERSION.test(tag.slice(name.length + 1)) && tag.startsWith(`${name}@`),
        ),
      );
  } catch {
    return [];
  }
}

/**
 * The newest version heading a skill's changelog had at any release of the package that ships it:
 * the top heading of the same file at each of the package's (and its group's) tags, the highest of them.
 * @param {ReturnType<typeof findSubjects>[number]} skill - The skill.
 * @param {ReturnType<typeof findSubjects>[number] | undefined} owner - The package that ships it.
 * @returns {string | undefined} The version, or `undefined` when no tag holds the changelog.
 */
function releasedTop(skill, owner) {
  if (owner === undefined) return undefined;
  let newest;
  for (const tag of releaseTagsOf(owner)) {
    let text;
    try {
      text = execFileSync('git', ['show', `${tag}:./${CHANGELOG}`], {
        cwd: skill.dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue;
    }
    const top = parseChangelog(text).versions.find(({ version }) => VERSION.test(version))?.version;
    if (top !== undefined && (newest === undefined || compareVersions(top, newest) > 0))
      newest = top;
  }
  return newest;
}

/**
 * The package among `subjects` that ships a skill: the deepest one whose folder holds it.
 * @param {ReturnType<typeof findSubjects>[number]} skill - The skill.
 * @param {ReturnType<typeof findSubjects>} subjects - The packages and skills found.
 * @returns {ReturnType<typeof findSubjects>[number] | undefined} The package.
 */
function shipperOf(skill, subjects) {
  return subjects
    .filter(({ kind, dir }) => kind === 'package' && skill.dir.startsWith(`${dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0];
}

/**
 * The version sections of a skill's changelog that are not released yet: those above the newest
 * heading the changelog had at a release tag of the package that ships the skill (its own tags and
 * its group's). Without such a tag none is, so a lab without tags judges only `## Unreleased`, and a
 * released section is never judged.
 * @param {ReturnType<typeof findSubjects>[number]} skill - The skill.
 * @param {ReturnType<typeof findSubjects>[number] | undefined} owner - The package that ships it.
 * @param {ReturnType<typeof parseChangelog>} parsed - Its changelog, parsed.
 * @returns {{ where: string, body: string }[]} The sections, newest first.
 */
function untaggedVersions(skill, owner, parsed) {
  const released = releasedTop(skill, owner);
  if (released === undefined) return [];
  return parsed.versions
    .filter(({ version }) => compareVersions(version, released) > 0)
    .map(({ version, body }) => ({ where: version, body }));
}

/**
 * The sections of a skill's changelog that are not released yet: `## Unreleased` and
 * {@link untaggedVersions}.
 * @param {ReturnType<typeof findSubjects>[number]} skill - The skill.
 * @param {ReturnType<typeof findSubjects>[number] | undefined} owner - The package that ships it.
 * @param {ReturnType<typeof parseChangelog>} parsed - Its changelog, parsed.
 * @returns {{ where: string, body: string }[]} The sections.
 */
function unreleasedSections(skill, owner, parsed) {
  return [
    { where: 'Unreleased', body: parsed.unreleased },
    ...untaggedVersions(skill, owner, parsed),
  ];
}

/**
 * Runs `validate-md` on changelogs with the skill's template.
 * @param {string[]} changelogs - Absolute paths.
 * @param {string} cwd - The folder to run in.
 * @returns {string[]} The problems: the tool's output when it fails, or a message when it cannot start.
 */
export function validateChangelogs(changelogs, cwd) {
  if (changelogs.length === 0) return [];
  const run = spawnSync('validate-md', ['--template', TEMPLATE, ...changelogs], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  if (run.error?.code === 'ENOENT') {
    return [
      'validate-md is not on the PATH; run check-changelogs through `pnpm exec` in a package that depends on @gergelyszerovay/markdown-schema, or pass --no-validate.',
    ];
  }
  if (run.status === 0) return [];
  return [`validate-md rejected a changelog:\n${`${run.stdout}${run.stderr}`.trim()}`];
}

/**
 * Checks the `changelog.covers` of a published package: a list of the names of private packages of
 * the folder checked. A name that is no private package of the folder is refused, since a change to
 * that package would never reach this package's changelog.
 * @param {ReturnType<typeof findSubjects>[number]} subject - The package or skill.
 * @param {Set<string>} privateNames - The names of the private packages of the folder.
 * @returns {string[]} The problems.
 */
export function coversProblems(subject, privateNames) {
  const covers = subject.manifest === undefined ? undefined : coversOf(subject.manifest);
  if (covers === undefined) return [];
  const label = `${subject.kind} ${subject.name}`;
  if (covers === null) return [`${label}: \`changelog.covers\` must be a list of package names.`];
  return covers
    .filter((name) => !privateNames.has(name))
    .map(
      (name) =>
        `${label}: \`changelog.covers\` names ${name}, which is not a private package of this folder.`,
    );
}

/**
 * Checks the generated changelog of a release group against the packages that belong to it.
 * @param {string} group - The group's name.
 * @param {string} path - The group changelog's absolute path.
 * @param {{ name: string, version: string | undefined }[]} members - The group's packages found in the
 *   folder checked.
 * @returns {string[]} The problems.
 */
export function checkGroupChangelog(group, path, members) {
  const label = `group ${group}`;
  const problems = [];
  const parsed = parseChangelog(readFileSync(path, 'utf8'));
  if (!parsed.hasUnreleased) problems.push(`${label}: no "## Unreleased" section.`);
  else if (!parsed.unreleasedFirst) {
    problems.push(`${label}: "## Unreleased" must come before every version heading.`);
  } else if (parsed.unreleased !== '') {
    problems.push(
      `${label}: "## Unreleased" of a group changelog must stay empty; it is generated by release-changelog --group.`,
    );
  }
  for (const heading of parsed.otherHeadings) {
    problems.push(`${label}: the "## ${heading}" heading is neither "Unreleased" nor a version.`);
  }
  const top = parsed.versions[0]?.version;
  if (top === undefined) return problems;
  for (const member of members) {
    if (member.version !== undefined && VERSION.test(member.version) && member.version !== top) {
      problems.push(
        `${label}: the top version heading of its changelog is ${top}, but ${member.name} is at ${member.version}; the group has one version (run prepare-release).`,
      );
    }
  }
  return problems;
}

/**
 * Finds the generated changelog of each release group that the packages among a list name, and the
 * packages of the group.
 * @param {ReturnType<typeof findSubjects>} subjects - The packages and skills.
 * @returns {Map<string, { path: string | undefined, members: ReturnType<typeof findSubjects> }>} Each group
 *   named, with its changelog's path (undefined when none is made yet) and its packages.
 */
export function groupsOf(subjects) {
  const groups = new Map();
  for (const subject of subjects) {
    if (subject.kind !== 'package' || subject.manifest === undefined) continue;
    const group = groupOf(subject.manifest);
    if (typeof group !== 'string') continue;
    const found = groups.get(group) ?? { path: undefined, members: [] };
    found.path ??= findGroupChangelog(subject.dir, group);
    found.members.push(subject);
    groups.set(group, found);
  }
  return groups;
}

/**
 * Lists the `CHANGELOG.public.md` files that sit beside the given changelogs.
 * @param {string[]} changelogs - Absolute paths of `CHANGELOG.md` files.
 * @returns {string[]} The public twins that exist.
 */
function publicTwinsOf(changelogs) {
  return changelogs
    .map((path) => join(dirname(path), PUBLIC_CHANGELOG))
    .filter((path) => existsSync(path));
}

/**
 * Checks every package and skill under a folder, and the publish rule of every named manifest.
 * @param {string} root - The absolute folder.
 * @param {boolean} validate - Whether to run `validate-md`.
 * @param {string[] | undefined} [publicPatterns] - `--public`: undefined when not asked; otherwise the
 *   paths and globs that restrict which changelogs must have a `CHANGELOG.public.md` (empty: all).
 * @returns {{ subjects: number, problems: string[] }} How many were found, and the problems.
 */
export function checkTree(root, validate, publicPatterns) {
  const files = listFiles(root);
  const subjects = findSubjects(root, files);
  const scanned = files.filter((file) => !isUnscanned(dirname(file)));
  const manifests = readManifests(root, scanned);
  const privateNames = new Set(
    manifests
      .filter(({ manifest }) => isPrivatePackage(manifest))
      .map(({ manifest }) => manifest.name),
  );
  const problems = manifests.flatMap(({ dir, manifest }) => {
    const problem = publishRuleProblem(manifest);
    return problem === undefined ? [] : [`${posix(relative(root, dir)) || '.'}: ${problem}`];
  });
  const changelogs = [];
  /** @type {{ label: string, changelog: string }[]} */
  const found = [];
  for (const subject of subjects) {
    const result = checkSubject(subject);
    result.problems.push(...coversProblems(subject, privateNames));
    problems.push(
      ...result.problems.map(
        (problem) => `${posix(relative(root, subject.dir)) || '.'}: ${problem}`,
      ),
    );
    if (result.changelog !== undefined) {
      changelogs.push(result.changelog);
      found.push({ label: `${subject.kind} ${subject.name}`, changelog: result.changelog });
      if (subject.kind === 'skill') {
        const owner = shipperOf(subject, subjects);
        const parsed = parseChangelog(readFileSync(result.changelog, 'utf8'));
        for (const { where, body } of unreleasedSections(subject, owner, parsed)) {
          problems.push(
            ...migrationProblems(`skill ${subject.name}`, where, body).map(
              (problem) => `${posix(relative(root, subject.dir)) || '.'}: ${problem}`,
            ),
          );
        }
      }
    }
  }
  for (const [group, { path, members }] of groupsOf(subjects)) {
    if (path === undefined) continue;
    problems.push(
      ...checkGroupChangelog(group, path, members).map(
        (problem) => `${posix(relative(root, path))}: ${problem}`,
      ),
    );
    changelogs.push(path);
    found.push({ label: `group ${group}`, changelog: path });
    problems.push(
      ...publicTwinProblems(`group ${group}`, path).map(
        (problem) => `${posix(relative(root, path))}: ${problem}`,
      ),
    );
  }
  if (publicPatterns !== undefined) {
    problems.push(...missingPublicProblems(root, found, publicPatterns));
  }
  if (validate)
    problems.push(...validateChangelogs([...changelogs, ...publicTwinsOf(changelogs)], root));
  return { subjects: subjects.length, problems };
}

/**
 * Finds the newest tag of a package, `<name without scope>@<version>`.
 * @param {string} name - The package name.
 * @param {string} cwd - A folder in the repository.
 * @returns {string | undefined} The version of the newest tag, if any.
 */
function lastTagVersion(name, cwd) {
  const short = name.replace(/^@[^/]+\//, '');
  try {
    const tags = execFileSync('git', ['tag', '--list', `${short}@*`], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((tag) => tag.slice(short.length + 1))
      .filter((version) => VERSION.test(version));
    return tags.sort((a, b) => compareVersions(b, a))[0];
  } catch {
    return undefined;
  }
}

/**
 * Checks a package, or a skill, about to be released.
 * @param {ReturnType<typeof findSubjects>[number]} subject - The package or skill.
 * @returns {string[]} The problems.
 */
export function checkRelease(subject, subjects = []) {
  const { problems } = checkSubject(subject);
  const path = join(subject.dir, CHANGELOG);
  if (!existsSync(path)) return problems;
  const label = `${subject.kind} ${subject.name}`;
  const parsed = parseChangelog(readFileSync(path, 'utf8'));
  if (parsed.unreleased !== '') {
    problems.push(
      `${label}: "## Unreleased" is not empty; release-changelog moves it under the version.`,
    );
  }
  const publicPath = join(subject.dir, PUBLIC_CHANGELOG);
  if (
    existsSync(publicPath) &&
    parseChangelog(readFileSync(publicPath, 'utf8')).unreleased !== ''
  ) {
    problems.push(
      `${label}: "## Unreleased" of ${PUBLIC_CHANGELOG} is not empty; release-changelog moves it under the version.`,
    );
  }
  let top = parsed.versions[0]?.version;
  if (top === undefined) return problems;
  if (subject.kind === 'skill') {
    // the sections this release ships: those above the last release of the package that ships the
    // skill; earlier releases are left alone, and without a tag nothing is judged here
    for (const { where, body } of untaggedVersions(subject, shipperOf(subject, subjects), parsed)) {
      problems.push(...migrationProblems(label, where, body));
    }
  }
  const group = subject.manifest === undefined ? undefined : groupOf(subject.manifest);
  let baseline;
  if (typeof group === 'string') {
    // the release is the group's: its version, the group's tag as well as the package's own tag
    const groupChangelog = findGroupChangelog(subject.dir, group);
    if (groupChangelog === undefined) {
      problems.push(
        `${label}: the changelog of the group ${group} (\`# Changelog: ${group}\`) is missing; release-changelog --group writes it.`,
      );
    } else if (
      parseChangelog(readFileSync(groupChangelog, 'utf8')).versions[0]?.version !== subject.version
    ) {
      problems.push(
        `${label}: the changelog of the group ${group} does not have ${subject.version ?? 'the version'} as its top version heading.`,
      );
    }
    if (subject.version === undefined || !VERSION.test(subject.version)) return problems;
    const candidates = [
      lastTagVersion(subject.name, subject.dir),
      lastTagVersion(group, subject.dir),
    ].filter((version) => version !== undefined);
    baseline = candidates.sort((a, b) => compareVersions(b, a))[0];
    if (compareVersions(top, subject.version) < 0) {
      // the package did not change in this release: it has no section for the version
      if (parsed.versions.every(({ body }) => !hasBreaking(body))) return problems;
    }
    if (baseline === undefined || compareVersions(baseline, subject.version) >= 0) {
      baseline = parsed.versions.find(
        ({ version }) => compareVersions(version, subject.version) < 0,
      )?.version;
    }
    top = subject.version;
  } else {
    baseline = subject.kind === 'package' ? lastTagVersion(subject.name, subject.dir) : undefined;
    if (baseline === undefined || compareVersions(baseline, top) >= 0) {
      baseline = parsed.versions[1]?.version;
    }
  }
  if (baseline === undefined || compareVersions(baseline, top) >= 0) return problems;
  const breaking = parsed.versions.filter(
    ({ version, body }) => compareVersions(version, baseline) > 0 && hasBreaking(body),
  );
  if (breaking.length > 0 && !isBreakingStep(baseline, top)) {
    problems.push(
      `${label}: ${breaking.map(({ version }) => version).join(', ')} has a **Breaking:** entry, but ${baseline} to ${top} is not ${baseline.startsWith('0.') ? 'a new minor version at least' : 'a new major version'}.`,
    );
  }
  return problems;
}

/**
 * Reads the `package.json` of a folder of the repository, or nothing when the checker never reads
 * the folder ({@link isUnscanned}).
 * @param {string} top - The absolute Git top level.
 * @param {string} folder - The folder, relative to the top level (`.` for the top).
 * @returns {Record<string, unknown> | undefined} The manifest.
 */
function manifestAt(top, folder) {
  return isUnscanned(folder) ? undefined : readManifest(join(top, folder, 'package.json'));
}

/**
 * Tells whether a published package holds a folder: the folder itself or one above it, up to the top.
 * @param {string} top - The absolute Git top level.
 * @param {string} folder - The folder, relative to the top level.
 * @returns {boolean} True when a published package holds it.
 */
function isShippedBy(top, folder) {
  for (let dir = folder; ; dir = dirname(dir)) {
    const manifest = manifestAt(top, dir);
    if (manifest !== undefined && isPublished(manifest)) return true;
    if (dir === '.' || dir === '/') return false;
  }
}

/**
 * Finds the package or skill a file belongs to: the nearest folder above it with a published
 * `package.json`, or a `SKILL.md` that a published package holds.
 * @param {string} top - The absolute Git top level.
 * @param {string} file - The file, relative to the top level.
 * @returns {{ kind: 'package' | 'skill', dir: string } | undefined} The owner, with its absolute folder.
 */
function ownerOf(top, file) {
  for (let dir = dirname(file); ; dir = dirname(dir)) {
    if (!isUnscanned(dir) && existsSync(join(top, dir, 'SKILL.md'))) {
      return isShippedBy(top, dir) ? { kind: 'skill', dir: join(top, dir) } : undefined;
    }
    const manifest = manifestAt(top, dir);
    if (manifest !== undefined && isPublished(manifest)) {
      return { kind: 'package', dir: join(top, dir) };
    }
    if (dir === '.' || dir === '/') return undefined;
  }
}

/**
 * Finds the private packages a file lies in: each folder above it, or it, that holds a named private
 * `package.json`, nearest first. A file of a private package is shipped by the published packages
 * that cover it (see {@link stagedWarnings}).
 * @param {string} top - The absolute Git top level.
 * @param {string} file - The file, relative to the top level.
 * @returns {{ name: string, dir: string }[]} The private packages, with their absolute folders.
 */
function privatePackagesOf(top, file) {
  const found = [];
  for (let dir = dirname(file); ; dir = dirname(dir)) {
    const manifest = manifestAt(top, dir);
    if (manifest !== undefined && isPrivatePackage(manifest)) {
      found.push({ name: manifest.name, dir: join(top, dir) });
    }
    if (dir === '.' || dir === '/') return found;
  }
}

/**
 * Maps each private package to the folders of the published packages that cover it: the workspace's
 * packages ({@link workspacePackages}).
 * @param {string} top - The absolute Git top level.
 * @returns {Map<string, string[]>} The folders of the covering packages, by the private package's name.
 */
function coveringPackages(top) {
  /** @type {Map<string, string[]>} */
  const covering = new Map();
  for (const { dir, manifest } of workspacePackages(top)) {
    if (!isPublished(manifest)) continue;
    for (const name of coversOf(manifest) ?? []) {
      covering.set(name, [...(covering.get(name) ?? []), dir]);
    }
  }
  return covering;
}

/** Folders of test support: a private package's build never holds them (`bundled` below). */
const TEST_SUPPORT_FOLDERS = ['testing', 'fixtures', '__fixtures__'];
/**
 * Test-only files by name: a `testing.*` entry, and the `*.fixture.*`, `*.fake.*`, `*.contract.*`,
 * `*.stub.*` and `*.mock.*` helpers.
 */
const TEST_SUPPORT_FILE = /^testing\.|\.(fixture|fake|contract|stub|mock)\./;
/**
 * A bundled private package's root files its build never bundles: its manifest and its
 * configuration.
 */
const BUNDLED_ROOT_FILE =
  /^(package\.json|angular\.json|\.postcssrc\.json|components\.json|\.editorconfig|proxy\.conf\.[cm]?js)$/;
/** A bundled private package's root folders its build never bundles. */
const BUNDLED_ROOT_FOLDER = ['bin', 'scripts'];

/**
 * Tells whether a bundled private package's build never holds a file: its test support, and, at its
 * root, its manifest, its `bin/` and `scripts/` folders and its configuration files.
 * @param {string[]} parts - The file's path segments, relative to the package.
 * @returns {boolean} True when the build never holds it.
 */
function neverBundled(parts) {
  const name = parts.at(-1) ?? '';
  if (parts.some((part) => TEST_SUPPORT_FOLDERS.includes(part)) || TEST_SUPPORT_FILE.test(name)) {
    return true;
  }
  return parts.length === 1 ? BUNDLED_ROOT_FILE.test(name) : BUNDLED_ROOT_FOLDER.includes(parts[0]);
}

/**
 * Tells whether a path is one a package's `files` list includes: the entry itself, a path below the
 * entry when it is a folder, or, for a glob entry, a path under its directory part (the text before
 * the last `/` that comes before the first `*`; an entry with no `/` before its `*` matches only
 * files at the package root). An entry that starts with `!` includes nothing.
 * @param {string} inside - The path relative to the package folder.
 * @param {unknown[]} files - The `files` list of the manifest.
 * @returns {boolean} True when an entry includes the path.
 */
export function isListedInFiles(inside, files) {
  return files.some((entry) => {
    if (typeof entry !== 'string' || entry.startsWith('!')) return false;
    const listed = entry.replace(/^\.\//, '').replace(/\/+$/, '');
    const star = listed.indexOf('*');
    if (star >= 0) {
      const slash = listed.slice(0, star).lastIndexOf('/');
      return slash < 0 ? !inside.includes('/') : inside.startsWith(listed.slice(0, slash + 1));
    }
    return listed !== '' && (inside === listed || inside.startsWith(`${listed}/`));
  });
}

/**
 * Tells whether a staged file changes what a consumer of the package or skill gets: not its
 * changelog, tests, configuration, internal documentation or planning, and for a package no
 * Markdown other than a README. A package whose manifest has a `files` list ships everything it
 * would ship without the list (so a change to its sources counts although `files` names only
 * `dist`) and, in addition, what the list includes (a `.md` too, such as a manual under `assets/`),
 * under the same exclusions; `files` is that list. A private package that a published one
 * covers (`bundled`) is judged as a package, except that it ships no Markdown at all and nothing its
 * build never bundles (see {@link neverBundled}): its test support and, at its root, its manifest,
 * `bin/`, `scripts/` and configuration. A published package keeps its own rules: its `testing/` folder
 * may be an exported entry.
 * @param {string} inside - The file's path relative to its package or skill folder.
 * @param {'package' | 'skill' | 'bundled'} kind - What owns the file.
 * @param {unknown[]} [files] - The `files` list of the package's manifest, when it has one.
 * @returns {boolean} True when it is a shipped change.
 */
export function isShippedChange(inside, kind, files) {
  const parts = inside.split('/');
  const name = parts.at(-1) ?? '';
  if (name === CHANGELOG || name === PUBLIC_CHANGELOG) return false;
  if (
    parts.some((part) =>
      ['node_modules', 'layered-docs', 'planning', 'dist', '__tests__', 'temp'].includes(part),
    )
  )
    return false;
  if (kind === 'bundled' && neverBundled(parts)) return false;
  if (/\.(test|spec|e2e|stories)\./.test(name)) return false;
  if (
    /^(tsconfig.*|eslint\.config\..*|\.?prettier.*|vitest.*|tsdown\.config\..*|turbo\.json|tsdoc\.json|\.gitignore|\.npmignore|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/.test(
      name,
    )
  )
    return false;
  const markdown = /\.md$/i.test(name);
  if (!markdown || kind === 'skill') return true;
  if (kind === 'package' && /^README/i.test(name)) return true;
  return kind === 'package' && Array.isArray(files) && isListedInFiles(inside, files);
}

/**
 * Reads a file from Git: the staged version (`:path`) or the one at `HEAD`.
 * @param {string} top - The absolute Git top level.
 * @param {string} spec - What `git show` takes, such as `:a/CHANGELOG.md` or `HEAD:a/CHANGELOG.md`.
 * @returns {string | undefined} The text, or undefined when Git has no such file.
 */
function gitText(top, spec) {
  try {
    return execFileSync('git', ['show', spec], {
      cwd: top,
      encoding: 'utf8',
      maxBuffer: 1 << 26,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined;
  }
}

/**
 * Tells whether a staged `CHANGELOG.md` adds an entry: its staged `## Unreleased` section holds a
 * non-blank line that the section at `HEAD` does not (counted, so a repeated line is one more). A
 * changelog that is deleted, edited only outside `Unreleased`, or released (`Unreleased` emptied)
 * adds none.
 * @param {string} top - The absolute Git top level.
 * @param {string} file - The changelog, relative to the top level.
 * @returns {boolean} True when the staged text adds a line under `## Unreleased`.
 */
export function addsUnreleasedEntry(top, file) {
  const staged = gitText(top, `:${file}`);
  if (staged === undefined) return false;
  const lines = (text) =>
    parseChangelog(text ?? '')
      .unreleased.split(/\r?\n/)
      .filter((line) => line.trim() !== '');
  const before = new Map();
  for (const line of lines(gitText(top, `HEAD:${file}`))) {
    before.set(line, (before.get(line) ?? 0) + 1);
  }
  return lines(staged).some((line) => {
    const count = before.get(line) ?? 0;
    before.set(line, count - 1);
    return count <= 0;
  });
}

/**
 * Names the packages and skills whose shipped files are staged without their changelog. A private
 * package that a published package covers (`changelog.covers`) is shipped by that package: its
 * staged shipped files count as the covering package's, named with the private package they are in.
 * @param {string} top - The absolute Git top level.
 * @param {string[]} files - The staged files, relative to the top level, deleted ones included; those
 *   of the person's notes (`.notes/` or `planning/notes/`) and of `archive/` are passed over.
 * @returns {string[]} One warning per package or skill.
 */
export function stagedWarnings(top, files) {
  /** @type {Map<string, { kind: string, shipped: string[], changelog: boolean, internalStaged: boolean, publicStaged: boolean, files?: unknown[] }>} */
  const owners = new Map();
  const entryOf = (dir, kind) => {
    let entry = owners.get(dir);
    if (entry === undefined) {
      const listed =
        kind === 'package' ? manifestAt(top, posix(relative(top, dir)) || '.')?.files : undefined;
      entry = {
        kind,
        shipped: [],
        changelog: false,
        internalStaged: false,
        publicStaged: false,
        files: Array.isArray(listed) ? listed : undefined,
      };
      owners.set(dir, entry);
    }
    return entry;
  };
  /** @type {Map<string, string[]> | undefined} */
  let covering;
  for (const file of files) {
    // the person's notes are theirs, and archive/ is frozen: neither is checked
    if (isInNotesFolder(file) || file.startsWith('archive/')) continue;
    const owner = ownerOf(top, file);
    if (owner !== undefined) {
      const entry = entryOf(owner.dir, owner.kind);
      const inside = posix(relative(owner.dir, join(top, file)));
      if (inside === CHANGELOG) {
        entry.changelog ||= addsUnreleasedEntry(top, file);
        entry.internalStaged = true;
      } else if (inside === PUBLIC_CHANGELOG) entry.publicStaged = true;
      else if (isShippedChange(inside, owner.kind, entry.files)) addShipped(entry, inside);
    }
    for (const bundled of privatePackagesOf(top, file)) {
      covering ??= coveringPackages(top);
      const covers = covering.get(bundled.name) ?? [];
      const inside = posix(relative(bundled.dir, join(top, file)));
      if (covers.length === 0 || !isShippedChange(inside, 'bundled')) continue;
      for (const dir of covers) addShipped(entryOf(dir, 'package'), `${bundled.name}: ${inside}`);
    }
  }
  const warnings = [];
  for (const [dir, entry] of [...owners].sort()) {
    if (
      entry.internalStaged &&
      !entry.publicStaged &&
      existsSync(join(dir, PUBLIC_CHANGELOG)) &&
      existsSync(join(dir, CHANGELOG))
    ) {
      warnings.push(
        `warning: ${posix(relative(top, join(dir, CHANGELOG)))} is staged and ${posix(relative(top, join(dir, PUBLIC_CHANGELOG)))} beside it is not; a change a consumer would notice gets an entry in both, the public one without plans, decisions or private paths (changelog skill, "The public changelog").`,
      );
    }
    if (entry.shipped.length === 0 || entry.changelog) continue;
    const shown = entry.shipped.slice(0, 3).join(', ') + (entry.shipped.length > 3 ? ', …' : '');
    const changelog = posix(relative(top, join(dir, CHANGELOG)));
    warnings.push(
      `warning: ${posix(relative(top, dir)) || '.'} (${entry.kind}) has staged changes to shipped files (${shown}) and no change to its ${CHANGELOG} (${changelog}); a change a consumer would notice gets an entry under "## Unreleased" (changelog skill).`,
    );
  }
  return warnings;
}

/**
 * Adds a shipped file to an entry, once.
 * @param {{ shipped: string[] }} entry - The entry.
 * @param {string} text - The file, as the warning names it.
 */
function addShipped(entry, text) {
  if (!entry.shipped.includes(text)) entry.shipped.push(text);
}

/**
 * Runs the command line.
 * @param {string[]} argv - The arguments after the script.
 * @returns {number} The exit code.
 */
export function main(argv) {
  const flags = argv.filter((arg) => arg.startsWith('--'));
  const rest = argv.filter((arg) => !arg.startsWith('--'));
  const known = ['--staged', '--release', '--no-validate', '--public'];
  const unknown = flags.find((flag) => !known.includes(flag) && !flag.startsWith('--public='));
  if (unknown !== undefined) {
    process.stderr.write(`check-changelogs: unknown option ${unknown}\n${USAGE}`);
    return 2;
  }
  const validate = !flags.includes('--no-validate');
  const publicFlags = flags.filter((flag) => flag === '--public' || flag.startsWith('--public='));
  /** @type {string[] | undefined} */
  const publicPatterns =
    publicFlags.length === 0
      ? undefined
      : publicFlags.flatMap((flag) =>
          flag
            .slice('--public='.length)
            .split(',')
            .map((part) => part.trim())
            .filter((part) => part !== ''),
        );

  if (flags.includes('--staged')) {
    let top;
    try {
      top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return 0;
    }
    const files =
      rest.length > 0
        ? rest
        : execFileSync('git', ['diff', '--cached', '--name-only', '-z'], {
            cwd: top,
            encoding: 'utf8',
          })
            .split('\0')
            .filter((path) => path !== '');
    for (const warning of stagedWarnings(top, files))
      process.stdout.write(`check-changelogs: ${warning}\n`);
    return 0;
  }

  if (rest.length !== 1) {
    process.stderr.write(USAGE);
    return 2;
  }
  const root = resolve(rest[0]);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`check-changelogs: ${rest[0]} is not a folder\n`);
    return 2;
  }

  if (flags.includes('--release')) {
    const manifest = join(root, 'package.json');
    let published = false;
    if (existsSync(manifest)) {
      try {
        published = isPublished(JSON.parse(readFileSync(manifest, 'utf8')));
      } catch (error) {
        process.stderr.write(
          `check-changelogs: ${rest[0]}/package.json cannot be read: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        return 2;
      }
    }
    if (!published) {
      process.stderr.write(`check-changelogs: ${rest[0]} is not a published package\n`);
      return 2;
    }
    const subjects = findSubjects(root, listFiles(root));
    const problems = subjects.flatMap((subject) => checkRelease(subject, subjects));
    if (validate) {
      const groupChangelogs = [...groupsOf(subjects).values()]
        .map(({ path }) => path)
        .filter((path) => path !== undefined);
      const all = [
        ...subjects
          .map((subject) => join(subject.dir, CHANGELOG))
          .filter((path) => existsSync(path)),
        ...groupChangelogs,
      ];
      problems.push(...validateChangelogs([...all, ...publicTwinsOf(all)], root));
    }
    if (publicPatterns !== undefined) {
      const found = [
        ...subjects
          .filter((subject) => existsSync(join(subject.dir, CHANGELOG)))
          .map((subject) => ({
            label: `${subject.kind} ${subject.name}`,
            changelog: join(subject.dir, CHANGELOG),
          })),
        ...[...groupsOf(subjects)]
          .filter(([, { path }]) => path !== undefined)
          .map(([group, { path }]) => ({ label: `group ${group}`, changelog: path })),
      ];
      problems.push(...missingPublicProblems(root, found, publicPatterns));
    }
    return report(`${subjects.length} changelog(s) of ${rest[0]} are ready to release`, problems);
  }

  const { subjects, problems } = checkTree(root, validate, publicPatterns);
  return report(`${subjects} package(s) and skill(s) under ${rest[0]} have a changelog`, problems);
}

/**
 * Prints the result.
 * @param {string} success - What to say when there is no problem.
 * @param {string[]} problems - The problems.
 * @returns {number} The exit code.
 */
function report(success, problems) {
  if (problems.length === 0) {
    process.stdout.write(`check-changelogs: ${success}.\n`);
    return 0;
  }
  process.stderr.write(
    `check-changelogs: ${problems.length} problem(s)\n${problems.map((problem) => `  - ${problem}`).join('\n')}\n`,
  );
  return 1;
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exitCode = main(process.argv.slice(2));
}
