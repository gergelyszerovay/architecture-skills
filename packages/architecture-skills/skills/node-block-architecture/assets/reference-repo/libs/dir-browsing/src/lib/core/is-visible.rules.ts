import type { DirEntry } from './dir-entry.model.ts';

/** Directory entry names that are never shown, regardless of `showHidden`. */
const IGNORED = new Set(['node_modules', '.git']);

/**
 * Decides whether an entry should be shown.
 * @param entry - The entry to check.
 * @param showHidden - Whether dotfiles should be shown.
 * @returns `true` when the entry should be shown.
 */
export const isVisible = (entry: DirEntry, showHidden: boolean): boolean =>
  !IGNORED.has(entry.name) && (showHidden || !entry.name.startsWith('.'));
