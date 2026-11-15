import { defineCommand, type SubCommandsDef } from 'citty';
import type { Logger } from 'pino';
import { makeDirTreeCommand, makeListFilesCommand } from '#libs/dir-browsing';
import { composeFsTools } from './compose-fs-tools.composition.ts';

/** The fs-tools CLI: its root command and its subcommands, keyed by the name typed on the command line. */
export type FsToolsCli = {
  main: ReturnType<typeof defineCommand>;
  subCommands: {
    tree: () => ReturnType<typeof makeDirTreeCommand>;
    ls: () => ReturnType<typeof makeListFilesCommand>;
  };
};

/**
 * Wires the fs-tools CLI: each subcommand gets the dir-browsing use cases, composed when it runs.
 * @param deps - The audit logger the use cases write deletions to.
 *   - `log`: The logger passed to the fs-tools composition.
 * @returns The root command and its subcommands, for the entry point to dispatch.
 */
export const composeFsToolsCli = (deps: { log: Logger }): FsToolsCli => {
  const subCommands = {
    tree: (): ReturnType<typeof makeDirTreeCommand> =>
      makeDirTreeCommand(composeFsTools({ log: deps.log })),
    ls: (): ReturnType<typeof makeListFilesCommand> =>
      makeListFilesCommand(composeFsTools({ log: deps.log })),
  } satisfies SubCommandsDef;
  const main = defineCommand({
    meta: { name: 'fs-tools', version: '0.1.0', description: 'Browse directories' },
    subCommands,
  });
  return { main, subCommands };
};
