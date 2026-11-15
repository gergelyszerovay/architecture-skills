/** Secondary-port failure: the path does not exist. Driven adapters throw it; use cases translate it. */
export class PathNotFoundError extends Error {
  readonly path: string;
  constructor(path: string) {
    super(`Path not found: ${path}`);
    this.name = 'PathNotFoundError';
    this.path = path;
  }
}
