// Shared helpers of check-changelogs and release-changelog: finding the published packages and
// the skills under a folder, reading a skill's version, and reading a changelog's headings.
// Plain Node, no dependencies.
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

export const CHANGELOG = 'CHANGELOG.md';
/** The file beside a `CHANGELOG.md` that is written for the readers of a public copy (the changelog skill, "The public changelog"). */
export const PUBLIC_CHANGELOG = 'CHANGELOG.public.md';
/** The one line of a version section of a public changelog when that version changed nothing a public reader needs. */
export const NO_PUBLIC_CHANGES = 'No changes for users of the package.';
/** The categories of an entry, in the order a section lists them. */
export const CATEGORIES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
/** A semantic version; the pre-release part is optional. */
export const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

const SKIPPED_FOLDERS = new Set(['node_modules', '.git', 'dist', '.notes']);

/**
 * Tells whether a path lies in the person's notes, a `.notes/` folder at any depth (or a
 * `planning/notes/` folder, their earlier place), which no script reads.
 * @param {string} path - A path with forward slashes.
 * @returns {boolean} True inside such a folder.
 */
export const isInNotesFolder = (path) => {
  const folders = path.split('/').slice(0, -1);
  return folders.some(
    (segment, at) =>
      segment === '.notes' || (segment === 'notes' && folders[at - 1] === 'planning'),
  );
};

/**
 * Turns a path into one with forward slashes.
 * @param {string} path - A path.
 * @returns {string} The path with `/`.
 */
export const posix = (path) => path.split('\\').join('/');

/**
 * Lists the files under a folder: the tracked and the untracked-but-not-ignored ones when the
 * folder is in a Git work tree, else every file below it except `node_modules`, `.git`, `dist` and
 * `.notes`. Links are left out, so a skill reached by a link is found once, where it lives, and so
 * are the person's notes (`.notes/` or `planning/notes/` at any depth), which are never read.
 * @param {string} root - The absolute folder.
 * @returns {string[]} The paths relative to the folder, forward slashes, sorted.
 */
export function listFiles(root) {
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.'],
      { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return output
      .split('\0')
      .filter((path) => path !== '' && !isInNotesFolder(path))
      .filter((path) => {
        try {
          return lstatSync(join(root, path)).isFile();
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    const found = [];
    const walk = (folder) => {
      for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
        const path = folder === '' ? entry.name : `${folder}/${entry.name}`;
        if (entry.isDirectory()) {
          if (!SKIPPED_FOLDERS.has(entry.name) && !isInNotesFolder(`${path}/x`)) walk(path);
        } else if (entry.isFile()) {
          found.push(path);
        }
      }
    };
    walk('');
    return found.sort();
  }
}

/**
 * Reads the frontmatter of a `SKILL.md`: its `name` and its `metadata.version`.
 * @param {string} text - The file.
 * @returns {{ name?: string, version?: string }} What it declares.
 */
export function readSkillFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (match === null) return {};
  const lines = (match[1] ?? '').split(/\r?\n/);
  const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, '$2');
  let name;
  let version;
  let inMetadata = false;
  for (const line of lines) {
    if (/^\S/.test(line)) {
      inMetadata = /^metadata:\s*$/.test(line);
      const own = /^name:\s*(.+)$/.exec(line);
      if (own !== null) name = unquote(own[1] ?? '');
    } else if (inMetadata) {
      const own = /^\s+version:\s*(.+)$/.exec(line);
      if (own !== null) version = unquote(own[1] ?? '');
    }
  }
  return { name, version };
}

/**
 * Reads a skill: its name, and its version from the profile it carries, else from
 * `metadata.version` of its `SKILL.md`.
 * @param {string} dir - The absolute skill folder.
 * @returns {{ name: string, version: string | undefined, source: string }} The skill.
 */
