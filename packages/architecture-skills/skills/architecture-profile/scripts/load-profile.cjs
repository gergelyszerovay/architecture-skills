// Loads the architecture profile a package is bound to, as typed data.
//
// A package binds to a profile in its package.json:
//   "architecture": { "profile": "angular-block-architecture" }
// The binding names no version: the package is checked against the profile the repository
// installs, whose `Version` the loaded profile carries. A `version` an older binding still names
// is accepted and ignored, whatever its type (the architecture-profile skill, "Versioning").
// An optional "coverage" field sets what satisfies coverage rules: "implemented" (the
// default) counts only implemented specs; "specified" (fast-forward) also counts todo specs
// with complete metadata, which coverage reports then list as debt.
// An optional "enforcement" field is "gate" (the default) or "advisory": under "advisory",
// `reviewer2-check` reports the package's findings as infos that never fail it (any other value
// is rejected here). The lint scripts report the same either way.
// An optional "frozen" field, `{ "reason": "<why>" }` (one line of 1 to 300 characters with no
// control characters, no other key), takes the package out of the migration to the installed
// version: no rule of the profile judges it, the lint scripts print one line naming the reason and exit 0, and the ESLint
// builders return no rule. Any other shape is rejected here.
// The profile is found through the installed skill,
// `.claude/skills/<profile>/<profile>.architecture-profile.md` (`profile.md` in skills installed
// from older versions), searched from the package directory upward. It is parsed with markdown-schema against
// this skill's `architecture-profile` template, and every decision it cites must exist in the
// architecture's constitution.
//
// CommonJS so lint configs such as an `eslint.config.mjs` can require it synchronously.
// markdown-schema is resolved from the package being checked (it is that package's
// devDependency; `@gergelyszerovay/markdown-schema` first, then the legacy
// `markdown-schema`), and loaded with require(esm) (Node 22.12+).
'use strict';

const { existsSync, readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, join, resolve } = require('node:path');

const SKILLS_ROOT = resolve(__dirname, '..', '..');
// The folder templates live in, and the name older skills used for it.
const TEMPLATE_DIRS = ['markdown-schema-templates', 'layered-doc-templates'];

/**
 * Finds a template in a skill directory, under the folder name it has now or the one older
 * skills used.
 * @param {string} skillDir - The skill's directory.
 * @param {string} name - The template's name.
 * @returns {string} The path of `<name>.template.md`.
 */
function templatePathIn(skillDir, name) {
  const candidates = TEMPLATE_DIRS.map((dir) => join(skillDir, dir, name, `${name}.template.md`));
  return candidates.find((path) => existsSync(path)) ?? candidates[0];
}

const PROFILE_TEMPLATE = templatePathIn(join(__dirname, '..'), 'architecture-profile');
const CONSTITUTION_TEMPLATE = templatePathIn(join(SKILLS_ROOT, 'constitution'), 'constitution');

const list = (cell) =>
  (cell ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== 'none');

/** `lifetime(app/route)` → `{ name: 'lifetime', values: ['app', 'route'] }`. */
const parseTag = (item) => {
  const match = /^([a-z][a-z-]*)(?:\(([a-z/-]+)\))?$/.exec(item);
  if (match === null) throw new Error(`Invalid required tag "${item}".`);
  return {
    name: match[1],
    values: match[2] === undefined ? undefined : match[2].split('/'),
  };
};

/**
 * The optional tags of a `tsdoc-tags` rule's parameters: `optional=requires(native-webgpu)` →
 * `[{ name: 'requires', values: ['native-webgpu'] }]`. A block need not carry them; where its
 * primary declaration does, the value is checked like a required tag's.
 * @param {string | undefined} parameters - The rule's Parameters cell (`none`, or `key=value` pairs separated by `;`).
 * @returns {{ name: string, values: string[] | undefined }[]} The tags, none when the cell names none.
 */
const parseOptionalTags = (parameters) => {
  const entry = (parameters ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('optional='));
  return entry === undefined ? [] : list(entry.slice('optional='.length)).map(parseTag);
};

/**
 * What is wrong with a tag's value, by the tag's allowed values.
 * @param {{ name: string, values: string[] | undefined }} tag - The tag, as `parseTag` returns it.
 * @param {string | undefined} value - The tag's text, whitespace collapsed; `undefined` when the declaration lacks it.
 * @returns {string | undefined} The finding's message, or `undefined` when the value is allowed.
 */
const tagValueFinding = (tag, value) => {
  if (value === undefined) return `missing @${tag.name}`;
  if (value.length === 0) return `@${tag.name} is empty`;
  if (tag.values === undefined) return undefined;
  const first = /^[a-z-]+/.exec(value)?.[0] ?? '';
  return tag.values.includes(first)
    ? undefined
    : `@${tag.name} must start with one of ${tag.values.join(', ')} (found "${first}")`;
};

