import { describe, expect, it } from 'vitest';
import { makeFakeClock } from '../testing/fake-clock.fake.ts';
import { makeGreet } from '../core/greet.use-case.ts';
import { makeGreetRoute } from './greet.route.ts';

const route = makeGreetRoute({
  greet: makeGreet({ clock: makeFakeClock(new Date(2026, 0, 5, 9)) }),
});

describe('makeGreetRoute', () => {
  it(
    'greets the name of the query',
    {
      tags: ['scenario'],
      meta: {
        spec: 'greet-route-greets',
        arrange: 'a morning clock',
        act: 'GET / is asked with the name Ada',
        assert: 'the answer is 200 with the morning greeting for Ada',
      },
    },
    () => {
      let answer: ReturnType<typeof route>;
      act: {
        answer = route({ method: 'GET', path: '/', name: 'Ada' });
      }
      assert: {
        expect(answer).toEqual({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          body: 'Good morning, Ada\n',
        });
      }
    },
  );

  it(
    'greets a friend when there is no name, and answers 404 and 405 for another path and method',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'greet-route-edges',
        arrange: 'a morning clock',
        act: 'GET / without a name, GET /x and POST / are asked',
        assert: 'the first greets a friend, the others answer 404 and 405',
      },
    },
    () => {
      let answers: ReturnType<typeof route>[];
      act: {
        answers = [
          route({ method: 'GET', path: '/', name: undefined }),
          route({ method: 'GET', path: '/x', name: undefined }),
          route({ method: 'POST', path: '/', name: undefined }),
        ];
      }
      assert: {
        expect(answers.map((answer) => answer.status)).toEqual([200, 404, 405]);
        expect(answers[0]?.body).toBe('Good morning, friend\n');
      }
    },
  );
});