export function readSkill(dir) {
  const frontmatter = readSkillFrontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
  const profile = join(dir, `${basename(dir)}.architecture-profile.md`);
  if (existsSync(profile)) {
    const match = /^- Version:\s*(\S+)\s*$/m.exec(readFileSync(profile, 'utf8'));
    if (match !== null) {
      return {
        name: frontmatter.name ?? basename(dir),
        version: match[1],
        source: `the profile (${basename(profile)})`,
      };
    }
  }
  return {
    name: frontmatter.name ?? basename(dir),
    version: frontmatter.version,
    source: '`metadata.version` of SKILL.md',
  };
}

/**
 * Tells whether a package manifest is a published package: it has a name, is not private and names
 * the registry it goes to with a `publishConfig` object (GitHub Packages, lab D21). Without a
 * `publishConfig`, `pnpm publish` would send the package to the default registry, so such a manifest
 * is not published here but a mistake ({@link publishRuleProblem}). The lab package's
 * `staticPublishFailure` (`published.rules.ts`) applies the same test to the packages `lab add` copies.
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {boolean} True for a published package.
 */
export function isPublished(manifest) {
  return (
    typeof manifest.name === 'string' &&
    manifest.private !== true &&
    typeof manifest.publishConfig === 'object' &&
    manifest.publishConfig !== null &&
    !Array.isArray(manifest.publishConfig)
  );
}

/**
 * Words the way a named manifest breaks the rule of {@link isPublished}: it is neither private nor
 * given a `publishConfig`, or it is both private and given one.
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {string | undefined} The problem with its fix; undefined for an unnamed manifest, a
 *   published package and a private package without a `publishConfig`.
 */
export function publishRuleProblem(manifest) {
  if (typeof manifest.name !== 'string') return undefined;
  if (manifest.private !== true && !isPublished(manifest)) {
    return 'not private and no publishConfig; add "publishConfig": { "registry": … } to publish it (GitHub Packages, lab D21), or "private": true';
  }
  if (manifest.private === true && manifest.publishConfig !== undefined) {
    return 'private and has a publishConfig; remove one';
  }
  return undefined;
}

/**
 * Tells whether a package manifest is a named private package: a workspace package that nothing
 * publishes, which a published package can bundle (see {@link coversOf}).
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {boolean} True for a named, unpublished package.
 */
export function isPrivatePackage(manifest) {
  return typeof manifest.name === 'string' && !isPublished(manifest);
}

/**
 * Reads a `package.json`.
 * @param {string} path - The absolute path.
 * @returns {Record<string, unknown> | undefined} The manifest, or undefined when it is missing,
 *   unreadable or not a JSON object.
 */
