/**
 * Joins a directory and entry name with a single slash, treating `''`/`'.'` as the current directory.
 * @param dir - The directory to join from.
 * @param name - The entry name to append.
 * @returns The joined path.
 */
export const joinPath = (dir: string, name: string): string =>
  dir === '' || dir === '.' ? name : `${dir.replace(/\/+$/, '')}/${name}`;
