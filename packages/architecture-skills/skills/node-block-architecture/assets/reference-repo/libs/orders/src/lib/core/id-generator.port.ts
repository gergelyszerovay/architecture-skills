/**
 * Generates unique identifiers, such as order IDs.
 * @failure Generation doesn't fail: every call returns a fresh identifier.
 */
export interface IdGenerator {
  /**
   * Generates the next unique identifier.
   * @returns A new unique identifier.
   */
  next(): string;
}