export function readManifest(path) {
  if (!existsSync(path)) return undefined;
  try {
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    return typeof manifest === 'object' && manifest !== null && !Array.isArray(manifest)
      ? manifest
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads the `package.json` files among a file list: the folder of each, with its manifest. A file
 * that cannot be read as a manifest is left out.
 * @param {string} root - The absolute folder the list is relative to.
 * @param {string[]} files - The paths relative to the folder.
 * @returns {{ dir: string, manifest: Record<string, unknown> }[]} Each folder, absolute, with its manifest.
 */
export function readManifests(root, files) {
  return files
    .filter((file) => basename(file) === 'package.json')
    .flatMap((file) => {
      const manifest = readManifest(join(root, file));
      return manifest === undefined ? [] : [{ dir: join(root, dirname(file)), manifest }];
    });
}

/**
 * Reads the names a published package covers: `changelog.covers` of its `package.json`, the private
 * packages its build bundles, whose shipped changes are changes of the published package too (the
 * `changelog` skill, "Bundled private packages").
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {string[] | null | undefined} The names; undefined when the manifest has no `changelog`
 *   field or the field has no `covers` key (it may hold only a `group`), null when `covers` is not a
 *   list of names or the field is not an object.
 */
export function coversOf(manifest) {
  if (manifest.changelog === undefined) return undefined;
  const changelog = manifest.changelog;
  if (typeof changelog !== 'object' || changelog === null || Array.isArray(changelog)) return null;
  if (changelog.covers === undefined) return undefined;
  const covers = changelog.covers;
  return Array.isArray(covers) && covers.every((name) => typeof name === 'string' && name !== '')
    ? covers
    : null;
}

/** A release group's name: lower-case words joined by `-`, as its tag `<group>@<version>` spells it. */
export const GROUP_NAME = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Reads the release group a published package belongs to: `changelog.group` of its `package.json` (the
 * `changelog` skill, "Release groups").
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {string | null | undefined} The group's name; undefined when the manifest names no group, null
 *   when `changelog.group` is not a group name.
 */
export function groupOf(manifest) {
  const changelog = manifest.changelog;
  if (typeof changelog !== 'object' || changelog === null || Array.isArray(changelog)) {
    return undefined;
  }
  if (changelog.group === undefined) return undefined;
  return typeof changelog.group === 'string' && GROUP_NAME.test(changelog.group)
    ? changelog.group
    : null;
}

/**
 * Finds the generated changelog of a release group: the nearest `CHANGELOG.md`, in a folder above a
 * package's own (the package's changelog is not the group's), whose title is `# Changelog: <group>`. The search stops at the folder that holds
 * a `.git` entry (the repository's top) or at the file system's root.
 * @param {string} dir - The absolute folder of a package of the group.
 * @param {string} group - The group's name.
 * @returns {string | undefined} The changelog's absolute path, or undefined when there is none yet.
 */
export function findGroupChangelog(dir, group) {
  for (let folder = dirname(dir); ; folder = dirname(folder)) {
    const path = join(folder, CHANGELOG);
    if (existsSync(path)) {
      try {
        if (parseChangelog(readFileSync(path, 'utf8')).title === `Changelog: ${group}`) return path;
      } catch {
        // an unreadable file is not the group's changelog
      }
    }
    if (existsSync(join(folder, '.git')) || dirname(folder) === folder) return undefined;
  }
}

/**
 * Tells whether a published package contains a folder: some folder above it (or it) holds a
 * published `package.json`. A skill is shipped by that package; a skill that no package contains
 * (a lab's own) is not shipped, and needs no changelog.
 * @param {string} dir - The absolute folder.
 * @returns {boolean} True when a published package contains the folder.
 */
export function isShippedFolder(dir) {
  for (let folder = dir; ; folder = dirname(folder)) {
    const manifest = join(folder, 'package.json');
    if (existsSync(manifest)) {
      try {
        if (isPublished(JSON.parse(readFileSync(manifest, 'utf8')))) return true;
      } catch {
        // an unreadable manifest publishes nothing
      }
    }
    if (dirname(folder) === folder) return false;
  }
}

/**
 * Finds the published packages and the skills among a file list. A skill that no published
 * package contains is left out (see {@link isShippedFolder}).
 * @param {string} root - The absolute folder the list is relative to.
 * @param {string[]} files - The paths relative to the folder.
 * @returns {{ kind: 'package' | 'skill', dir: string, name: string, version: string | undefined, source: string, manifest?: Record<string, unknown> }[]}
 *   Each subject with its absolute folder, sorted by folder.
 */
export function findSubjects(root, files) {
  const subjects = [];
  for (const file of files) {
    const name = basename(file);
    const dir = join(root, dirname(file));
    if (name === 'package.json') {
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(join(root, file), 'utf8'));
      } catch {
        continue;
      }
      if (isPublished(manifest)) {
        subjects.push({
          kind: 'package',
          dir,
          name: manifest.name,
          version: typeof manifest.version === 'string' ? manifest.version : undefined,
          source: '`version` of package.json',
          manifest,
        });
      }
    } else if (name === 'SKILL.md' && isShippedFolder(dir)) {
      subjects.push({ kind: 'skill', dir, ...readSkill(dir) });
    }
  }
  return subjects.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
}

/**
 * Tells whether a package's `files` list includes its changelog. A manifest without `files`
 * ships everything, so it does.
 * @param {Record<string, unknown>} manifest - A parsed `package.json`.
 * @returns {boolean} True when `CHANGELOG.md` is shipped.
 */
