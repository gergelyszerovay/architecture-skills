import { defineCommand, type CommandDef } from 'citty';
import type { ListFiles } from '../core/list-files/list-files.use-case.ts';
import { ListFilesCliArgsSchema } from './list-files-cli-args.schema.ts';
import { renderFileList } from './render-file-list.format.ts';

/** The argument types for the `ls` command. */
type ListFilesCommandArgs = {
  path: { type: 'positional'; required: false; description: string };
  all: { type: 'boolean'; description: string };
  json: { type: 'boolean'; description: string };
};

/**
 * Builds the `ls` CLI subcommand.
 * @param app - The dir-browsing use cases, including `listFiles`.
 * @returns The citty command definition.
 */
export const makeListFilesCommand = (app: {
  listFiles: ListFiles;
}): CommandDef<ListFilesCommandArgs> =>
  defineCommand<ListFilesCommandArgs>({
    meta: { name: 'ls', description: 'List files in a folder with sizes' },
    args: {
      path: { type: 'positional', required: false, description: 'Folder (default: current)' },
      all: { type: 'boolean', description: 'Include hidden files' },
      json: { type: 'boolean', description: 'Machine-readable output' },
    },
    async run({ args }) {
      const parsed = ListFilesCliArgsSchema.safeParse(args);
      if (!parsed.success) {
        console.error(parsed.error.issues.map((i) => i.message).join('\n'));
        process.exitCode = 2;
        return;
      }
      const result = await app.listFiles({ path: parsed.data.path, showHidden: parsed.data.all });
      if (result.kind === 'not-found') {
        console.error(`Not found: ${result.path}`);
        process.exitCode = 1;
        return;
      }
      console.log(parsed.data.json ? JSON.stringify(result.files) : renderFileList(result.files));
    },
  });
