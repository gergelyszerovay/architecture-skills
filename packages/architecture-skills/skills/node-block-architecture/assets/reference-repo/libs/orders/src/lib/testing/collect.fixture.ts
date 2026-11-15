/**
 * Reads an async iterable to its end.
 * @param source - The iterable to read.
 * @returns Every item it yielded.
 */
export const collect = async <T>(source: AsyncIterable<T>): Promise<T[]> => {
  const items: T[] = [];
  for await (const item of source) items.push(item);
  return items;
};
