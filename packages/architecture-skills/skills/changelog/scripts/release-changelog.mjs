#!/usr/bin/env node
// release-changelog: moves the entries under `## Unreleased` of a changelog under a new
// `## <version>` heading and leaves `## Unreleased` empty above it. No dependencies; Node 20+.
//
//   release-changelog <dir> <version>
//   release-changelog --bump <dir> [patch|minor|major|<version>] [--dry-run] [--json]
//   release-changelog --group <name> <dir> <version> [--dry-run]
//
// A `CHANGELOG.public.md` beside a `CHANGELOG.md` (the changelog skill, "The public changelog") is moved
// with it: all three forms move the `## Unreleased` entries of both files under the new version heading,
// and an empty `## Unreleased` of the public file gets the line `No changes for users of the package.`
// under the version, so the two files keep the same headings. `--group` writes the public twin of the
// group's changelog too, when one sits beside it, from the packages' public changelogs only.
//
// <dir> holds the `CHANGELOG.md` (a package's folder, or a skill's). The first form only moves the
// entries: the version must be a semantic version greater than the top version heading, and
// `## Unreleased` must hold an entry; raising `version` in `package.json` (or the skill's profile or
// `metadata.version`) is a step of its own, and `check-changelogs` fails until the two agree.
//
// `--bump` does both. It reads the current version of the package (its `version`) or of the skill
// (the `Version` of its architecture profile, else `metadata.version` of its `SKILL.md`) and the
// `## Unreleased` entries, and takes the smallest version the changelog skill allows: a
// `**Breaking:**` entry needs a new minor version in 0.x and a new major version from 1.0, otherwise a
// patch. A step or version asked for that is smaller is refused, naming the entry; a larger one is
// used. It writes the version into its home (replacing the one line, so no other field moves), then
// moves Unreleased under the new heading. It changes nothing when `## Unreleased` is empty or when
// anything is wrong. `--dry-run` writes nothing and prints the old and the new version and why;
// `--json` prints the same as one object, for scripts (`hasProfile` says whether the version's home
// is an architecture profile). A profile keeps no copy of an earlier version: a repository is
// checked against the one it installs (the architecture-profile skill, "Versioning").
//
// `--group <name> <dir> <version>` writes the changelog of a release group (the `changelog` skill,
// "Release groups"): the `CHANGELOG.md` in <dir> (the group's folder), titled `# Changelog: <name>`, gets one
// `## <version>` section built from the `## <version>` sections of the changelogs of the packages under <dir>
// whose `package.json` says `"changelog": { "group": "<name>" }`: their entries by category, each prefixed with
// the package's name. A package with no such section did not change in this release and adds nothing. The file
// is generated: it is made when missing, `## Unreleased` stays empty, and the version must be newer than the top
// one. `--dry-run` prints the section and writes nothing.
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORIES,
  CHANGELOG,
  compareVersions,
  findSubjects,
  NO_PUBLIC_CHANGES,
  PUBLIC_CHANGELOG,
  groupOf,
  GROUP_NAME,
  hasBreaking,
  isPublished,
  listFiles,
  parseChangelog,
  posix,
  readSkill,
  sectionHeadings,
  VERSION,
} from './changelog-lib.mjs';

const USAGE =
  'Usage: release-changelog <dir> <version>\n' +
  '       release-changelog --bump <dir> [patch|minor|major|<version>] [--dry-run] [--json]\n' +
  '       release-changelog --group <name> <dir> <version> [--dry-run]\n';

/**
 * Moves the `Unreleased` entries of a changelog text under a version heading.
 * @param {string} text - The changelog.
 * @param {string} version - The version being released.
 * @param {{ emptyBody?: string }} [options] - `emptyBody` is the text a version gets when `Unreleased` is
 *   empty (the public changelog's {@link NO_PUBLIC_CHANGES}); without it an empty `Unreleased` is refused.
 * @returns {string} The new text.
 * @throws {Error} When the version is not a version or not newer than the top one, or when
 *   `Unreleased` is missing or empty (and `emptyBody` is not given).
 */
