/** The outcome of a delete-files call: either done, or awaiting user confirmation. */
export type DeleteFilesResult =
  { kind: 'deleted'; count: number } | { kind: 'needs-confirmation'; question: string };
