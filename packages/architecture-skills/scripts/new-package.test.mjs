// Specs of new-package.mjs: node --test scripts/
// The overlay, merge-patch and token specs run `composePackage` on a small template written for
// the spec; the refusal and CLI specs run the command against the skills package's real templates.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  caseOf,
  composePackage,
  findWorkspace,
  followUps,
  globMatches,
  listTemplates,
  mergePatch,
  parseArguments,
  replaceToken,
} from './new-package.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'new-package.mjs');
const packageRoot = join(dirname(script), '..');

/** Writes files (path to text) under a folder. */
const write = (root, files) => {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
};

const config = {
  architecture: 'node',
  profile: 'node-block-architecture',
  token: 'example',
  variants: [
    { tier: 'prototype', kind: 'app' },
    { tier: 'product', kind: 'lib' },
  ],
  refused: [{ tier: 'prototype', kind: 'lib', reason: 'because of D8' }],
  catalog: { product: ['node-package'] },
};

/** A template folder with one file in each overlay. */
const makeTemplate = () => {
  const dir = mkdtempSync(join(tmpdir(), 'new-package-template-'));
  write(dir, {
    'base/package.patch.json': JSON.stringify({
      name: 'example',
      version: '0.1.0',
      description: 'A package.',
      scripts: { test: 'vitest run', lint: 'eslint .' },
      devDependencies: {
        '@gergelyszerovay/architecture-skills': '$SELF_VERSION',
        vitest: '^4.1.5',
      },
    }),
    'base/_gitignore': 'node_modules/\n',
    'base/libs/example/src/create-example.engine.ts': 'export const createExampleEngine = 1;\n',
    'base/src/overlaid.ts': 'base\n',
    'base/README.md': 'The examples of example, an Example, exampleParams and Examples.\n',
    'tier-prototype/package.patch.json': JSON.stringify({
      private: true,
      scripts: { lint: null, dev: 'node example.ts' },
    }),
    'tier-prototype/src/overlaid.ts': 'tier\n',
    'kind-app/src/overlaid.ts': 'kind\n',
    'prototype-app/src/overlaid.ts': 'variant\n',
    'prototype-app/app/example.main.ts': 'main\n',
    'kind-lib/src/only-lib.ts': 'lib\n',
  });
  return dir;
};

const compose = (dir, overrides = {}) =>
  composePackage({
    templateDirectory: dir,
    config,
    name: '@scope/my-tool',
    tier: 'prototype',
    kind: 'app',
    selfVersion: '1.2.3',
    ...overrides,
  });

