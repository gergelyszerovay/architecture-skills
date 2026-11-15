import { resolve } from 'node:path';

/** The resolved configuration for the fs-tools app. */
export type FsToolsConfig = { root: string };

/**
 * Reads configuration once. The MCP root comes from FS_TOOLS_ROOT or the working directory.
 * @param env - The process environment to read from; defaults to `process.env`.
 * @returns The resolved fs-tools configuration.
 */
export const loadFsToolsConfig = (env: NodeJS.ProcessEnv = process.env): FsToolsConfig => ({
  root: resolve(env.FS_TOOLS_ROOT ?? process.cwd()),
});
