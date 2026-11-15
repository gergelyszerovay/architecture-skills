import { describe, expect, it } from 'vitest';
import { joinPath } from './join-path.rules.ts';

const examples: { dir: string; name: string; joined: string }[] = [
  { dir: '.', name: 'a.ts', joined: 'a.ts' },
  { dir: '', name: 'a.ts', joined: 'a.ts' },
  { dir: 'src', name: 'a.ts', joined: 'src/a.ts' },
  { dir: 'src/', name: 'a.ts', joined: 'src/a.ts' },
  { dir: 'src///', name: 'a.ts', joined: 'src/a.ts' },
  { dir: '/', name: 'etc', joined: '/etc' },
];

describe('joinPath', () => {
  it.each(examples)(
    'joins a directory and a name with exactly one slash, and treats `.` and the empty path as the current directory ($dir + $name)',
    { tags: ['invariant'], meta: { spec: 'join-path-single-slash' } },
    ({ dir, name, joined }) => {
      expect(joinPath(dir, name)).toBe(joined);
    },
  );
});
