import { PathNotFoundError } from '../core/path-not-found.error.ts';

/**
 * Builds an error handler that maps Node's `ENOENT`/`ENOTDIR` errors to `PathNotFoundError`.
 * @param path - The path being operated on, used in the translated error.
 * @returns A handler suitable for `.catch()` that never returns normally.
 */
export const translateNotFound =
  (path: string): ((error: unknown) => never) =>
  (error: unknown): never => {
    if (
      error instanceof Error &&
      'code' in error &&
      (error.code === 'ENOENT' || error.code === 'ENOTDIR')
    ) {
      throw new PathNotFoundError(path);
    }
    throw error;
  };
