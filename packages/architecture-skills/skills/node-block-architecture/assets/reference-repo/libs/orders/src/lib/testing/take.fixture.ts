/**
 * Reads the first `count` items of an async iterable, then stops it.
 * @param source - The iterable to read from.
 * @param count - How many items to read.
 * @returns The items read, fewer if the iterable ends first.
 */
export const take = async <T>(source: AsyncIterable<T>, count: number): Promise<T[]> => {
  const items: T[] = [];
  if (count <= 0) return items;
  for await (const item of source) {
    items.push(item);
    if (items.length >= count) break;
  }
  return items;
};