test('applies base, tier, kind and variant overlays in that order, a later file replacing an earlier one', () => {
  const dir = makeTemplate();
  try {
    const files = compose(dir);
    assert.equal(files.get('src/overlaid.ts'), 'variant\n');
    assert.ok(!files.has('src/only-lib.ts'));
    assert.ok(files.has('libs/my-tool/src/create-my-tool.engine.ts'));
    assert.ok(files.has('app/my-tool.main.ts'));

    const lib = compose(dir, { tier: 'product', kind: 'lib' });
    assert.equal(lib.get('src/overlaid.ts'), 'base\n');
    assert.ok(lib.has('src/only-lib.ts'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('composes package.json by merge patch, with null deleting, and names it after --name', () => {
  const dir = makeTemplate();
  try {
    const pkg = JSON.parse(compose(dir).get('package.json'));
    assert.equal(pkg.name, '@scope/my-tool');
    assert.deepEqual(Object.keys(pkg).slice(0, 4), ['name', 'version', 'private', 'description']);
    assert.equal(pkg.private, true);
    assert.deepEqual(pkg.scripts, { test: 'vitest run', dev: 'node my-tool.ts' });
    assert.equal(pkg.devDependencies['@gergelyszerovay/architecture-skills'], '^1.2.3');
    assert.equal(pkg.devDependencies.vitest, '^4.1.5');
    assert.ok(!compose(dir).has('package.patch.json'));
    assert.equal(
      JSON.parse(compose(dir, { tier: 'product', kind: 'lib' }).get('package.json')).private,
      undefined,
    );
    assert.equal(
      JSON.parse(
        compose(dir, { tier: 'product', kind: 'lib', isPrivate: true }).get('package.json'),
      ).private,
      true,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('renames _gitignore to .gitignore', () => {
  const dir = makeTemplate();
  try {
    const files = compose(dir);
    assert.equal(files.get('.gitignore'), 'node_modules/\n');
    assert.ok(!files.has('_gitignore'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('replaces the token in kebab-case, camelCase and PascalCase, and leaves a word that merely contains it alone', () => {
  assert.equal(caseOf('my-tool', true), 'MyTool');
  assert.equal(caseOf('my-tool', false), 'myTool');
  assert.equal(
    replaceToken(
      'example-effect exampleParams ExampleParams createExampleEngine example.main.ts examples Examples',
      'example',
      'my-tool',
    ),
    'my-tool-effect myToolParams MyToolParams createMyToolEngine my-tool.main.ts examples Examples',
  );
  const dir = makeTemplate();
  try {
    assert.equal(
      compose(dir).get('README.md'),
      'The examples of my-tool, an MyTool, myToolParams and Examples.\n',
    );
    assert.equal(
      compose(dir).get('libs/my-tool/src/create-my-tool.engine.ts'),
      'export const createMyToolEngine = 1;\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--dep overrides a dependency the template declares in every section, and refuses an unknown name', () => {
  const dir = makeTemplate();
  try {
    const pkg = JSON.parse(
      compose(dir, { deps: { '@gergelyszerovay/architecture-skills': 'link:/abs/path' } }).get(
        'package.json',
      ),
    );
    assert.equal(pkg.devDependencies['@gergelyszerovay/architecture-skills'], 'link:/abs/path');
    assert.throws(
      () => compose(dir, { deps: { lodash: '^4' } }),
      /--dep lodash=\^4: the template declares no dependency lodash/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('refuses a variant the template does not offer, a refused one with its reason, and a name that is not kebab-case', () => {
  const dir = makeTemplate();
  try {
    assert.throws(
      () => compose(dir, { tier: 'prototype', kind: 'lib' }),
      /does not offer --tier prototype --kind lib: because of D8/,
    );
    assert.throws(
      () => compose(dir, { tier: 'product', kind: 'app' }),
      /does not offer --tier product --kind app \(it offers prototype\/app, product\/lib\)/,
    );
    assert.throws(() => compose(dir, { name: 'MyTool' }), /kebab-case name/);
    assert.throws(() => compose(dir, { name: '@Scope/my-tool' }), /lowercase scope/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('merges patches as RFC 7386 does', () => {
  assert.deepEqual(mergePatch({ a: { b: 1, c: 2 }, d: [1] }, { a: { b: null, e: 3 }, d: [2] }), {
    a: { c: 2, e: 3 },
    d: [2],
  });
});

test('parses the arguments, and names what is missing or unknown', () => {
  assert.deepEqual(
    parseArguments([
      'node',
      'x',
      '--name',
      'n',
      '--tier',
      'product',
      '--kind',
      'lib',
      '--private',
      '--dep',
      'a=link:../b',
    ]),
    {
      architecture: 'node',
      dir: 'x',
      isPrivate: true,
      deps: { a: 'link:../b' },
      name: 'n',
      tier: 'product',
      kind: 'lib',
    },
  );
  assert.throws(
    () => parseArguments(['node', 'x', '--tier', 'product', '--kind', 'lib']),
    /--name is required/,
  );
  assert.throws(
    () => parseArguments(['node', 'x', '--name', 'n', '--tier', 'big', '--kind', 'lib']),
    /--tier is prototype or product/,
  );
  assert.throws(() => parseArguments(['node', '--name', 'n']), /expected <node\|three> <dir>/);
  assert.throws(
    () => parseArguments(['node', 'x', '--name', 'a', '--name', 'b']),
    /--name is given twice/,
  );
  assert.throws(() => parseArguments(['node', 'x', '--bogus']), /unknown option --bogus/);
  assert.throws(
    () => parseArguments(['node', 'x', '--dep', 'nonsense']),
    /expected <name>=<specifier>/,
  );
});

test('matches workspace globs', () => {
  assert.ok(globMatches('packages/*', 'packages/a'));
  assert.ok(!globMatches('packages/*', 'packages/a/b'));
  assert.ok(globMatches('apps/**', 'apps/a/b'));
  assert.ok(globMatches('./app', 'app'));
});

test('lists the workspace glob a package is missing from and the catalog templates not found above it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'new-package-workspace-'));
  try {
    write(dir, {
      'pnpm-workspace.yaml':
        "packages:\n  - 'packages/*' # the packages\nallowBuilds:\n  esbuild: true\n",
      'markdown-schema-templates/node-lib/x': '',
    });
    assert.deepEqual(findWorkspace(join(dir, 'packages', 'a')), {
      root: dir,
      globs: ['packages/*'],
    });
    assert.deepEqual(
      followUps({ directory: join(dir, 'packages', 'a'), config, tier: 'product' }),
      [
        'run pnpm install, then pnpm --filter <name> run lint',
        'run pnpm exec install-skills in the repository: the checks load the profile from .claude/skills/node-block-architecture/',
        'link the catalog templates node-package in a markdown-schema-templates/ folder above the package (markdown-schema skill, "Binding")',
      ],
    );
    const lines = followUps({ directory: join(dir, 'tools', 'a'), config, tier: 'prototype' });
    assert.match(lines[0], /add 'tools\/a' to the packages of .*pnpm-workspace\.yaml/);
    assert.equal(lines.length, 3);
    mkdirSync(join(dir, '.claude', 'skills', 'node-block-architecture'), { recursive: true });
    assert.equal(
      followUps({ directory: join(dir, 'tools', 'a'), config, tier: 'prototype' }).length,
      2,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Runs the command. */
const run = (args, cwd) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

test('finds the real templates, and refuses a three.js lib prototype with the reason of D8', () => {
  assert.deepEqual(
    listTemplates(packageRoot)
      .map((template) => template.architecture)
      .sort(),
    ['node', 'three'],
  );
  const dir = mkdtempSync(join(tmpdir(), 'new-package-cli-'));
  try {
    const result = run(
      ['three', 'demo', '--name', 'demo', '--tier', 'prototype', '--kind', 'lib'],
      dir,
    );
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /three-block-architecture skill uses the package-local ~libs\/\* alias \(constitution D8/,
    );
    assert.ok(!existsSync(join(dir, 'demo')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('makes every product variant of the real templates private, as no changelog is due before it is published', () => {
  for (const template of listTemplates(packageRoot)) {
    for (const { tier, kind } of template.config.variants.filter((v) => v.tier === 'product')) {
      const files = composePackage({
        templateDirectory: template.directory,
        config: template.config,
        name: 'demo',
        tier,
        kind,
        selfVersion: '1.0.0',
      });
      const pkg = JSON.parse(files.get('package.json'));
      assert.equal(pkg.private, true, `${template.architecture} product ${kind}`);
    }
  }
});

test('refuses a non-empty folder, an unknown --dep and a missing option, and writes the package otherwise', () => {
  const dir = mkdtempSync(join(tmpdir(), 'new-package-cli-'));
  try {
    write(dir, { 'taken/file.txt': 'x', afile: 'x' });
    const file = run(['node', 'afile', '--name', 'n', '--tier', 'prototype', '--kind', 'lib'], dir);
    assert.equal(file.status, 1);
    assert.match(file.stderr, /afile is a file/);
    const taken = run(
      ['node', 'taken', '--name', 'n', '--tier', 'prototype', '--kind', 'lib'],
      dir,
    );
    assert.equal(taken.status, 1);
    assert.match(taken.stderr, /taken is not empty/);

    const unknown = run(
      ['node', 'fresh', '--name', 'n', '--tier', 'prototype', '--kind', 'lib', '--dep', 'lodash=1'],
      dir,
    );
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /the template declares no dependency lodash/);
    assert.ok(!existsSync(join(dir, 'fresh')));

    assert.equal(run(['node', 'fresh', '--name', 'n'], dir).status, 2);

    const made = run(
      ['node', 'fresh', '--name', 'my-lib', '--tier', 'prototype', '--kind', 'lib'],
      dir,
    );
    assert.equal(made.status, 0, made.stderr);
    assert.match(made.stdout, /my-lib \(node, prototype lib\)/);
    const pkg = JSON.parse(readFileSync(join(dir, 'fresh', 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'my-lib');
    assert.equal(pkg.private, true);
    assert.equal(pkg.architecture.enforcement, 'advisory');
    assert.equal(pkg.exports['.'], './libs/my-lib/src/package.entry.ts');
    assert.ok(existsSync(join(dir, 'fresh', '.gitignore')));
    assert.ok(
      existsSync(join(dir, 'fresh', 'libs', 'my-lib', 'src', 'lib', 'core', 'greet.use-case.ts')),
    );
    assert.match(
      readFileSync(join(dir, 'fresh', 'package.json'), 'utf8'),
      /"@gergelyszerovay\/architecture-skills": "\^\d+\.\d+\.\d+/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the lab follows the templates: the three.js template refuses a lib prototype with its reason, the node template offers one', () => {
  // lab plan 0018: `lab new`, `lab prototype` and `lab promote` have no rule of their own for this; the template declares it
  const templates = listTemplates(packageRoot);
  const three = templates.find((t) => t.architecture === 'three');
  const node = templates.find((t) => t.architecture === 'node');
  assert.ok(three !== undefined && node !== undefined, 'both templates are listed');
  assert.throws(
    () =>
      composePackage({
        templateDirectory: three.directory,
        config: three.config,
        name: 'sketch',
        tier: 'prototype',
        kind: 'lib',
      }),
    /the three template does not offer --tier prototype --kind lib: .*~libs/,
  );
  assert.ok(
    node.config.variants.some((v) => v.tier === 'prototype' && v.kind === 'lib'),
    'the node template offers a lib prototype',
  );
  assert.deepEqual(node.config.refused, []);
});