export function listsChangelog(manifest) {
  if (!Array.isArray(manifest.files)) return true;
  return manifest.files.some((pattern) => {
    if (typeof pattern !== 'string' || pattern.startsWith('!')) return false;
    const source = pattern
      .replace(/^\.\//, '')
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*');
    return new RegExp(`^${source}$`).test(CHANGELOG);
  });
}

/**
 * Tells whether the checker never reads a folder: the root's `archive/` (the frozen predecessor
 * repository, which no tool checks), `node_modules`, a dot-folder at any depth (`.notes/`, the
 * person's, included) and a `planning/notes/` folder (the notes' earlier place). No manifest in such a
 * folder is read, and no package is found in one.
 * @param {string} folder - A folder's path relative to the Git top level, with forward slashes.
 * @returns {boolean} True for such a folder.
 */
export function isUnscanned(folder) {
  const segments = folder.split('/').filter((segment) => segment !== '' && segment !== '.');
  if (segments[0] === 'archive' || segments.includes('node_modules')) return true;
  return segments.some(
    (segment, at) =>
      segment.startsWith('.') || (segment === 'notes' && segments[at - 1] === 'planning'),
  );
}

/**
 * Reads the `packages` list of a `pnpm-workspace.yaml`: its globs, with quotes and comments dropped.
 * A glob that starts with `!` takes packages out (see {@link workspaceFolders}).
 * @param {string} text - The file's text.
 * @returns {string[]} The globs, in the order the file lists them.
 */
export function workspacePatterns(text) {
  const patterns = [];
  let inPackages = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^packages:/.test(line)) {
      inPackages = true;
    } else if (/^[^\s#]/.test(line)) {
      inPackages = false;
    } else if (inPackages) {
      const item = /^\s*-\s*(.*?)\s*(?:#.*)?$/.exec(line)?.[1] ?? '';
      const pattern = item.replace(/^(['"])(.*)\1$/, '$2');
      if (pattern !== '') patterns.push(pattern);
    }
  }
  return patterns;
}

/**
 * A workspace glob's segment as a regular expression: `*` is any run of characters of a name, `?`
 * one character.
 * @param {string} segment - One segment of a glob that holds `*` or `?`.
 * @returns {RegExp} The expression, anchored.
 */
function segmentRegExp(segment) {
  const source = segment.replace(/[*?]|[.+^${}()|[\]\\]/g, (char) =>
    char === '*' ? '[^/]*' : char === '?' ? '[^/]' : `\\${char}`,
  );
  return new RegExp(`^${source}$`);
}

/**
 * The folders directly inside a folder that the checker reads (not symbolic links).
 * @param {string} root - The absolute Git top level.
 * @param {string} folder - A folder relative to the root (`''` for the root).
 * @returns {string[]} The folders, relative to the root.
 */
function childFolders(root, folder) {
  try {
    return readdirSync(join(root, folder), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => (folder === '' ? entry.name : `${folder}/${entry.name}`))
      .filter((path) => !isUnscanned(path));
  } catch {
    return [];
  }
}

/**
 * A folder and every folder below it that the checker reads.
 * @param {string} root - The absolute Git top level.
 * @param {string} folder - A folder relative to the root.
 * @returns {string[]} The folders, the folder first.
 */
function folderTree(root, folder) {
  return [folder, ...childFolders(root, folder).flatMap((child) => folderTree(root, child))];
}

/**
 * Tells whether a path is a folder, and not a symbolic link to one.
 * @param {string} path - The absolute path.
 * @returns {boolean} True for a folder.
 */
function isFolder(path) {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Lists the folders a workspace glob names, relative to the root. A segment may hold `*` or `?`, and
 * `**` stands for any number of folders; a folder the checker never reads ({@link isUnscanned}) is
 * never listed or entered.
 * @param {string} root - The absolute Git top level.
 * @param {string} pattern - The glob, without a leading `!`.
 * @returns {string[]} The folders, relative to the root.
 */
function globFolders(root, pattern) {
  let folders = [''];
  for (const segment of pattern.split('/').filter((part) => part !== '' && part !== '.')) {
    folders = folders.flatMap((folder) => {
      if (segment === '**') return folderTree(root, folder);
      if (/[*?]/.test(segment)) {
        const matches = segmentRegExp(segment);
        return childFolders(root, folder).filter((path) => matches.test(basename(path)));
      }
      const path = folder === '' ? segment : `${folder}/${segment}`;
      return !isUnscanned(path) && isFolder(join(root, path)) ? [path] : [];
    });
  }
  return folders;
}

/**
 * Lists the folders a workspace names: those its globs match, less those an exclusion (`!glob`)
 * matches.
 * @param {string} root - The absolute Git top level.
 * @param {string[]} patterns - The globs of the workspace file.
 * @returns {string[]} The folders, relative to the root, sorted.
 */
export function workspaceFolders(root, patterns) {
  const included = new Set();
  const excluded = new Set();
  for (const pattern of patterns) {
    const target = pattern.startsWith('!') ? excluded : included;
    for (const folder of globFolders(root, pattern.replace(/^!/, ''))) target.add(folder);
  }
  return [...included].filter((folder) => !excluded.has(folder)).sort();
}

/**
 * Lists the packages of the workspace at the root, each with its manifest. They are the folders the
 * root `pnpm-workspace.yaml` names; without such a file, or one with no `packages` list, they are the
 * folders of the tracked manifests the checker reads ({@link isUnscanned}). A manifest elsewhere is
 * never read.
 * @param {string} root - The absolute Git top level.
 * @returns {{ dir: string, manifest: Record<string, unknown> }[]} Each package, with its absolute folder.
 */
export function workspacePackages(root) {
  let workspace;
  try {
    workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  } catch {
    workspace = undefined;
  }
  const patterns = workspace === undefined ? [] : workspacePatterns(workspace);
  if (patterns.length === 0) {
    return readManifests(
      root,
      listFiles(root).filter((file) => !isUnscanned(dirname(file))),
    );
  }
  return workspaceFolders(root, patterns).flatMap((folder) => {
    const manifest = readManifest(join(root, folder, 'package.json'));
    return manifest === undefined ? [] : [{ dir: join(root, folder), manifest }];
  });
}

/**
 * Lists the `## ` headings of a changelog, outside fenced code.
 * @param {string} text - The changelog.
 * @returns {{ heading: string, line: number }[]} Each heading text and its zero-based line.
 */
export function sectionHeadings(text) {
  const found = [];
  let fenced = false;
  text.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const match = fenced ? null : /^## (.*)$/.exec(line);
    if (match !== null) found.push({ heading: (match[1] ?? '').trim(), line: index });
  });
  return found;
}

/**
 * Splits a changelog into its title line, the `Unreleased` body and the version sections.
 * @param {string} text - The changelog.
 * @returns {{ title: string | undefined, hasUnreleased: boolean, unreleasedFirst: boolean, unreleased: string, versions: { version: string, body: string }[], otherHeadings: string[] }}
 *   The parts; `versions` is in file order (newest first when the file is right), and
 *   `unreleasedFirst` is false when `Unreleased` follows a version heading (the template cannot see
 *   that: it keeps the declared section apart from the open ones); `otherHeadings` lists the `##` headings that are neither `Unreleased` nor a bare version.
 */
export function parseChangelog(text) {
  const lines = text.split(/\r?\n/);
  const headings = sectionHeadings(text);
  const title = lines
    .find((line) => /^# /.test(line))
    ?.slice(2)
    .trim();
  const bodyOf = (index) => {
    const start = (headings[index]?.line ?? 0) + 1;
    const end = headings[index + 1]?.line ?? lines.length;
    return lines.slice(start, end).join('\n').trim();
  };
  let hasUnreleased = false;
  let unreleasedFirst = true;
  let unreleased = '';
  const versions = [];
  const otherHeadings = [];
  headings.forEach(({ heading }, index) => {
    if (heading === 'Unreleased') {
      hasUnreleased = true;
      if (versions.length > 0) unreleasedFirst = false;
      unreleased = bodyOf(index);
    } else if (VERSION.test(heading)) {
      versions.push({ version: heading, body: bodyOf(index) });
    } else {
      otherHeadings.push(heading);
    }
  });
  return { title, hasUnreleased, unreleasedFirst, unreleased, versions, otherHeadings };
}

/**
 * Compares two versions by major, minor and patch; a pre-release sorts before its release.
 * @param {string} left - A version.
 * @param {string} right - Another one.
 * @returns {number} Negative when left is older, positive when newer, 0 when equal.
 */
export function compareVersions(left, right) {
  const a = VERSION.exec(left);
  const b = VERSION.exec(right);
  if (a === null || b === null) throw new Error(`not versions: ${left}, ${right}`);
  for (const index of [1, 2, 3]) {
    const difference = Number(a[index]) - Number(b[index]);
    if (difference !== 0) return difference;
  }
  if (a[4] === undefined && b[4] !== undefined) return 1;
  if (a[4] !== undefined && b[4] === undefined) return -1;
  return (a[4] ?? '') < (b[4] ?? '') ? -1 : (a[4] ?? '') > (b[4] ?? '') ? 1 : 0;
}

/**
 * Tells whether `to` is a big enough step from `from` for a breaking change: from `1.0.0` a new
 * major version, in `0.x` at least a new minor version.
 * @param {string} from - The version before.
 * @param {string} to - The version after.
 * @returns {boolean} True when the step is big enough.
 */
export function isBreakingStep(from, to) {
  const a = VERSION.exec(from);
  const b = VERSION.exec(to);
  if (a === null || b === null) return false;
  if (Number(b[1]) !== Number(a[1])) return Number(b[1]) > Number(a[1]);
  if (Number(a[1]) === 0) return Number(b[2]) > Number(a[2]);
  return false;
}

/**
 * Tells whether a section body holds an entry that starts with `**Breaking:**`.
 * @param {string} body - The section's text.
 * @returns {boolean} True when it does.
 */
export function hasBreaking(body) {
  return /^\s*[-*] \*\*Breaking:\*\*/m.test(body);
}

/** A line that opens or closes a fenced code block, indented or not. */
const FENCE = /^\s*(```|~~~)/;

/**
 * Splits a section body into its entries: each bullet at the start of a line, with the indented
 * and blank lines that follow it, up to the next bullet, `###` heading or unindented line. A fenced
 * code block belongs to the entry it is in, and a line inside it starts or ends no entry.
 * @param {string} body - The section's text.
 * @returns {string[]} The entries, in order, each without its trailing blank lines.
 */
export function entriesOf(body) {
  const entries = [];
  let current;
  let fenced = false;
  const close = () => {
    if (current !== undefined) entries.push(current.join('\n').trimEnd());
    current = undefined;
  };
  for (const line of body.split(/\r?\n/)) {
    const fence = FENCE.test(line);
    if (fenced || fence) {
      if (fence) fenced = !fenced;
      current?.push(line);
      continue;
    }
    if (/^[-*] /.test(line)) {
      close();
      current = [line];
    } else if (current !== undefined && (line.trim() === '' || /^\s/.test(line))) {
      current.push(line);
    } else {
      close();
    }
  }
  close();
  return entries;
}

/**
 * Tells whether an entry opens with `**Breaking:**`.
 * @param {string} entry - One entry, as {@link entriesOf} returns it.
 * @returns {boolean} True when it does.
 */
export function isBreakingEntry(entry) {
  return /^[-*] \*\*Breaking:\*\*/.test(entry);
}

/**
 * Tells whether an entry carries a `**Migration:**` line: an indented line of its own that opens
 * with the marker and has text after it (the changelog skill, "The shape"). The marker inside the
 * entry's first line, after other text on a line, or inside a fenced code block, does not count.
 * @param {string} entry - One entry, as {@link entriesOf} returns it.
 * @returns {boolean} True when it does.
 */
export function hasMigration(entry) {
  let fenced = false;
  return entry
    .split(/\r?\n/)
    .slice(1)
    .some((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return false;
      }
      return !fenced && /^\s+\*\*Migration:\*\*\s*\S/.test(line);
    });
}

/**
 * Names a path relative to the current folder for a message.
 * @param {string} path - An absolute path.
 * @returns {string} The relative path, or `.` for the folder itself.
 */
export function shown(path) {
  return relative(process.cwd(), path) || '.';
}
