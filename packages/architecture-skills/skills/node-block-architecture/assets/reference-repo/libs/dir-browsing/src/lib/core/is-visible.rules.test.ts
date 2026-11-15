import { describe, expect, it } from 'vitest';
import type { DirEntry } from './dir-entry.model.ts';
import { isVisible } from './is-visible.rules.ts';

const examples: { entry: DirEntry; showHidden: boolean; visible: boolean }[] = [
  { entry: { name: 'a.ts', kind: 'file' }, showHidden: false, visible: true },
  { entry: { name: 'a.ts', kind: 'file' }, showHidden: true, visible: true },
  { entry: { name: '.env', kind: 'file' }, showHidden: false, visible: false },
  { entry: { name: '.env', kind: 'file' }, showHidden: true, visible: true },
  { entry: { name: 'node_modules', kind: 'directory' }, showHidden: false, visible: false },
  { entry: { name: 'node_modules', kind: 'directory' }, showHidden: true, visible: false },
  { entry: { name: '.git', kind: 'directory' }, showHidden: true, visible: false },
];

describe('isVisible', () => {
  it.each(examples)(
    'hides `node_modules` and `.git` always and dotfiles unless hidden entries are asked for ($entry.name, showHidden: $showHidden)',
    { tags: ['invariant'], meta: { spec: 'visibility-ignored-and-hidden' } },
    ({ entry, showHidden, visible }) => {
      expect(isVisible(entry, showHidden)).toBe(visible);
    },
  );
});
