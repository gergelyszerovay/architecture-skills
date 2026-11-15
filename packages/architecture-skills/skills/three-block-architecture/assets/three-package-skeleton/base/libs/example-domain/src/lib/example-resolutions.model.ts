/** Low-resolution render sizes the example effect supports. */
export const exampleResolutions = {
  '320x200': { width: 320, height: 200 },
  '640x400': { width: 640, height: 400 },
} as const;

/** One of the keys of {@link exampleResolutions}. */
export type ExampleResolution = keyof typeof exampleResolutions;
