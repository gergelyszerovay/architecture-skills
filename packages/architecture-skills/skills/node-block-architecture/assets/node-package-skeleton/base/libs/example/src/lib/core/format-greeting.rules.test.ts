import { describe, expect, it } from 'vitest';
import { formatGreeting } from './format-greeting.rules.ts';

const examples: { name: string; hour: number; text: string }[] = [
  { name: 'Ada', hour: 0, text: 'Good morning, Ada' },
  { name: 'Ada', hour: 11, text: 'Good morning, Ada' },
  { name: 'Ada', hour: 12, text: 'Good afternoon, Ada' },
  { name: 'Ada', hour: 17, text: 'Good afternoon, Ada' },
  { name: 'Ada', hour: 18, text: 'Good evening, Ada' },
  { name: '  Ada  ', hour: 9, text: 'Good morning, Ada' },
  { name: '', hour: 9, text: 'Good morning, friend' },
  { name: '   ', hour: 20, text: 'Good evening, friend' },
];

describe('formatGreeting', () => {
  it.each(examples)(
    'words the greeting by the hour and names a blank name `friend` ($name at $hour)',
    { tags: ['invariant'], meta: { spec: 'greeting-by-hour' } },
    ({ name, hour, text }) => {
      expect(formatGreeting(name, hour)).toBe(text);
    },
  );
});
