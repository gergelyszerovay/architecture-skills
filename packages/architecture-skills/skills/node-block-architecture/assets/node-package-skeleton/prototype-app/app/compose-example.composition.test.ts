import { describe, expect, it } from 'vitest';
import { composeExample } from './compose-example.composition.ts';

describe('composeExample', () => {
  it(
    'wires a route that greets by name',
    {
      tags: ['scenario'],
      meta: {
        spec: 'compose-greets-by-name',
        arrange: 'the composition',
        act: 'GET / is asked with the name Ada',
        assert: 'the answer is 200 with a greeting for Ada',
      },
    },
    () => {
      let answer: ReturnType<ReturnType<typeof composeExample>>;
      act: {
        answer = composeExample()({ method: 'GET', path: '/', name: 'Ada' });
      }
      assert: {
        expect(answer.status).toBe(200);
        expect(answer.body).toMatch(/^Good (morning|afternoon|evening), Ada\n$/);
      }
    },
  );
});
