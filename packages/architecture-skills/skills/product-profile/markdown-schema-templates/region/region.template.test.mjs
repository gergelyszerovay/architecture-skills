// Specs of region.template.md's States pattern (product-profile constitution D35): a States row
// cites in its Shows cell, by S key, at least one element of its region.
// node --test skills/product-profile/markdown-schema-templates/region/
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(here, 'region.template.md');
const VALIDATE_MD = join(here, '..', '..', '..', '..', 'node_modules', '.bin', 'validate-md');
const folder = mkdtempSync(join(tmpdir(), 'region-template-'));
after(() => rmSync(folder, { recursive: true, force: true }));

/** A region document whose one States row has the given Shows cell. */
const regionWithShows = (shows) => `# toolshed/tool-list

> Members browse the shared tools and open one.

## Structure

| ID  | Element    | Role           | Parent | Shows           | Layout | Selecting it |
| --- | ---------- | -------------- | ------ | --------------- | ------ | ------------ |
| S1  | tool list  | \`tree "Tools"\` | —      | the tool groups | —      | —            |
| S2  | tool group | \`treeitem\`     | S1     | a category      | —      | —            |
| S3  | tool       | \`treeitem\`     | S2     | a tool          | —      | —            |
| S4  | spinner    | \`progressbar\`  | S1     | a spinner       | —      | —            |
| S5  | more tools | \`treeitem\`     | S2     | "More tools"    | —      | —            |

## States

| ID  | State      | Shows    |
| --- | ---------- | -------- |
| T1  | first load | ${shows} |

## Rules

| ID  | Rule                       | Why                            | Checked by |
| --- | -------------------------- | ------------------------------ | ---------- |
| R1  | Tools are listed by name.  | Members look tools up by name. | spec       |
`;

/**
 * Validates one region document per Shows cell against the template.
 * @returns For each cell, the validator's lines about its document.
 */
const validate = (cells) => {
  const files = cells.map((shows, index) => {
    const file = join(folder, `case-${String(index)}.md`);
    writeFileSync(file, regionWithShows(shows));
    return file;
  });
  const result = spawnSync(VALIDATE_MD, ['--template', TEMPLATE, ...files], { encoding: 'utf8' });
  const output = `${result.stdout}${result.stderr}`;
  return files.map((file) => {
    const lines = output.split('\n');
    const start = lines.findIndex((line) => line.startsWith(`${file}:`));
    assert.notEqual(start, -1, `validate-md said nothing of ${file}:\n${output}`);
    const own = [lines[start]];
    for (const line of lines.slice(start + 1)) {
      if (!line.startsWith('  ')) break;
      own.push(line);
    }
    return own.join('\n');
  });
};

test('accepts a Shows cell that cites an S key in each form the matrix reads', () => {
  const cells = [
    'a spinner [S4](#S4) inside the list',
    'the list (S1) with a spinner inside it',
    'the groups (S2, S3) collapsed',
    'S4 inside the list',
    'the list with S4 inside it',
    'the rows S2 to S5 dimmed',
    "quick open's [W5](/products/x/2.x.a.b.region.md#W5) in the list (S1)",
  ];
  for (const [index, result] of validate(cells).entries()) {
    assert.match(result, /: OK$/, `${cells[index]} was refused:\n${result}`);
  }
});

test('refuses a Shows cell with no S key of its own, naming the column', () => {
  const cells = [
    'the list with a spinner inside it',
    'T1, then [W3](#W3) (R2)',
    "the other region's [S4](/products/x/2.x.a.b.region.md#S4)",
    'NS4 and AS1',
  ];
  for (const [index, result] of validate(cells).entries()) {
    assert.match(
      result,
      /states\.0\.Shows: Invalid string: must match pattern/,
      `${cells[index]} was accepted:\n${result}`,
    );
  }
});

test('reads a key in a code span as its content, so the pattern cannot refuse it', () => {
  // The guide says not to cite a key in a code span; the state matrix does not read one.
  const [result] = validate(['the list `S1` with a spinner']);
  assert.match(result ?? '', /: OK$/);
});
