// Tests of node-test-to-vitest.mjs. Run from this folder with Node 22.18 or later: node --test
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { convertSource, run, slugOf } from './node-test-to-vitest.mjs';

const META = (slug) =>
  `{ tags: ['TODO'], meta: { spec: '${slug}', arrange: '', act: '', assert: '' } }`;

test('rewrites the import, renames test and the hooks, and marks each spec', () => {
  const input = [
    "import assert from 'node:assert/strict';",
    "import { after, before, describe, test } from 'node:test';",
    '',
    'before(() => {});',
    'after(() => {});',
    "describe('x', () => {",
    "  test('adds two numbers', () => {",
    '    assert.equal(1 + 1, 2);',
    '  });',
    '});',
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.equal(
    result.text,
    [
      "import assert from 'node:assert/strict';",
      "import { afterAll, beforeAll, describe, it } from 'vitest';",
      '',
      'beforeAll(() => {});',
      'afterAll(() => {});',
      "describe('x', () => {",
      `  it('adds two numbers', ${META('adds-two-numbers')}, () => {`,
      '    assert.equal(1 + 1, 2);',
      '  });',
      '});',
      '',
    ].join('\n'),
  );
  assert.deepEqual([result.converted, result.marked, result.unconvertible.length], [1, 1, 0]);
});

test('keeps beforeEach and afterEach, and dedupes names that map to one', () => {
  const input =
    "import { it, test, beforeEach, afterEach } from 'node:test';\nit('a', () => {});\ntest('b', () => {});\n";

  const result = convertSource(input, 'x.test.ts');

  assert.match(result.text, /^import \{ it, beforeEach, afterEach \} from 'vitest';$/m);
  assert.equal(result.converted, 2);
});

test('makes slugs kebab-case and unique within the file', () => {
  const input = [
    "import { it } from 'node:test';",
    "it('Same title!', () => {});",
    "it('same   title', () => {});",
    "it('same title?', () => {});",
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.match(result.text, /spec: 'same-title'/);
  assert.match(result.text, /spec: 'same-title-2'/);
  assert.match(result.text, /spec: 'same-title-3'/);
  assert.equal(slugOf('A very long title '.repeat(10)).length <= 64, true);
  assert.equal(slugOf('???'), 'spec');
});

test('handles multi-line calls, template titles, async callbacks and it.skip / it.todo', () => {
  const input = [
    "import { it } from 'node:test';",
    'it(',
    '  `multi line`,',
    '  async () => {},',
    ');',
    "it.skip('skipped one', () => {});",
    "void it.todo('later one');",
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.match(
    result.text,
    new RegExp(`\`multi line\`, ${META('multi-line').replace(/[{}[\]()]/g, '\\$&')},\\n`),
  );
  assert.match(result.text, /it\.skip\('skipped one', \{ tags/);
  assert.match(result.text, /void it\.todo\('later one', \{ tags/);
  assert.equal(result.marked, 3);
});

test('leaves strings, comments and unrelated calls alone', () => {
  const input = [
    "import { it } from 'node:test';",
    'const text = "it(\'inside a string\', () => {})";',
    "// it('in a comment', () => {});",
    "other.it('member of something else', () => {});",
    "it('real', () => {});",
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.equal(result.converted, 1);
  assert.match(result.text, /const text = "it\('inside a string', \(\) => \{\}\)";/);
  assert.match(result.text, /\/\/ it\('in a comment', \(\) => \{\}\);/);
  assert.match(result.text, /other\.it\('member of something else', \(\) => \{\}\);/);
});

test('reports t.mock, t.plan, subtests and other context use, and still marks the spec', () => {
  const input = [
    "import { it } from 'node:test';",
    "it('mocks', async (t) => {",
    '  const fn = t.mock.fn();',
    '  t.plan(1);',
    "  await t.test('sub', () => {});",
    '  t.diagnostic("x");',
    '});',
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.deepEqual(
    result.unconvertible.map((item) => item.reason),
    ['`t.mock`', '`t.plan`', 'subtest `t.test`', '`t.diagnostic`'],
  );
  assert.deepEqual(
    result.unconvertible.map((item) => item.line),
    [3, 4, 5, 6],
  );
  assert.equal(result.marked, 1);
});

test('reports a callback-style done and a context passed on', () => {
  const input = [
    "import { it } from 'node:test';",
    "it('a', (done) => { done(); });",
    "it('b', (t) => { helper(t); });",
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.deepEqual(
    result.unconvertible.map((item) => item.reason),
    ['callback-style `done()` completion', 'test context `t` used as a value'],
  );
});

test('reports options of specs, suites and hooks; a spec with options is renamed but not marked', () => {
  const input = [
    "import { before, describe, it } from 'node:test';",
    'before(() => {}, { timeout: 5 });',
    "describe('suite', { concurrency: true }, () => {",
    "  it('slow', { timeout: 5000 }, () => {});",
    "  it('skipped', { skip: true }, () => {});",
    '});',
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.equal(result.unconvertible.length, 4);
  assert.equal(result.converted, 2);
  assert.equal(result.marked, 0);
  assert.match(result.text, /it\('slow', \{ timeout: 5000 \}, \(\) => \{\}\)/);
  assert.match(result.text, /beforeAll\(/);
});

test('keeps imports with no Vitest form on node:test and reports them', () => {
  const input = "import { it, mock } from 'node:test';\nit('a', () => {});\n";

  const result = convertSource(input, 'x.test.ts');

  assert.match(result.text, /^import \{ it \} from 'vitest';$/m);
  assert.match(result.text, /^import \{ mock \} from 'node:test';$/m);
  assert.equal(result.unconvertible.length, 1);
});

test('honours aliases, default imports and leaves namespace imports alone', () => {
  const aliased = convertSource(
    "import { it as spec } from 'node:test';\nspec('a', () => {});\n",
    'x.test.ts',
  );
  assert.match(aliased.text, /^import \{ it \} from 'vitest';$/m);
  assert.match(aliased.text, /^it\('a', \{ tags/m);

  const defaulted = convertSource(
    "import test from 'node:test';\ntest('a', () => {});\n",
    'x.test.ts',
  );
  assert.match(defaulted.text, /^import \{ it \} from 'vitest';$/m);
  assert.match(defaulted.text, /^it\('a', \{ tags/m);

  const namespaced = convertSource(
    "import * as nt from 'node:test';\nnt.test('a', () => {});\n",
    'x.test.ts',
  );
  assert.equal(namespaced.changed, false);
  assert.equal(namespaced.unconvertible.length, 1);
});

test('leaves a file without node:test untouched, and a second run changes nothing', () => {
  const plain = "import { it } from 'vitest';\nit('a', () => {});\n";
  assert.equal(convertSource(plain, 'x.test.ts').changed, false);

  const once = convertSource("import { it } from 'node:test';\nit('a', () => {});\n", 'x.test.ts');
  assert.equal(convertSource(once.text, 'x.test.ts').changed, false);
});

test('converts JavaScript spec files', () => {
  const result = convertSource(
    "import { test } from 'node:test';\ntest('a', () => {});\n",
    'x.test.mjs',
  );

  assert.match(result.text, /^it\('a', \{ tags/m);
});

test('a dry run prints the counts and writes nothing; --write rewrites the files', () => {
  const folder = mkdtempSync(join(tmpdir(), 'node-test-to-vitest-'));
  try {
    const file = join(folder, 'a.test.ts');
    const original =
      "import { describe, it } from 'node:test';\ndescribe('s', () => {\n  it('one', () => {});\n  it('two', (t) => { t.mock.fn(); });\n});\n";
    writeFileSync(file, original);
    writeFileSync(
      join(folder, 'notes.ts'),
      "import { it } from 'node:test';\nit('ignored', () => {});\n",
    );
    const lines = [];

    const dry = run([folder], { log: (line) => lines.push(line) });

    assert.deepEqual(dry, { files: 1, converted: 2, marked: 2, unconvertible: 1 });
    assert.equal(readFileSync(file, 'utf8'), original);
    assert.equal(lines.at(-1), 'dry run: 1 files, converted 2, marked 2, unconvertible 1');

    const written = run(['--write', folder], { log: () => undefined });

    assert.equal(written.marked, 2);
    assert.match(readFileSync(file, 'utf8'), /from 'vitest'/);
    assert.equal(run([folder], { log: () => undefined }).marked, 0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('maps the members of a default import and reports those with no Vitest form', () => {
  const input = [
    "import test from 'node:test';",
    "test.describe('suite via default', () => {",
    "  test('a', () => {});",
    "  test.it('b', () => {});",
    "  test.it.skip('c', () => {});",
    '});',
    'test.before(() => {});',
    'const fn = test.mock.fn();',
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.match(result.text, /^import test from 'node:test';$/m);
  assert.match(result.text, /^import \{ describe, it, beforeAll \} from 'vitest';$/m);
  assert.match(result.text, /^describe\('suite via default'|^describe\(/m);
  assert.match(result.text, /^ {2}it\('b', \{ tags/m);
  assert.match(result.text, /^ {2}it\.skip\('c', \{ tags/m);
  assert.match(result.text, /^beforeAll\(/m);
  assert.deepEqual(
    result.unconvertible.map((item) => item.reason),
    ['`test.mock` has no automatic Vitest form'],
  );
  assert.equal(result.marked, 3);
});

test('drops the default import when every use was mapped', () => {
  const result = convertSource(
    "import test from 'node:test';\ntest.describe('s', () => { test.it('a', () => {}); });\n",
    'x.test.ts',
  );

  assert.doesNotMatch(result.text, /node:test/);
  assert.match(result.text, /^import \{ describe, it \} from 'vitest';$/m);
});

test('matches calls to the import binding, not to the name', () => {
  const input = [
    "import { it } from 'node:test';",
    'function helper(it: (n: string) => void) {',
    "  it('not a spec');",
    '}',
    'const other = () => {',
    '  const it = (n: string) => n;',
    "  it('also not a spec');",
    '};',
    "it('real', () => {});",
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.equal(result.converted, 1);
  assert.match(result.text, /^ {2}it\('not a spec'\);$/m);
  assert.match(result.text, /^ {2}it\('also not a spec'\);$/m);
});

test('merges every node:test import into one vitest import, also an existing one', () => {
  const split = convertSource(
    "import { it } from 'node:test';\nimport { describe } from 'node:test';\nit('a', () => {});\n",
    'x.test.ts',
  );
  assert.equal(split.text.match(/from 'vitest'/g)?.length, 1);
  assert.match(split.text, /^import \{ it, describe \} from 'vitest';$/m);
  assert.doesNotMatch(split.text, /node:test/);

  const merged = convertSource(
    "import { expect, it as vit } from 'vitest';\nimport { describe, it } from 'node:test';\nit('a', () => {});\n",
    'x.test.ts',
  );
  assert.equal(merged.text.match(/from 'vitest'/g)?.length, 1);
  assert.match(merged.text, /^import \{ expect, it as vit, describe, it \} from 'vitest';$/m);
});

test('slugs strip apostrophes and accents, and non-literal titles are noted', () => {
  assert.equal(
    slugOf("don't fail on the package’s Größe über alles"),
    'dont-fail-on-the-packages-grosse-uber-alles',
  );

  const input = [
    "import { it } from 'node:test';",
    'for (const n of [1, 2]) {',
    '  it(`doubles ${n}`, () => {});',
    '}',
    'it(String(1), () => {});',
    '',
  ].join('\n');

  const result = convertSource(input, 'x.test.ts');

  assert.deepEqual(
    result.notes.map((item) => item.reason),
    [
      'title is not a literal; slug `spec` is a placeholder',
      'title is not a literal; slug `spec` is a placeholder',
    ],
  );
  assert.equal(result.marked, 2);
});

test('slugs are unique across the files of a library, and the dry run says so', () => {
  const folder = mkdtempSync(join(tmpdir(), 'node-test-to-vitest-lib-'));
  try {
    const source = "import { it } from 'node:test';\nit('same title', () => {});\n";
    mkdirSync(join(folder, 'libs/a/src'), { recursive: true });
    mkdirSync(join(folder, 'libs/b/src'), { recursive: true });
    writeFileSync(join(folder, 'libs/a/src/one.test.ts'), source);
    writeFileSync(join(folder, 'libs/a/src/two.test.ts'), source);
    writeFileSync(join(folder, 'libs/b/src/three.test.ts'), source);
    const lines = [];

    run(['--write', folder], { log: (line) => lines.push(line) });

    assert.match(
      readFileSync(join(folder, 'libs/a/src/one.test.ts'), 'utf8'),
      /spec: 'same-title'/,
    );
    assert.match(
      readFileSync(join(folder, 'libs/a/src/two.test.ts'), 'utf8'),
      /spec: 'same-title-2'/,
    );
    assert.match(
      readFileSync(join(folder, 'libs/b/src/three.test.ts'), 'utf8'),
      /spec: 'same-title'/,
    );
    assert.equal(
      lines.filter((line) => line.includes('note, line 2: slug `same-title` is also used in'))
        .length,
      1,
    );
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('--help is the full home of the options and the reported constructs', () => {
  const lines = [];

  run(['--help'], { log: (line) => lines.push(line) });

  const help = lines.join('\n');
  for (const word of [
    '--write',
    'converted',
    'marked',
    'unconvertible',
    't.mock',
    'namespace import',
    'snapshot',
    'destructured',
  ]) {
    assert.ok(help.includes(word), word);
  }
});
