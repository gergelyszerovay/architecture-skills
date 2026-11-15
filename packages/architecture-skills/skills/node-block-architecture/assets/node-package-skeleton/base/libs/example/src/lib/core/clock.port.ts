/**
 * The port for reading the current time.
 * @failure Reading the time does not fail; an implementation that cannot answer throws, and nothing is translated.
 */
export interface Clock {
  /**
   * Reads the current time.
   * @returns The current date and time.
   */
  now(): Date;
}
