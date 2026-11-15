#!/usr/bin/env node
// Checks the `tsdoc-tags` profile rule: the primary declaration of a file whose suffix
// names a profile block carries that block's required TSDoc tags, non-empty, and a tag with
// a fixed value set starts with one of its values (`@lifetime app — …`). An optional tag the
// rule's parameters name (`optional=requires(native-webgpu)`) may be left out, and where it is
// present its value is checked the same way. The primary
// declaration is the one exported class or function; otherwise the one exported `const`
// (such as a seed bound to an object literal); otherwise, in a type-only file such as a
// port, the one exported type. A file with several candidates violates the
// one-primary-declaration policy and is reported as such instead.
//
// Usage: node check-tsdoc-tags.mjs <package-dir> [--json]
//   <package-dir> must bind to a profile in its package.json ("architecture"); a frozen
//   binding prints one line and exits 0.
//   --json also prints every checked declaration's tags as JSON, with the destinations of
//   `{@link}` symbol citations in them (the citations skill's TSDoc form).
// Exits 1 when any finding is reported. `typescript` is resolved from the package.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { frozenLine, loadBoundProfile, tagValueFinding } = require('./load-profile.cjs');
const { vendorRoots } = require('./vendor-roots.cjs');

const packageDir = resolve(process.argv[2] ?? '.');
const profile = loadBoundProfile(packageDir);
// A frozen package is not checked against the profile: one line says so (load-profile.cjs).
const frozen = frozenLine(profile, packageDir);
if (frozen !== undefined) {
  console.log(frozen);
  process.exit(0);
}
const ts = createRequire(join(packageDir, 'package.json'))('typescript');

const rule = profile.structuralRules.find((r) => r.rule === 'tsdoc-tags');
if (rule === undefined) {
  console.log(`${profile.name} has no tsdoc-tags rule; nothing to check.`);
  process.exit(0);
}

const SKIP = new Set(['node_modules', 'dist', '.angular']);
// A vendor root of the package doc is a vendored package, not this package's code.
const vendorDirs = new Set(
  vendorRoots(profile, packageDir).map((root) => join(packageDir, root.directory)),
);
const listFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith('.')) return [];
    const path = join(dir, name);
    if (vendorDirs.has(path)) return [];
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const tagText = (tag) =>
  (typeof tag.comment === 'string' ? tag.comment : (ts.getTextOfJSDocComment(tag.comment) ?? ''))
    .replace(/\s+/g, ' ')
    .trim();

const isExported = (node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** An exported class, function, or `const` bound to an arrow function or function expression. */
const isPrimaryCandidate = (node) => {
  if (!isExported(node)) return false;
  if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) return node.name !== undefined;
  if (!ts.isVariableStatement(node)) return false;
  return node.declarationList.declarations.some(
    (d) =>
      d.initializer !== undefined &&
      (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)),
  );
};

/** An exported `const` with any initializer: the primary declaration of a value-only file. */
const isConstCandidate = (node) =>
  isExported(node) &&
  ts.isVariableStatement(node) &&
  (node.declarationList.flags & ts.NodeFlags.Const) !== 0;

/** An exported type alias or interface: the primary declaration of a type-only file. */
const isTypeCandidate = (node) =>
  isExported(node) && (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node));

const declarationName = (node) =>
  ts.isVariableStatement(node)
    ? node.declarationList.declarations.map((d) => d.name.getText()).join(', ')
    : node.name.text;

const findings = [];
const records = [];
const blocks = profile.blocks.filter((block) => block.requiredTags.length > 0);

for (const file of listFiles(packageDir)) {
  if (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) continue;
  const block = blocks.find((b) => file.endsWith(b.suffix));
  if (block === undefined) continue;
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const display = relative(process.cwd(), file);

  const functions = source.statements.filter(isPrimaryCandidate);
  const constants = source.statements.filter(isConstCandidate);
  const primaries =
    functions.length > 0
      ? functions
      : constants.length > 0
        ? constants
        : source.statements.filter(isTypeCandidate);
  if (primaries.length > 1) {
    const names = primaries.map(declarationName).join(', ');
    findings.push(
      `${display}: ${primaries.length} candidate primary declarations (${names}); one primary declaration per file (source-organization declaration policy), so tags have no single owner`,
    );
    continue;
  }
  const statement = primaries[0];
  if (statement === undefined) {
    findings.push(
      `${display}: no exported function, class, const or type to carry the required tags`,
    );
    continue;
  }
  const declaration = declarationName(statement);
  const line = source.getLineAndCharacterOfPosition(statement.getStart()).line + 1;
  const tags = {};
  for (const tag of ts.getJSDocTags(statement)) tags[tag.tagName.text] = tagText(tag);
  const links = {};
  for (const [name, value] of Object.entries(tags)) {
    const destinations = [...value.matchAll(/\{@link\s+([^\s|}]+)/g)].map((match) => match[1]);
    if (destinations.length > 0) links[name] = destinations;
  }
  records.push({
    file: display,
    block: block.suffix,
    declaration,
    tags,
    links,
  });

  const present = profile.optionalTags.filter((tag) => tags[tag.name] !== undefined);
  for (const tag of [...block.requiredTags, ...present]) {
    const message = tagValueFinding(tag, tags[tag.name]);
    if (message !== undefined) {
      findings.push(`${display}:${line}: ${declaration} (${block.suffix}): ${message}`);
    }
  }
}

if (process.argv.includes('--json')) console.log(JSON.stringify(records, null, 2));
for (const finding of findings) console.log(finding);
const cited = rule.decisions.join(', ');
console.log(
  `tsdoc-tags (${cited}): ${records.length} declarations checked, ${findings.length} finding(s).`,
);
process.exit(findings.length === 0 ? 0 : 1);
