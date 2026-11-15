#!/usr/bin/env node
// Writes a plain-JavaScript `<stem>.refine.js` beside every `<stem>.refine.ts` of the skills'
// templates, and removes them again with `--clean`. Node refuses to strip types of a file under
// `node_modules` (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so the published package ships the
// `.js` files (markdown-schema loads `<stem>.refine.js` when there is no `.ts`), never the `.ts`.
// The `.js` files are generated, untracked output: `prepack` writes them, `postpack` removes them.
//
//   node scripts/build-refine-js.mjs           # write the .js files
//   node scripts/build-refine-js.mjs --clean   # remove them
//
// A refine file may hold type annotations and `import type`, nothing that needs a transform
// (no enums, no parameter properties); `stripTypeScriptTypes` throws on those. Plain Node.
import { readdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skills = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills');
const clean = process.argv.includes('--clean');

/**
 * Lists the `*.refine.ts` files under the skills' template folders.
 * @returns {string[]} Absolute paths.
 */
function refineFiles() {
  return readdirSync(skills, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.refine.ts'))
    .filter((e) => e.parentPath.includes('markdown-schema-templates'))
    .map((e) => join(e.parentPath, e.name));
}

for (const ts of refineFiles()) {
  const js = ts.replace(/\.ts$/, '.js');
  if (clean) rmSync(js, { force: true });
  else writeFileSync(js, stripTypeScriptTypes(readFileSync(ts, 'utf8'), { mode: 'strip' }));
}
