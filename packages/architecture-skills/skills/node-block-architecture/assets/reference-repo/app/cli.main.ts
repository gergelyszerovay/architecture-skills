#!/usr/bin/env node
import { runCommand, showUsage } from 'citty';
import { loadLoggingConfig } from './load-logging.config.ts';
import { composeLogger } from './compose-logger.composition.ts';
import { composeFsToolsCli } from './compose-fs-tools-cli.composition.ts';

// commands print results and user-facing diagnostics themselves; the logger only carries audit entries
/** The root command and its subcommands, with an audit logger on stderr so stdout stays clean. */
const { main, subCommands } = composeFsToolsCli({
  log: composeLogger(loadLoggingConfig(), 'stderr', 'fs-tools'),
});

/** The process's raw command-line arguments, excluding the node and script paths. */
const rawArgs = process.argv.slice(2);
try {
  if (rawArgs.includes('--help') || rawArgs.includes('-h') || rawArgs.length === 0) {
    if (rawArgs[0] === 'tree') await showUsage(subCommands.tree());
    else if (rawArgs[0] === 'ls') await showUsage(subCommands.ls());
    else await showUsage(main);
  } else if (rawArgs[0] === '--version') {
    console.log('0.1.0');
  } else {
    await runCommand(main, { rawArgs });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode ??= 1;
}
