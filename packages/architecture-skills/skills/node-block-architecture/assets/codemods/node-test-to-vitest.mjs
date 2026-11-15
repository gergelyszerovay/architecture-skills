#!/usr/bin/env node
// Rewrites `node:test` spec files to the Vitest form the architecture asks for
// (node-block-architecture constitution D42, D43, D48), leaving the metadata to a hand pass.
// Usage, counts and the full list of what is reported: `node node-test-to-vitest.mjs --help`.
// Tests: `node --test` in this folder.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HELP = `usage: node-test-to-vitest.mjs [--write] <file-or-folder>...

Rewrites node:test spec files (*.test.ts, *.test.mjs, ...) to Vitest. A dry run is the default:
it prints one line per file, what it reports, and the totals; --write rewrites the files in
place. Run the package's formatter afterwards. Needs Node 22.18 or later and the \`typescript\`
package, resolved from the working folder first and then from this script's folder.

Converted: the import (merged into one \`vitest\` import, also with an existing one), test to it,
before/after to beforeAll/afterAll, suite to describe, and the members of a default import
(test.describe, test.it, test.before, ...). Calls are matched to the import binding, so a local
that shadows \`it\` is left alone. Each it, test, it.skip, it.only and it.todo without options
gets { tags: ['TODO'], meta: { spec: '<slug>', arrange: '', act: '', assert: '' } }; the slug is
the kebab-cased title, unique within the library (the files under one \`libs/<lib>/src\`, or
under one package's \`app/\`), so a duplicate is suffixed -2, -3. node:assert imports and the
bodies stay as they are. The TODO tag fails strictTags until the hand pass names the kind.

Counts: converted = specs rewritten; marked = specs given the TODO metadata; unconvertible =
constructs reported with their line and left for the hand pass:
  - t.mock, t.plan, subtests (t.test) and any other member of the test context; a context
    passed on as a value or destructured; a callback-style done();
  - options of a spec (the spec is renamed and counted converted, but not marked: merge tags
    and meta by hand), of a suite, or of a hook;
  - names imported from node:test with no Vitest form (mock, snapshot, run), and members or
    uses of a default import with none (test.mock, test.snapshot): the import stays on
    node:test;
  - a namespace import (import * as nt): the file is left alone.
Notes (not counted) are printed too: a title that is not a literal gets the placeholder slug
\`spec\`, and a slug already used in another file of the library is suffixed.`;

/** Loads the TypeScript compiler API the workspace has; fails with a clear message. */
function loadTypeScript() {
  const bases = [join(process.cwd(), 'noop.js'), fileURLToPath(import.meta.url)];
  for (const base of bases) {
    try {
      return createRequire(base)('typescript');
    } catch {
      // try the next place
    }
  }
  throw new Error('node-test-to-vitest: the `typescript` package was not found');
}

/** What each `node:test` export becomes: its Vitest name and its kind. */
const EXPORTS = {
  describe: { name: 'describe', kind: 'suite' },
  suite: { name: 'describe', kind: 'suite' },
  it: { name: 'it', kind: 'test' },
  test: { name: 'it', kind: 'test' },
  before: { name: 'beforeAll', kind: 'hook' },
  after: { name: 'afterAll', kind: 'hook' },
  beforeEach: { name: 'beforeEach', kind: 'hook' },
  afterEach: { name: 'afterEach', kind: 'hook' },
};

/** The `it`/`describe` members whose call shape stays the same. */
const MODIFIERS = new Set(['skip', 'only', 'todo']);

/**
 * Makes a kebab-case slug from a spec title: accents are stripped, apostrophes dropped, and
 * every other run of non-letters and non-digits becomes one hyphen.
 * @param {string} title - The spec title.
 * @returns {string} Lowercase words joined by hyphens, cut at 64 characters on a word boundary.
 */
export function slugOf(title) {
  const slug = title
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/['’`]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= 64) return slug || 'spec';
  const cut = slug.slice(0, 64);
  const boundary = cut.lastIndexOf('-');
  return boundary > 16 ? cut.slice(0, boundary) : cut;
}

/**
 * Converts one `node:test` source text.
 * @param {string} text - The file's text.
 * @param {string} fileName - The file's name (its extension picks the script kind).
 * @param {{ slugs?: Map<string, string> }} [options] - `slugs` maps the slugs already used in
 *   the file's library to the file that used them; the call adds its own.
 * @returns {{ text: string, changed: boolean, converted: number, marked: number,
 *   unconvertible: { line: number, reason: string }[], notes: { line: number, reason: string }[] }}
 *   The new text, the counts and the reports.
 */
export function convertSource(text, fileName, options = {}) {
  const ts = loadTypeScript();
  const scriptKind = ['.js', '.mjs', '.cjs'].includes(extname(fileName))
    ? ts.ScriptKind.JS
    : ts.ScriptKind.TS;
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind);
  const result = { text, changed: false, converted: 0, marked: 0, unconvertible: [], notes: [] };
  const edits = [];
  const locals = new Map(); // local name -> EXPORTS entry
  const needed = new Set(); // Vitest names the file will import
  const slugs = options.slugs ?? new Map();
  const nodeTestImports = [];
  const keptByImport = new Map();
  let defaultName;
  let defaultStatement;
  let keepDefault = false;
  const handled = new Set();

  const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const report = (node, reason) => result.unconvertible.push({ line: lineOf(node), reason });
  const note = (node, reason) => result.notes.push({ line: lineOf(node), reason });

  // 1. The imports.
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== 'node:test'
    ) {
      continue;
    }
    const clause = statement.importClause;
    const bindings = clause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) {
      report(statement, `namespace import \`${bindings.name.text}\` of node:test`);
      return result;
    }
    nodeTestImports.push(statement);
    const kept = [];
    keptByImport.set(statement, kept);
    if (clause?.name) {
      defaultName = clause.name.text;
      defaultStatement = statement;
    }
    for (const element of bindings?.elements ?? []) {
      const imported = (element.propertyName ?? element.name).text;
      const entry = EXPORTS[imported];
      if (entry) {
        locals.set(element.name.text, entry);
        needed.add(entry.name);
      } else {
        kept.push(element.getText(source));
        report(element, `\`${imported}\` from node:test has no automatic Vitest form`);
      }
    }
  }
  if (nodeTestImports.length === 0) return result;
  const importSet = new Set(nodeTestImports);

  // 2. Scopes: is a name rebound between a use and the top of the file?
  const bindsName = (name, wanted) => {
    if (ts.isIdentifier(name)) return name.text === wanted;
    return name.elements.some(
      (element) => !ts.isOmittedExpression(element) && bindsName(element.name, wanted),
    );
  };
  const declaresIn = (statements, wanted) =>
    statements.some(
      (statement) =>
        (ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.some((d) => bindsName(d.name, wanted))) ||
        ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
          statement.name?.text === wanted),
    );
  const isShadowed = (node, wanted) => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isFunctionLike(current)) {
        if (current.parameters.some((p) => bindsName(p.name, wanted))) return true;
        if (ts.isFunctionExpression(current) && current.name?.text === wanted) return true;
      }
      if (
        ts.isCatchClause(current) &&
        current.variableDeclaration &&
        bindsName(current.variableDeclaration.name, wanted)
      ) {
        return true;
      }
      if (
        (ts.isForStatement(current) ||
          ts.isForOfStatement(current) ||
          ts.isForInStatement(current)) &&
        current.initializer &&
        ts.isVariableDeclarationList(current.initializer) &&
        current.initializer.declarations.some((d) => bindsName(d.name, wanted))
      ) {
        return true;
      }
      if (
        (ts.isBlock(current) ||
          ts.isSourceFile(current) ||
          ts.isModuleBlock(current) ||
          ts.isCaseClause(current) ||
          ts.isDefaultClause(current)) &&
        declaresIn(current.statements, wanted)
      ) {
        return true;
      }
    }
    return false;
  };

  // 3. What a callee names: an imported binding or a member of the default import.
  const resolveTarget = (expression) => {
    if (ts.isIdentifier(expression)) {
      const entry = locals.get(expression.text);
      if (entry && !isShadowed(expression, expression.text)) {
        handled.add(expression);
        return { entry, node: expression };
      }
      if (expression.text === defaultName && !isShadowed(expression, defaultName)) {
        handled.add(expression);
        needed.add(EXPORTS.test.name);
        return { entry: EXPORTS.test, node: expression };
      }
      return undefined;
    }
    if (
      defaultName &&
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === defaultName &&
      Object.hasOwn(EXPORTS, expression.name.text) &&
      !isShadowed(expression, defaultName)
    ) {
      handled.add(expression.expression);
      const entry = EXPORTS[expression.name.text];
      needed.add(entry.name);
      return { entry, node: expression };
    }
    return undefined;
  };
  const classify = (callee) => {
    const direct = resolveTarget(callee);
    if (direct) return { ...direct, modifier: undefined };
    if (ts.isPropertyAccessExpression(callee) && MODIFIERS.has(callee.name.text)) {
      const target = resolveTarget(callee.expression);
      if (target) return { ...target, modifier: callee.name.text };
    }
    return undefined;
  };

  const reportContextUse = (callback) => {
    const parameter = callback.parameters[0];
    if (!parameter) return;
    if (!ts.isIdentifier(parameter.name)) {
      report(parameter, 'destructured test context');
      return;
    }
    const name = parameter.name.text;
    const visit = (node) => {
      if (ts.isIdentifier(node) && node.text === name && node !== parameter.name) {
        const parent = node.parent;
        if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
          const member = parent.name.text;
          report(parent, member === 'test' ? `subtest \`${name}.test\`` : `\`${name}.${member}\``);
        } else if (ts.isCallExpression(parent) && parent.expression === node) {
          report(parent, `callback-style \`${name}()\` completion`);
        } else {
          report(node, `test context \`${name}\` used as a value`);
        }
        return;
      }
      ts.forEachChild(node, visit);
    };
    if (callback.body) visit(callback.body);
  };

  const uniqueSlug = (title) => {
    const base = slugOf(title);
    let slug = base;
    for (let n = 2; slugs.has(slug); n += 1) slug = `${base}-${n}`;
    return { base, slug };
  };

  const isFunction = (node) => ts.isArrowFunction(node) || ts.isFunctionExpression(node);

  const visitCall = (call) => {
    const found = classify(call.expression);
    if (!found) return;
    const { entry, node, modifier } = found;
    const written = `${node.getText(source)}${modifier ? `.${modifier}` : ''}`;
    if (ts.isPropertyAccessExpression(node) || node.text !== entry.name) {
      edits.push({ start: node.getStart(source), end: node.getEnd(), text: entry.name });
    }
    const [first, second, third] = call.arguments;
    if (entry.kind === 'hook') {
      if (second) report(second, `options of hook \`${written}\``);
      if (first && isFunction(first)) reportContextUse(first);
      return;
    }
    const callback = [second, third].find((argument) => argument && isFunction(argument));
    if (callback) reportContextUse(callback);
    const hasOptions =
      third !== undefined || (second !== undefined && ts.isObjectLiteralExpression(second));
    if (entry.kind === 'suite') {
      if (hasOptions) report(second, `options of \`${written}\` (suite)`);
      return;
    }
    // A test: it, test, it.skip, it.only, it.todo.
    result.converted += 1;
    if (!first) return;
    if (hasOptions) {
      report(second, `options of \`${written}\` (merge \`tags\` and \`meta\` by hand)`);
      return;
    }
    const literal = ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first);
    const { base, slug } = uniqueSlug(literal ? first.text : '');
    if (!literal) note(first, 'title is not a literal; slug `spec` is a placeholder');
    const owner = slugs.get(base);
    if (slug !== base && owner !== undefined && owner !== fileName) {
      note(first, `slug \`${base}\` is also used in ${owner}; this one is \`${slug}\``);
    }
    slugs.set(slug, fileName);
    edits.push({
      start: first.getEnd(),
      end: first.getEnd(),
      text: `, { tags: ['TODO'], meta: { spec: '${slug}', arrange: '', act: '', assert: '' } }`,
    });
    result.marked += 1;
  };

  const walk = (node) => {
    if (importSet.has(node)) return;
    if (ts.isCallExpression(node)) visitCall(node);
    ts.forEachChild(node, walk);
  };
  walk(source);

  // 4. Uses of the default import that have no Vitest form.
  if (defaultName) {
    const scan = (node) => {
      if (importSet.has(node)) return;
      if (
        ts.isIdentifier(node) &&
        node.text === defaultName &&
        !handled.has(node) &&
        !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
        !(ts.isPropertyAssignment(node.parent) && node.parent.name === node) &&
        !isShadowed(node, defaultName)
      ) {
        keepDefault = true;
        const parent = node.parent;
        if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
          report(parent, `\`${defaultName}.${parent.name.text}\` has no automatic Vitest form`);
        } else {
          report(node, `default import \`${defaultName}\` of node:test used as a value`);
        }
      }
      ts.forEachChild(node, scan);
    };
    scan(source);
  }

  // 5. The imports: one `vitest` import, merged with an existing one.
  const removal = (statement) => {
    const end = statement.getEnd();
    return { start: statement.getStart(source), end: text[end] === '\n' ? end + 1 : end, text: '' };
  };
  const existing = source.statements.find(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === 'vitest' &&
      !statement.importClause?.isTypeOnly &&
      !statement.importClause?.name &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings),
  );
  const names = [...needed];
  let vitestLine = '';
  if (existing) {
    const elements = existing.importClause.namedBindings.elements;
    const present = new Set(
      elements.filter((e) => !e.isTypeOnly && !e.propertyName).map((e) => e.name.text),
    );
    const parts = [
      ...elements.map((e) => e.getText(source)),
      ...names.filter((name) => !present.has(name)),
    ];
    edits.push({
      start: existing.getStart(source),
      end: existing.getEnd(),
      text: `import { ${parts.join(', ')} } from 'vitest';`,
    });
  } else if (names.length > 0) {
    vitestLine = `import { ${names.join(', ')} } from 'vitest';`;
  }
  nodeTestImports.forEach((statement, index) => {
    const kept = keptByImport.get(statement);
    const clauses = [
      statement === defaultStatement && keepDefault ? defaultName : '',
      kept.length > 0 ? `{ ${kept.join(', ')} }` : '',
    ].filter(Boolean);
    const keptLine = clauses.length > 0 ? `import ${clauses.join(', ')} from 'node:test';` : '';
    const lines = [index === 0 ? vitestLine : '', keptLine].filter(Boolean);
    if (lines.length === 0) edits.push(removal(statement));
    else {
      edits.push({
        start: statement.getStart(source),
        end: statement.getEnd(),
        text: lines.join('\n'),
      });
    }
  });

  // 6. Apply the edits from the end of the text.
  let output = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  result.text = output;
  result.changed = output !== text;
  return result;
}

