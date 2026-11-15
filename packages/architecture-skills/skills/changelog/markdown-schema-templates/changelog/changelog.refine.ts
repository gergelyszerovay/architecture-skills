import type { z } from 'zod';

/**
 * Cross-section invariants for `changelog.template.md`. A version heading is a section's key, so
 * the template cannot declare it; these rules check what the open sections hold.
 *
 * Rules enforced here:
 *
 * 1. **Version headings are versions** — `## <major>.<minor>.<patch>` (with an optional
 *    pre-release part) and nothing else: no date, no `v`, no note.
 * 2. **Newest first** — the versions are strictly descending.
 * 3. **Categories** — inside `## Unreleased` and every version, only `### Added`,
 *    `### Changed`, `### Deprecated`, `### Removed`, `### Fixed` and `### Security`, in that
 *    order, each once and not empty. Nothing sits between a `##` heading and the first `###`.
 * 4. **Entries** — a category is a list of bullets, each opening with a bold sentence, after an
 *    optional `**Breaking:**`.
 * 5. **The `**Migration:**` line** — an indented line that opens with `**Migration:**` belongs to
 *    an entry (it follows a bullet of its category), is the entry's only one, and has text after
 *    the marker. It says what to change in existing code; it runs to the end of the entry.
 * 6. **Nothing public** — a version section of a `CHANGELOG.public.md` may hold the single line
 *    `No changes for users of the package.` instead of categories (the version changed nothing a
 *    public reader needs, so the two changelogs keep the same headings).
 */

const NO_PUBLIC_CHANGES = 'No changes for users of the package.';
const CATEGORIES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'] as const;
const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const BULLET = /^[*-] (?:\*\*Breaking:\*\* )?\*\*\S/;
const MIGRATION = /^\s+\*\*Migration:\*\*(.*)$/;

type Issue = { path: (string | number)[]; message: string };

/**
 * Compares two versions by major, minor and patch (a pre-release part sorts before its release).
 * @param left - A version that matched {@link VERSION}.
 * @param right - Another one.
 * @returns A negative number when left is older, positive when newer, 0 when equal.
 */
const compareVersions = (left: string, right: string): number => {
  const a = VERSION.exec(left);
  const b = VERSION.exec(right);
  if (a === null || b === null) return 0;
  for (const index of [1, 2, 3]) {
    const difference = Number(a[index]) - Number(b[index]);
    if (difference !== 0) return difference;
  }
  if (a[4] === undefined && b[4] !== undefined) return 1;
  if (a[4] !== undefined && b[4] === undefined) return -1;
  return (a[4] ?? '') < (b[4] ?? '') ? -1 : (a[4] ?? '') > (b[4] ?? '') ? 1 : 0;
};

/**
 * Checks the body of one section (`Unreleased` or a version).
 * @param text - The serialized body: `###` categories with bullet lists.
 * @param path - Where the section sits in the parsed document.
 * @param allowNone - Whether the body may be the single line {@link NO_PUBLIC_CHANGES} (a version section).
 * @returns The problems found.
 */
const checkBody = (text: string, path: (string | number)[], allowNone = false): Issue[] => {
  if (allowNone && text.trim() === NO_PUBLIC_CHANGES) return [];
  const issues: Issue[] = [];
  let index = -1;
  let current: string | undefined;
  let bullets = 0;
  let migrated = false;
  const closeCategory = (): void => {
    if (current !== undefined && bullets === 0) {
      issues.push({ path, message: `"### ${current}" has no entry; leave an empty category out.` });
    }
  };
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced || /^\s*(```|~~~)/.test(line)) continue;
    const heading = /^### (.*)$/.exec(line);
    if (heading !== null) {
      closeCategory();
      const name = (heading[1] ?? '').trim();
      const position = CATEGORIES.indexOf(name as (typeof CATEGORIES)[number]);
      if (position === -1) {
        issues.push({
          path,
          message: `"### ${name}" is not a category; use ${CATEGORIES.join(', ')}.`,
        });
      } else if (position <= index) {
        issues.push({
          path,
          message: `"### ${name}" is out of order or repeated; the order is ${CATEGORIES.join(', ')}.`,
        });
      } else {
        index = position;
      }
      current = name;
      bullets = 0;
      migrated = false;
      continue;
    }
    const migration = MIGRATION.exec(line);
    if (migration !== null) {
      if (current === undefined || bullets === 0) {
        issues.push({
          path,
          message: `A "**Migration:**" line belongs to no entry: "${line.trim().slice(0, 60)}"; put it, indented, at the end of the entry it is about.`,
        });
      } else if (migrated) {
        issues.push({
          path,
          message: `An entry under "### ${current}" has a second "**Migration:**" line: "${line.trim().slice(0, 60)}"; an entry has at most one, and it runs to the end of the entry.`,
        });
      } else if ((migration[1] ?? '').trim() === '') {
        issues.push({
          path,
          message: `A "**Migration:**" line under "### ${current}" needs text after the marker: what to change in existing code.`,
        });
      }
      migrated = true;
      continue;
    }
    if (line.trim() === '' || /^\s/.test(line)) continue;
    if (current === undefined) {
      issues.push({
        path,
        message: `Text before the first category: "${line.slice(0, 60)}"; entries go under "### Added", "### Changed" and so on.`,
      });
    } else if (!BULLET.test(line)) {
      issues.push({
        path,
        message: `An entry under "### ${current}" must be a bullet that opens with a bold sentence (after an optional "**Breaking:** "): "${line.slice(0, 60)}".`,
      });
    } else {
      bullets += 1;
      migrated = false;
    }
  }
  closeCategory();
  return issues;
};

export const refine = (doc: unknown, ctx: z.core.$RefinementCtx): void => {
  const document = doc as {
    unreleased?: string;
    additionalSections?: { heading: string; text: string }[];
  };
  const report = (issues: Issue[]): void => {
    for (const issue of issues) ctx.addIssue({ code: 'custom', ...issue });
  };

  if (typeof document.unreleased === 'string') {
    report(checkBody(document.unreleased, ['unreleased']));
  }
  let previous: string | undefined;
  (document.additionalSections ?? []).forEach((section, position) => {
    const path = ['additionalSections', position];
    if (!VERSION.test(section.heading)) {
      report([
        {
          path,
          message: `The heading "## ${section.heading}" must be a version such as "## 1.2.0": the version only, no date, no "v".`,
        },
      ]);
    } else if (previous !== undefined && compareVersions(section.heading, previous) >= 0) {
      report([
        {
          path,
          message: `"## ${section.heading}" is not older than "## ${previous}"; versions go newest first.`,
        },
      ]);
    }
    if (VERSION.test(section.heading)) previous = section.heading;
    report(checkBody(section.text, path, VERSION.test(section.heading)));
  });
};
