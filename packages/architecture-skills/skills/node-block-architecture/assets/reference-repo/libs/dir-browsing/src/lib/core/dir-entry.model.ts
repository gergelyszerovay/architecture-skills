/** A single entry read from a directory. */
export type DirEntry = {
  name: string;
  kind: 'file' | 'directory';
};