/** Finds the spec files under the given files and folders. */
function collectFiles(paths) {
  const files = [];
  const visit = (path) => {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) {
        if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
        visit(join(path, name));
      }
    } else if (/\.test\.[cm]?[jt]s$/.test(path)) {
      files.push(path);
    }
  };
  for (const path of paths) {
    const full = resolve(path);
    if (statSync(full).isFile()) files.push(full);
    else visit(full);
  }
  return files;
}

/** The library a spec file belongs to: the folder above `src/`, else the package's first folder. */
function libraryOf(file) {
  const parts = file.split(sep);
  const src = parts.lastIndexOf('src');
  if (src > 0) return parts.slice(0, src).join(sep);
  let directory = dirname(file);
  while (!existsSync(join(directory, 'package.json')) && dirname(directory) !== directory) {
    directory = dirname(directory);
  }
  const first = relative(directory, file).split(sep)[0];
  return join(directory, first);
}

/**
 * Runs the codemod over files and folders.
 * @param {string[]} argv - The arguments after the script name.
 * @param {{ log: (line: string) => void }} io - Where the report goes.
 * @returns {{ files: number, converted: number, marked: number, unconvertible: number }} The totals.
 */
export function run(argv, io = { log: (line) => console.log(line) }) {
  const write = argv.includes('--write');
  const paths = argv.filter((argument) => !argument.startsWith('--'));
  const totals = { files: 0, converted: 0, marked: 0, unconvertible: 0 };
  if (paths.length === 0 || argv.includes('--help')) {
    io.log(HELP);
    return totals;
  }
  const libraries = new Map();
  for (const file of collectFiles(paths)) {
    const library = libraryOf(file);
    if (!libraries.has(library)) libraries.set(library, new Map());
    const converted = convertSource(readFileSync(file, 'utf8'), file, {
      slugs: libraries.get(library),
    });
    if (!converted.changed && converted.unconvertible.length === 0) continue;
    totals.files += 1;
    totals.converted += converted.converted;
    totals.marked += converted.marked;
    totals.unconvertible += converted.unconvertible.length;
    io.log(
      `${file}: converted ${converted.converted}, marked ${converted.marked}, unconvertible ${converted.unconvertible.length}`,
    );
    for (const item of converted.unconvertible) io.log(`  line ${item.line}: ${item.reason}`);
    for (const item of converted.notes) io.log(`  note, line ${item.line}: ${item.reason}`);
    if (write && converted.changed) writeFileSync(file, converted.text);
  }
  io.log(
    `${write ? 'written' : 'dry run'}: ${totals.files} files, converted ${totals.converted}, marked ${totals.marked}, unconvertible ${totals.unconvertible}`,
  );
  return totals;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2));
}