export function releaseText(text, version, options = {}) {
  if (!VERSION.test(version)) throw new Error(`"${version}" is not a version such as 1.2.0`);
  const parsed = parseChangelog(text);
  const top = parsed.versions[0]?.version;
  if (top !== undefined && compareVersions(version, top) <= 0) {
    throw new Error(`${version} is not newer than ${top}, the top version heading`);
  }
  if (!parsed.hasUnreleased) throw new Error('there is no "## Unreleased" section');
  if (parsed.unreleased === '' && options.emptyBody === undefined) {
    throw new Error('"## Unreleased" has no entry to release');
  }
  const headings = sectionHeadings(text);
  const lines = text.split(/\r?\n/);
  const index = headings.findIndex(({ heading }) => heading === 'Unreleased');
  const start = headings[index].line;
  const end = headings[index + 1]?.line ?? lines.length;
  const body =
    lines
      .slice(start + 1, end)
      .join('\n')
      .trim() ||
    (options.emptyBody ?? '');
  const rebuilt = [
    ...lines.slice(0, start),
    '## Unreleased',
    '',
    `## ${version}`,
    '',
    body,
    '',
    ...lines.slice(end),
  ];
  return `${rebuilt.join('\n').replace(/\n+$/, '')}\n`;
}

/**
 * Moves the `Unreleased` entries of a public changelog under a version heading; an empty `Unreleased`
 * gets {@link NO_PUBLIC_CHANGES} under the version, so the headings stay equal to the internal file's.
 * @param {string} text - The `CHANGELOG.public.md`.
 * @param {string} version - The version being released.
 * @returns {string} The new text.
 * @throws {Error} When the version is not a version or not newer than the top one, or when
 *   `Unreleased` is missing.
 */
export function releasePublicText(text, version) {
  return releaseText(text, version, { emptyBody: NO_PUBLIC_CHANGES });
}

/**
 * {@link releasePublicText} with the file's name in the error.
 * @param {string} text - The `CHANGELOG.public.md`.
 * @param {string} version - The version being released.
 * @returns {string} The new text.
 * @throws {Error} The error of {@link releasePublicText}, prefixed with the file's name.
 */
