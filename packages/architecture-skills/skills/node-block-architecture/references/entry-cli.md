# Entry points: CLI

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## CLI

A `.cli.ts` block handles one command. `.main.ts` dispatches the command that the composition parsed (the argument
parser is a `.schema.ts` of the driving adapters, and a `.main.ts` may not import a schema or a
format, so it reaches the parser, the usage handler and the error reporter through the
composition), sets `process.exitCode`, and avoids `process.exit()` so pending output flushes.
Human output goes to stdout through a format; `--json` selects a machine format.
Diagnostics go to stderr. Keep startup light: no heavy framework bootstrap for short-lived
commands.

For cancellation, `.main.ts` creates one `AbortController` and aborts it on SIGINT; a
command that runs long work passes `{ signal }` as the use case's call context
([operations.md](operations.md#call-context)). A second SIGINT exits immediately.

Use citty (unjs) as the argument parser unless the project already uses another. Each
`.cli.ts` block exports a factory that receives the use case it calls and returns a
`defineCommand`; the parser stays inside driving adapters, reached by `.main.ts` through the composition.

```ts
// libs/dir-browsing/src/lib/adapters-driving/dir-tree-command.cli.ts
export const makeDirTreeCommand = (app: { getDirTree: GetDirTree }) =>
  defineCommand({
    meta: { name: 'tree', description: 'Print the directory tree of a folder' },
    args: {
      path: { type: 'positional', required: false, default: '.' },
      depth: { type: 'string', description: 'Maximum depth' },
      json: { type: 'boolean', description: 'Machine-readable output' },
    },
    async run({ args }) {
      const parsed = DirTreeCliArgsSchema.safeParse(args); // .schema.ts: coerce and validate
      if (!parsed.success) {
        console.error(parsed.error.issues[0]?.message);
        process.exitCode = 2;
        return;
      }
      const tree = await app.getDirTree({ path: parsed.data.path, maxDepth: parsed.data.depth });
      console.log(parsed.data.json ? JSON.stringify(tree) : renderTree(tree));
    },
  });

// app/compose-fs-tools-cli.composition.ts: a .main.ts may not import a .cli.ts block
export const composeFsToolsCli = (deps: { log: Logger }): FsToolsCli => {
  const subCommands = {
    tree: () => makeDirTreeCommand(composeFsTools({ log: deps.log })),
    ls: () => makeListFilesCommand(composeFsTools({ log: deps.log })),
  } satisfies SubCommandsDef;
  const main = defineCommand({ meta: { name: 'fs-tools', version: '0.1.0' }, subCommands });
  return { main, subCommands };
};

// app/cli.main.ts
// commands print results and diagnostics themselves; the logger carries only audit entries
const { main, subCommands } = composeFsToolsCli({
  log: composeLogger(loadLoggingConfig(), 'stderr', 'fs-tools'),
});
const rawArgs = process.argv.slice(2);
const sub = rawArgs[0] === 'tree' || rawArgs[0] === 'ls' ? subCommands[rawArgs[0]] : undefined;

try {
  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    await (sub ? showUsage(sub(), main) : showUsage(main));
  } else {
    await runCommand(main, { rawArgs });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode ??= 1;
}
```

- Call `runCommand`, not `runMain`: `runMain` calls `process.exit()` after help and on
  errors. `runCommand` does not handle `--help` or `--version`, so `.main.ts` does, with
  `showUsage` (verified with citty 0.2).
- The subcommands are wired in a `.composition.ts`, which may import the `.cli.ts` blocks; the
  `.main.ts` dispatches only. Subcommand factories compose only what their command needs. Lazy `import()` of a
  feature helps startup only when features are large; a feature's public entry loads
  the whole feature.
- citty returns option values as strings or booleans. Coerce and validate them with a
  transport `.schema.ts`, then map the result to the use-case input.
- Lazy subcommands keep startup small: compose only what the chosen command needs, per
  command or through a composition function that accepts the features to build.
- Commands never exit the process and print only through formats (stdout) or
  diagnostics (stderr).
- Diagnostics are outcome mapping, not logging: commands write them with
  `console.error` and do not log their calls. A logger in a CLI writes JSON to stderr
  and carries only operational entries such as audit records (see the logging rules in
  [operations.md](operations.md)).
- Test a command by calling the factory with a stubbed use case and running it with
  `runCommand` and explicit `rawArgs`.
- Driving helpers have block homes too: argument parsing is a `.schema.ts`; the helper that
  wraps a command (shared options, the exit code) is part of the `.cli.ts` or a
  `.middleware.ts`; turning an error into a diagnostic and an exit code is a `.format.ts`.
  Several CLIs of one repository that need the same helpers share a package of them
  ([architecture.md](architecture.md), "Packages").
