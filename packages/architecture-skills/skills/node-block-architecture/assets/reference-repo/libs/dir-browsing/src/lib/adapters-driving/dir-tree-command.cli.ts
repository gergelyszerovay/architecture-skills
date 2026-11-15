import { defineCommand, type CommandDef } from 'citty';
import type { GetDirTree } from '../core/get-dir-tree/get-dir-tree.use-case.ts';
import { DirTreeCliArgsSchema } from './dir-tree-cli-args.schema.ts';
import { renderTree } from './render-tree.format.ts';

/** The argument types for the `tree` command. */
type DirTreeCommandArgs = {
  path: { type: 'positional'; required: false; description: string };
  depth: { type: 'string'; description: string };
  all: { type: 'boolean'; description: string };
  json: { type: 'boolean'; description: string };
};

/**
 * Builds the `tree` CLI subcommand.
 * @param app - The dir-browsing use cases, including `getDirTree`.
 * @returns The citty command definition.
 */
export const makeDirTreeCommand = (app: {
  getDirTree: GetDirTree;
}): CommandDef<DirTreeCommandArgs> =>
  defineCommand<DirTreeCommandArgs>({
    meta: { name: 'tree', description: 'Print the directory tree of a folder' },
    args: {
      path: { type: 'positional', required: false, description: 'Folder (default: current)' },
      depth: { type: 'string', description: 'Maximum depth' },
      all: { type: 'boolean', description: 'Include hidden entries' },
      json: { type: 'boolean', description: 'Machine-readable output' },
    },
    async run({ args }) {
      const parsed = DirTreeCliArgsSchema.safeParse(args);
      if (!parsed.success) {
        console.error(
          parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'),
        );
        process.exitCode = 2;
        return;
      }
      const { path, depth, all, json } = parsed.data;
      const result = await app.getDirTree({ path, maxDepth: depth, showHidden: all });
      if (result.kind === 'not-found') {
        console.error(`Not found: ${result.path}`);
        process.exitCode = 1;
        return;
      }
      console.log(json ? JSON.stringify(result.tree) : renderTree(result.tree));
    },
  });
