/** Input for the delete-files use case. */
export type DeleteFilesInput = {
  paths: string[];
  /** Set by the caller after the user confirmed a request that needed confirmation. */
  confirmed?: boolean;
};