function releasePublicOf(text, version) {
  try {
    return releasePublicText(text, version);
  } catch (error) {
    throw new Error(`${PUBLIC_CHANGELOG}: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Raises a version by a step, zeroing what follows; a pre-release part is dropped.
 * @param {string} version - The current version.
 * @param {'patch' | 'minor' | 'major'} step - The step.
 * @returns {string} The new version.
 * @throws {Error} When the version or the step is not valid.
 */
export function raiseVersion(version, step) {
  const match = VERSION.exec(version);
  if (match === null) throw new Error(`"${version}" is not a version such as 1.2.0`);
  const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (step === 'major') return `${major + 1}.0.0`;
  if (step === 'minor') return `${major}.${minor + 1}.0`;
  if (step === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`"${step}" is not patch, minor or major`);
}

/**
 * Finds the smallest step the changelog skill allows for the entries of a release: a
 * `**Breaking:**` entry needs a new minor version in 0.x and a new major version from 1.0, otherwise a
 * patch.
 * @param {string} version - The current version.
 * @param {string} unreleased - The body of `## Unreleased`.
 * @returns {{ step: 'patch' | 'minor' | 'major', why: string }} The step, and why in words.
 */
export function requiredStep(version, unreleased) {
  if (!hasBreaking(unreleased)) return { step: 'patch', why: 'patch: no Breaking entry' };
  const entry = /^\s*[-*] (\*\*Breaking:\*\*.*)$/m.exec(unreleased)?.[1]?.trim() ?? '';
  const shortEntry = entry.length > 100 ? `${entry.slice(0, 97)}...` : entry;
  const step = version.startsWith('0.') ? 'minor' : 'major';
  return { step, why: `${step}: ${shortEntry}` };
}

/**
 * Replaces the one line of a text that a pattern matches, refusing when it matches none or several, so
 * no other line moves.
 * @param {string} text - The file.
 * @param {RegExp} line - A pattern for the whole line, with a global and multiline flag and one
 *   capture group around what stays before the version and one around what stays after it.
 * @param {string} version - The new version.
 * @param {string} where - Where the version lives, for the refusal.
 * @returns {string} The new text.
 * @throws {Error} When the pattern does not match exactly once.
 */
function replaceOneLine(text, line, version, where) {
  const found = [...text.matchAll(line)];
  if (found.length !== 1) {
    throw new Error(
      `${found.length === 0 ? 'no' : `${found.length}`} line(s) hold the version in ${where}; expected exactly one, so it is not changed`,
    );
  }
  return text.replace(line, (_all, before, after) => `${before}${version}${after}`);
}

/**
 * Writes a version into the text of a `package.json`: the one top-level `"version"` line, found by the
 * indentation of the manifest's own keys, so a nested `"version"` key is never touched.
 * @param {string} text - The manifest.
 * @param {string} version - The new version.
 * @returns {string} The new text.
 * @throws {Error} When the manifest is not formatted with one key per line, or has not exactly one such line.
 */
export function setPackageVersion(text, version) {
  const indent = /^\{\r?\n([ \t]+)"/.exec(text)?.[1];
  if (indent === undefined) {
    throw new Error(
      'package.json is not formatted with one key per line, so its version is not changed',
    );
  }
  return replaceOneLine(
    text,
    new RegExp(`^(${indent}"version"\\s*:\\s*")[^"]*(",?[ \\t]*)$`, 'gm'),
    version,
    'package.json',
  );
}

/**
 * Writes a version into a profile: its one `- Version:` line.
 * @param {string} text - The profile.
 * @param {string} version - The new version.
 * @returns {string} The new text.
 * @throws {Error} When there is not exactly one such line.
 */
export function setProfileVersion(text, version) {
  return replaceOneLine(text, /^(- Version:[ \t]*)\S+([ \t]*)$/gm, version, 'the profile');
}

/**
 * Writes a version into the frontmatter of a `SKILL.md`: its one `metadata.version` line.
 * @param {string} text - The file.
 * @param {string} version - The new version.
 * @returns {string} The new text.
 * @throws {Error} When the frontmatter has not exactly one `metadata.version` line.
 */
export function setSkillVersion(text, version) {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---)/.exec(text);
  if (match === null) throw new Error('SKILL.md has no frontmatter, so its version is not changed');
  const lines = match[2].split('\n');
  let inMetadata = false;
  const at = [];
  lines.forEach((line, index) => {
    if (/^\S/.test(line)) inMetadata = /^metadata:\s*$/.test(line);
    else if (inMetadata && /^\s+version:\s*\S/.test(line)) at.push(index);
  });
  if (at.length !== 1) {
    throw new Error(
      `${at.length === 0 ? 'no' : `${at.length}`} metadata.version line(s) in SKILL.md; expected exactly one, so it is not changed`,
    );
  }
  lines[at[0]] = lines[at[0]].replace(
    /^(\s+version:\s*)(["']?)[^"'\s]+\2(\s*)$/,
    (_all, before, quote, after) => `${before}${quote}${version}${quote}${after}`,
  );
  return `${match[1]}${lines.join('\n')}${match[3]}${text.slice(match[0].length)}`;
}

/**
 * Finds where a folder keeps its version.
 * @param {string} dir - The absolute package or skill folder.
 * @param {(path: string) => string} [read] - Reads a file; the work tree's by default.
 * @returns {{ kind: 'package' | 'skill', name: string, version: string | undefined, file: string, set: (text: string, version: string) => string }}
 *   The subject, the file that holds the version and how to write it.
 * @throws {Error} When the folder is neither a published package nor a skill.
 */
export function versionHome(dir, read = (path) => readFileSync(path, 'utf8')) {
  const manifestPath = join(dir, 'package.json');
  if (existsSync(manifestPath)) {
    let manifest;
    try {
      manifest = JSON.parse(read(manifestPath));
    } catch (error) {
      throw new Error(
        `package.json cannot be read: ${error instanceof Error ? error.message : error}`,
      );
    }
    if (typeof manifest !== 'object' || manifest === null || !isPublished(manifest)) {
      throw new Error(
        'package.json is not a published package (a name, not private, a publishConfig)',
      );
    }
    return {
      kind: 'package',
      name: manifest.name,
      version: typeof manifest.version === 'string' ? manifest.version : undefined,
      file: manifestPath,
      set: setPackageVersion,
    };
  }
  if (!existsSync(join(dir, 'SKILL.md')))
    throw new Error('the folder holds no package.json and no SKILL.md');
  const skill = readSkill(dir);
  const profile = join(dir, `${basename(dir)}.architecture-profile.md`);
  const inProfile = skill.source.startsWith('the profile');
  return {
    kind: 'skill',
    name: skill.name,
    version: skill.version,
    file: inProfile ? profile : join(dir, 'SKILL.md'),
    set: inProfile ? setProfileVersion : setSkillVersion,
  };
}

/**
 * Plans the bump of a folder without writing anything.
 * @param {string} dir - The absolute package or skill folder.
 * @param {string | undefined} request - `patch`, `minor`, `major` or a version; undefined for the smallest.
 * @param {Map<string, string>} [overlay] - Texts of files that replace what is on disk (a caller that
 *   has changed files without writing them); a skill's profile and `SKILL.md` are read from disk.
 * @returns {{ name: string, kind: 'package' | 'skill', from: string, to: string, step: string, why: string, hasProfile: boolean, edits: { path: string, text: string }[], write: () => void }}
 *   The plan; `edits` are the new texts of the version file and the changelog, and `write` writes them.
 * @throws {Error} When anything is wrong: no version, no changelog, an empty `Unreleased`, a request
 *   that is smaller than the entries need (it names the entry), or a version that is not newer.
 */
export function planBump(dir, request, overlay = new Map()) {
  const read = (path) => overlay.get(path) ?? readFileSync(path, 'utf8');
  const home = versionHome(dir, read);
  if (home.version === undefined || !VERSION.test(home.version)) {
    throw new Error(`no valid version in ${home.file} (${home.version ?? 'missing'})`);
  }
  const changelogPath = join(dir, CHANGELOG);
  if (!existsSync(changelogPath)) throw new Error(`no ${CHANGELOG} in the folder`);
  const changelogText = read(changelogPath);
  const parsed = parseChangelog(changelogText);
  if (!parsed.hasUnreleased) throw new Error('there is no "## Unreleased" section');
  if (parsed.unreleased === '') throw new Error('"## Unreleased" has no entry to release');
  const from = home.version;
  const needed = requiredStep(from, parsed.unreleased);
  const smallest = raiseVersion(from, needed.step);
  let to = smallest;
  let why = needed.why;
  if (request !== undefined) {
    if (['patch', 'minor', 'major'].includes(request)) {
      to = raiseVersion(from, request);
    } else if (VERSION.test(request)) {
      to = request;
    } else {
      throw new Error(`"${request}" is not patch, minor, major or a version such as 1.2.0`);
    }
    if (compareVersions(to, from) <= 0) throw new Error(`${to} is not newer than ${from}`);
    if (compareVersions(to, smallest) < 0) {
      throw new Error(
        `${to} is too small for the entries: ${needed.why}; the smallest allowed is ${smallest}`,
      );
    }
    if (compareVersions(to, smallest) > 0)
      why = `${request}: asked for (the smallest is ${needed.why})`;
    else why = needed.why;
  }
  const released = releaseText(changelogText, to);
  const edits = [
    { path: home.file, text: home.set(read(home.file), to) },
    { path: changelogPath, text: released },
  ];
  const publicPath = join(dir, PUBLIC_CHANGELOG);
  if (existsSync(publicPath) || overlay.has(publicPath)) {
    edits.push({ path: publicPath, text: releasePublicOf(read(publicPath), to) });
  }
  return {
    name: home.name,
    kind: home.kind,
    from,
    to,
    step: needed.step,
    why,
    hasProfile: home.file.endsWith('.architecture-profile.md'),
    edits,
    write: () => {
      for (const { path, text } of edits) writeFileSync(path, text);
    },
  };
}

/**
 * Splits the body of a changelog section into its categories and, in each, its entries (a bullet with
 * its continuation lines).
 * @param {string} body - The text under a `##` heading.
 * @returns {Map<string, string[]>} The entries by category, in file order.
 */
export function sectionEntries(body) {
  const categories = new Map();
  let entries;
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = fenced ? null : /^### (.*)$/.exec(line);
    if (heading !== null) {
      entries = [];
      categories.set((heading[1] ?? '').trim(), entries);
    } else if (entries !== undefined) {
      if (!fenced && /^[-*] /.test(line)) entries.push(line);
      else if (entries.length > 0) entries[entries.length - 1] += `\n${line}`;
    }
  }
  for (const [name, list] of categories) {
    categories.set(
      name,
      list.map((entry) => entry.replace(/\s+$/, '')),
    );
  }
  return categories;
}

/**
 * Prefixes an entry with the name of its package: the name goes inside the entry's bold sentence, after a
 * `**Breaking:**` marker, so the entry keeps the shape the `changelog` template checks.
 * @param {string} entry - A bullet with its continuation lines.
 * @param {string} label - The package's name, without its scope.
 * @returns {string} The entry with the name in front of its bold sentence.
 */
export function prefixEntry(entry, label) {
  const match = /^([-*] )((?:\*\*Breaking:\*\* )?)\*\*([\s\S]+?)\*\*/.exec(entry);
  if (match === null) {
    const [, bullet = '- ', breaking = '', rest = ''] =
      /^([-*] )((?:\*\*Breaking:\*\* )?)([\s\S]*)$/.exec(entry) ?? [];
    return `${bullet}${breaking}**${label}:** ${rest}`;
  }
  return `${match[1]}${match[2]}**${label}: ${match[3]}**${entry.slice(match[0].length)}`;
}

/**
 * Builds the body of a group's section for a version from its packages' changelogs.
 * @param {string} version - The group's version.
 * @param {{ name: string, text: string }[]} packages - The packages in the order their entries go, each with
 *   its name and the text of its `CHANGELOG.md`.
 * @param {{ emptyBody?: string }} [options] - `emptyBody` is the body when packages had a section but none
 *   an entry (the public group changelog's {@link NO_PUBLIC_CHANGES}).
 * @returns {{ body: string, from: string[] }} The categories with their entries, and the names of the packages
 *   that had a section for the version; the body is empty when none had.
 */
export function groupBody(version, packages, options = {}) {
  const merged = new Map(CATEGORIES.map((category) => [category, []]));
  const from = [];
  for (const { name, text } of packages) {
    const section = parseChangelog(text).versions.find((entry) => entry.version === version);
    if (section === undefined) continue;
    from.push(name);
    const label = name.replace(/^@[^/]+\//, '');
    for (const [category, entries] of sectionEntries(section.body)) {
      merged.get(category)?.push(...entries.map((entry) => prefixEntry(entry, label)));
    }
  }
  const body = CATEGORIES.filter((category) => merged.get(category).length > 0)
    .map((category) => `### ${category}\n\n${merged.get(category).join('\n\n')}`)
    .join('\n\n');
  return { body: body === '' && from.length > 0 ? (options.emptyBody ?? '') : body, from };
}

/**
 * Adds the section of a version to the changelog text of a group, or makes the text.
 * @param {string | undefined} text - The group's changelog, or undefined when it is not made yet.
 * @param {string} group - The group's name.
 * @param {string} version - The group's version.
 * @param {string} body - The section's categories ({@link groupBody}).
 * @returns {string} The new text.
 * @throws {Error} When the text is not the group's changelog, its `Unreleased` holds text (the file is generated:
 *   nobody edits it), or the version is not newer than its top one.
 */
export function releaseGroupText(text, group, version, body) {
  if (!VERSION.test(version)) throw new Error(`"${version}" is not a version such as 1.2.0`);
  if (body === '') throw new Error(`no package of the group has a section ${version}`);
  const intro = `Release notes of the ${group} group, one section per release, generated from the changelogs of its packages by \`release-changelog --group\`. Do not edit it by hand.`;
  if (text === undefined) {
    return `# Changelog: ${group}\n\n${intro}\n\n## Unreleased\n\n## ${version}\n\n${body}\n`;
  }
  const parsed = parseChangelog(text);
  if (parsed.title !== `Changelog: ${group}`) {
    throw new Error(`the title is "${parsed.title ?? ''}", it must be "Changelog: ${group}"`);
  }
  if (!parsed.hasUnreleased) throw new Error('there is no "## Unreleased" section');
  if (parsed.unreleased !== '') {
    throw new Error('"## Unreleased" of a group changelog is generated and must stay empty');
  }
  const top = parsed.versions[0]?.version;
  if (top !== undefined && compareVersions(version, top) <= 0) {
    throw new Error(`${version} is not newer than ${top}, the top version heading`);
  }
  const headings = sectionHeadings(text);
  const lines = text.split(/\r?\n/);
  const at = headings.findIndex(({ heading }) => heading === 'Unreleased');
  const start = headings[at].line;
  const end = headings[at + 1]?.line ?? lines.length;
  const rebuilt = [
    ...lines.slice(0, start),
    '## Unreleased',
    '',
    `## ${version}`,
    '',
    body,
    '',
    ...lines.slice(end),
  ];
  return `${rebuilt.join('\n').replace(/\n+$/, '')}\n`;
}

/**
 * Plans the changelog of a release group without writing anything.
 * @param {object} options - What to plan.
 * @param {string} options.group - The group's name.
 * @param {string} options.dir - The absolute folder of the group; its `CHANGELOG.md` is the group's.
 * @param {string} options.version - The group's version.
 * @param {string[]} [options.order] - The absolute folders of the packages in the order their entries go;
 *   the packages under `dir` sorted by folder when omitted.
 * @param {Map<string, string>} [options.overlay] - Texts that replace files on disk (a caller that has changed
 *   files without writing them).
 * @param {boolean} [options.public] - Plan the group's `CHANGELOG.public.md` from the packages' public
 *   changelogs (a package without one adds nothing, and no internal entry reaches the text).
 * @returns {{ path: string, text: string, from: string[] }} The group changelog's path, its new text and the names
 *   of the packages that contributed.
 * @throws {Error} When the group name is not a name, a package named in `order` is not one of the group, or the
 *   text cannot take the version ({@link releaseGroupText}).
 */
export function planGroup({
  group,
  dir,
  version,
  order,
  overlay = new Map(),
  public: isPublic = false,
}) {
  const file = isPublic ? PUBLIC_CHANGELOG : CHANGELOG;
  if (!GROUP_NAME.test(group)) throw new Error(`"${group}" is not a group name`);
  const read = (path) => overlay.get(path) ?? readFileSync(path, 'utf8');
  const members = findSubjects(dir, listFiles(dir)).filter(
    (subject) => subject.kind === 'package' && groupOf(subject.manifest) === group,
  );
  const ordered =
    order === undefined
      ? members
      : order.map((folder) => {
          const member = members.find((subject) => subject.dir === folder);
          if (member === undefined) {
            throw new Error(
              `${posix(relative(dir, folder))} is not a package of the group ${group}`,
            );
          }
          return member;
        });
  const packages = ordered
    .filter(
      (subject) => existsSync(join(subject.dir, file)) || overlay.has(join(subject.dir, file)),
    )
    .map((subject) => ({ name: subject.name, text: read(join(subject.dir, file)) }));
  const { body, from } = groupBody(
    version,
    packages,
    isPublic ? { emptyBody: NO_PUBLIC_CHANGES } : {},
  );
  const path = join(dir, file);
  const text = releaseGroupText(
    existsSync(path) || overlay.has(path) ? read(path) : undefined,
    group,
    version,
    body,
  );
  return { path, text, from };
}

/**
 * Runs the command line.
 * @param {string[]} argv - The arguments after the script.
 * @returns {number} The exit code.
 */
export function main(argv) {
  const flags = argv.filter((arg) => arg.startsWith('--'));
  const rest = argv.filter((arg) => !arg.startsWith('--'));
  const bump = flags.includes('--bump');
  const group = flags.includes('--group');
  const unknown = flags.find(
    (flag) => !['--bump', '--dry-run', '--json', '--group'].includes(flag),
  );
  if (group && !bump) return groupMain(rest, flags.includes('--dry-run'));
  if (unknown !== undefined || group || (!bump && flags.length > 0)) {
    process.stderr.write(`release-changelog: unknown option ${unknown ?? flags[0]}\n${USAGE}`);
    return 2;
  }
  if (bump) return bumpMain(rest, flags.includes('--dry-run'), flags.includes('--json'));
  if (rest.length !== 2) {
    process.stderr.write(USAGE);
    return 2;
  }
  const path = join(resolve(rest[0]), CHANGELOG);
  if (!existsSync(path)) {
    process.stderr.write(`release-changelog: no ${CHANGELOG} in ${rest[0]}\n`);
    return 1;
  }
  const publicPath = join(resolve(rest[0]), PUBLIC_CHANGELOG);
  try {
    const released = releaseText(readFileSync(path, 'utf8'), rest[1]);
    const releasedPublic = existsSync(publicPath)
      ? releasePublicOf(readFileSync(publicPath, 'utf8'), rest[1])
      : undefined;
    writeFileSync(path, released);
    if (releasedPublic !== undefined) writeFileSync(publicPath, releasedPublic);
  } catch (error) {
    process.stderr.write(`release-changelog: ${error instanceof Error ? error.message : error}\n`);
    return 1;
  }
  process.stdout.write(
    `release-changelog: ${rest[0]}/${CHANGELOG}: Unreleased is now ${rest[1]}.\n`,
  );
  return 0;
}

/**
 * Runs `--group`.
 * @param {string[]} rest - The group's name, its folder and the version.
 * @param {boolean} dryRun - Whether to write nothing.
 * @returns {number} The exit code.
 */
function groupMain(rest, dryRun) {
  if (rest.length !== 3) {
    process.stderr.write(USAGE);
    return 2;
  }
  const [group, folder, version] = rest;
  let plan;
  try {
    plan = planGroup({ group, dir: resolve(folder), version });
    const twin = join(resolve(folder), PUBLIC_CHANGELOG);
    const publicPlan = existsSync(twin)
      ? planGroup({ group, dir: resolve(folder), version, public: true })
      : undefined;
    if (!dryRun) {
      writeFileSync(plan.path, plan.text);
      if (publicPlan !== undefined) writeFileSync(publicPlan.path, publicPlan.text);
    }
  } catch (error) {
    process.stderr.write(
      `release-changelog: group ${group}: ${error instanceof Error ? error.message : error}\n`,
    );
    return 1;
  }
  process.stdout.write(
    `release-changelog: ${folder}/${CHANGELOG}: group ${group} ${version} from ${plan.from.join(', ')}${dryRun ? ', nothing written' : ''}.\n`,
  );
  return 0;
}

/**
 * Runs `--bump`.
 * @param {string[]} rest - The folder, and the step or version when given.
 * @param {boolean} dryRun - Whether to write nothing.
 * @param {boolean} json - Whether to print one JSON object.
 * @returns {number} The exit code.
 */
function bumpMain(rest, dryRun, json) {
  if (rest.length < 1 || rest.length > 2) {
    process.stderr.write(USAGE);
    return 2;
  }
  let plan;
  try {
    plan = planBump(resolve(rest[0]), rest[1]);
    if (!dryRun) plan.write();
  } catch (error) {
    process.stderr.write(
      `release-changelog: ${rest[0]}: ${error instanceof Error ? error.message : error}\n`,
    );
    return 1;
  }
  const { name, kind, from, to, step, why, hasProfile } = plan;
  if (json) {
    process.stdout.write(
      `${JSON.stringify({ dir: rest[0], name, kind, from, to, step, why, dryRun, written: !dryRun, hasProfile })}\n`,
    );
  } else {
    process.stdout.write(
      `release-changelog: ${rest[0]}: ${kind} ${name} ${from} -> ${to} (${why})${dryRun ? ', nothing written' : ''}.\n`,
    );
  }
  return 0;
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exitCode = main(process.argv.slice(2));
}
