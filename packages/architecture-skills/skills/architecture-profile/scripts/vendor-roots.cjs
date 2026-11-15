// Reads a package's vendor roots (the angular-block-architecture skill's D50) for the skill's
// checkers and a package's ESLint config: the rows of the package doc's Vendor Roots table, when
// the profile's `library-roles` row says `vendor-roots=package-doc`. architecture-check reads the
// same table over the manifest; these scripts read it from disk.
'use strict';

const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

/** `a=x; b=y, z` → `{ a: "x", b: "y, z" }`; `none` → `{}`. */
const parameters = (rule) =>
  Object.fromEntries(
    (rule.parameters === 'none' ? '' : rule.parameters)
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const at = pair.indexOf('=');
        return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
      }),
  );

/** Parses the package's authored doc (the profile's package-level template), if any. */
function packageDoc(profile, packageDir) {
  const level = profile.levels.find((l) => l.level === 'package');
  if (level === undefined || level.docTemplate === 'none') return undefined;
  const docsDir = join(packageDir, 'layered-docs');
  if (!existsSync(docsDir)) return undefined;
  const doc = readdirSync(docsDir).find((file) => file.endsWith(`.${level.docTemplate}.md`));
  return doc === undefined
    ? undefined
    : profile.parseAuthoredDoc(level.docTemplate, join(docsDir, doc));
}

/**
 * The package's vendor roots, when its profile's `library-roles` row says
 * `vendor-roots=package-doc`: the rows of the package doc's Vendor Roots table, each a
 * directory written from the package root (`libs/ui`) and the package name its imports use.
 * Empty without the parameter or the table.
 * @returns {{ directory: string, package: string }[]}
 */
function vendorRoots(profile, packageDir) {
  const rule = profile.structuralRules.find((r) => r.rule === 'library-roles');
  if (rule === undefined || parameters(rule)['vendor-roots'] !== 'package-doc') return [];
  return (packageDoc(profile, packageDir)?.vendorRoots ?? []).map((row) => ({
    directory: row.Directory.replace(/\/+$/, ''),
    package: row.Package,
  }));
}

module.exports = { vendorRoots };