/** `.store.ts` → `store`. */
const blockName = (block) => block.replace(/^\./, '').replace(/\.ts$/, '');

/**
 * The names markdown-schema is published under, in the order they are tried: the reviewer2
 * toolkit package first, then the legacy package, so packages that still declare it under
 * that name keep working.
 */
const MARKDOWN_SCHEMA_PACKAGES = ['@gergelyszerovay/markdown-schema', 'markdown-schema'];

function markdownSchema(packageDir) {
  const requireFromPackage = createRequire(join(packageDir, 'package.json'));
  for (const name of MARKDOWN_SCHEMA_PACKAGES) {
    try {
      return requireFromPackage(name);
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error(
    `${packageDir}: cannot resolve markdown-schema; declare ${MARKDOWN_SCHEMA_PACKAGES.join(' (or, legacy) ')} as a devDependency, and build it if it is a workspace package.`,
  );
}

function parseDoc(packageDir, templatePath, docPath) {
  const { parseTemplate } = markdownSchema(packageDir);
  const schema = parseTemplate(readFileSync(templatePath, 'utf8'), {
    file: templatePath,
  });
  return schema.parse(readFileSync(docPath, 'utf8'));
}

/** The longest `architecture.frozen.reason` accepted, in characters. */
const FROZEN_REASON_MAX = 300;
/**
 * The characters a frozen reason may not hold, so a line that prints it stays one line and a
 * terminal shows it as written: C0 controls, DEL, C1 controls (NEL included) and the line and
 * paragraph separators U+2028 and U+2029.
 */
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;

/**
 * Reads the `frozen` field of a binding: absent, or an object whose one key is `reason`, a
 * string of 1 to {@link FROZEN_REASON_MAX} characters, checked untrimmed and returned as written,
 * not whitespace only, with no control character ({@link CONTROL}).
 * @param {string} packageDir - The package directory, for the message.
 * @param {unknown} frozen - The field's value.
 * @returns {{ reason: string } | undefined} The field, or `undefined` when the package is not frozen.
 * @throws {Error} For any other shape, naming the field.
 */
function readFrozen(packageDir, frozen) {
  if (frozen === undefined) return undefined;
  if (frozen === null || typeof frozen !== 'object' || Array.isArray(frozen)) {
    throw new Error(
      `${packageDir}: "architecture.frozen" must be an object, { "reason": "<why>" }, not ${JSON.stringify(frozen)}.`,
    );
  }
  const others = Object.keys(frozen).filter((key) => key !== 'reason');
  if (others.length > 0) {
    throw new Error(
      `${packageDir}: "architecture.frozen" takes only "reason", not ${others.map((key) => `"${key}"`).join(', ')}.`,
    );
  }
  const { reason } = frozen;
  if (
    typeof reason !== 'string' ||
    reason.trim().length === 0 ||
    CONTROL.test(reason) ||
    reason.length > FROZEN_REASON_MAX
  ) {
    throw new Error(
      `${packageDir}: "architecture.frozen.reason" must be one line of 1 to ${FROZEN_REASON_MAX} characters, not only spaces and with no control characters, saying why the package is not migrated now.`,
    );
  }
  return { reason };
}

/**
 * Finds the profile a package is bound to. A `version` in the binding is not read.
 * @param {string} packageDir - The package directory (containing package.json).
 * @returns {{ name: string, coverage: 'implemented' | 'specified', enforcement: 'gate' | 'advisory', frozen: { reason: string } | undefined, packageName: string | undefined, profilePath: string, skillDir: string }}
 */
function findBoundProfile(packageDir) {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const binding = pkg.architecture;
  if (binding === undefined) throw new Error(`${packageDir} declares no "architecture" binding.`);
  const frozen = readFrozen(packageDir, binding.frozen);
  const coverage = binding.coverage ?? 'implemented';
  if (coverage !== 'implemented' && coverage !== 'specified') {
    throw new Error(
      `${packageDir}: "architecture.coverage" must be "implemented" or "specified", not "${coverage}".`,
    );
  }
  const enforcement = binding.enforcement ?? 'gate';
  if (enforcement !== 'gate' && enforcement !== 'advisory') {
    throw new Error(
      `${packageDir}: "architecture.enforcement" must be "gate" or "advisory", not "${enforcement}".`,
    );
  }
  for (let dir = resolve(packageDir); ; dir = dirname(dir)) {
    const skillDir = join(dir, '.claude', 'skills', binding.profile);
    const profilePath = [
      join(skillDir, `${binding.profile}.architecture-profile.md`),
      join(skillDir, 'profile.md'),
    ].find((path) => existsSync(path));
    if (profilePath !== undefined) {
      return {
        name: binding.profile,
        coverage,
        enforcement,
        frozen,
        packageName: typeof pkg.name === 'string' ? pkg.name : undefined,
        profilePath,
        skillDir,
      };
    }
    if (dirname(dir) === dir) break;
  }
  throw new Error(
    `No installed skill provides profile "${binding.profile}" (looked for .claude/skills/${binding.profile}/${binding.profile}.architecture-profile.md).`,
  );
}

/**
 * Loads and checks the profile a package is bound to.
 * @param {string} packageDir - The package directory (containing package.json).
 * @returns The profile as data: identity, layers, roles, blocks (with parsed required
 * tags and dependency names), structural and coverage rules, spec kinds and levels.
 */
function loadBoundProfile(packageDirInput) {
  const packageDir = resolve(packageDirInput);
  const bound = findBoundProfile(packageDir);
  const profilePath = bound.profilePath;
  const doc = parseDoc(packageDir, PROFILE_TEMPLATE, profilePath);
  const identity = doc.identity;

  const constitutionPath = join(dirname(profilePath), identity.Constitution);
  const constitution = parseDoc(packageDir, CONSTITUTION_TEMPLATE, constitutionPath);
  const decisionIds = new Set(constitution.decisions.map((row) => row.ID));
  const cited = [
    ...doc.layers,
    ...(doc.libraryRoles ?? []),
    ...doc.blocks,
    ...doc.structuralRules,
    ...(doc.coverageRules ?? []),
    ...doc.specKinds,
    ...doc.levels,
  ].flatMap((row) => list(row.Decision));
  const missing = [...new Set(cited.filter((id) => !decisionIds.has(id)))];
  if (missing.length > 0) {
    throw new Error(
      `${profilePath} cites decisions missing from its constitution: ${missing.join(', ')}.`,
    );
  }

  const decisionText = new Map(constitution.decisions.map((row) => [row.ID, row.Decision]));
  return {
    name: bound.name,
    version: identity.Version,
    coverage: bound.coverage,
    enforcement: bound.enforcement,
    frozen: bound.frozen,
    packageName: bound.packageName,
    skillDir: bound.skillDir,
    classifier: identity.Classifier,
    decisionText,
    layers: doc.layers.map((row) => ({
      name: row.Layer,
      allowedPackages: row['Allowed packages'],
      decisions: list(row.Decision),
    })),
    roles: (doc.libraryRoles ?? []).map((row) => ({
      name: row.Role,
      mayDependOn: list(row['May depend on']),
      decisions: list(row.Decision),
    })),
    blocks: doc.blocks.map((row) => ({
      suffix: row.Block,
      name: blockName(row.Block),
      layer: row.Layer,
      requiredTags: list(row['Required tags']).map(parseTag),
      specKinds: list(row['Spec kinds']),
      mayDependOn: row['May depend on'] === '*' ? '*' : list(row['May depend on']),
      decisions: list(row.Decision),
    })),
    /** The tags a block may carry, from the `tsdoc-tags` rule's `optional=` parameter. */
    optionalTags: parseOptionalTags(
      doc.structuralRules.find((row) => row.Rule === 'tsdoc-tags')?.Parameters,
    ),
    structuralRules: doc.structuralRules.map((row) => ({
      rule: row.Rule,
      parameters: row.Parameters,
      enforcedBy: row['Enforced by'],
      decisions: list(row.Decision),
    })),
    coverageRules: (doc.coverageRules ?? []).map((row) => ({
      rule: row.Rule,
      appliesTo: list(row['Applies to']),
      parameters: row.Parameters,
      enforcedBy: row['Enforced by'],
      decisions: list(row.Decision),
    })),
    specKinds: doc.specKinds.map((row) => ({
      kind: row.Kind,
      structure: row.Structure,
    })),
    levels: doc.levels.map((row) => ({
      level: row.Level,
      docTemplate: row['Doc template'],
    })),
    /**
     * Parses one of this architecture's authored docs (e.g. a lib doc) against the
     * skill's template of that name.
     */
    parseAuthoredDoc(templateName, docPath) {
      const templatePath = templatePathIn(bound.skillDir, templateName);
      return parseDoc(packageDir, templatePath, docPath);
    },
  };
}

/**
 * The one line a lint script prints for a frozen package, instead of judging it.
 * @param {{ name: string, version: string, frozen: { reason: string } | undefined, packageName: string | undefined }} profile - A profile from `loadBoundProfile`.
 * @param {string} packageDir - The package directory, named when the manifest has no name.
 * @returns {string | undefined} `<package name>: frozen (<reason>); not checked against <profile> <installed version>`, or `undefined` when the package is not frozen.
 */
function frozenLine(profile, packageDir) {
  if (profile.frozen === undefined) return undefined;
  return `${profile.packageName ?? packageDir}: frozen (${profile.frozen.reason}); not checked against ${profile.name} ${profile.version}`;
}

module.exports = {
  findBoundProfile,
  frozenLine,
  loadBoundProfile,
  parseOptionalTags,
  tagValueFinding,
};
