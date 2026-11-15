import { describe, expect, it } from 'vitest';
import { makeFakeClock } from '../testing/fake-clock.fake.ts';
import type { Clock } from './clock.port.ts';
import { makeGreet } from './greet.use-case.ts';
import type { Greeting } from './greeting.model.ts';

describe('makeGreet', () => {
  it(
    'greets the person by the hour the clock reads',
    {
      tags: ['scenario'],
      meta: {
        spec: 'greet-by-clock-hour',
        arrange: 'a clock reading 15:00',
        act: 'Ada is greeted',
        assert: 'the afternoon greeting for Ada comes back with hour 15',
      },
    },
    () => {
      let clock: Clock;
      let greeting: Greeting;
      arrange: {
        clock = makeFakeClock(new Date(2026, 0, 5, 15));
      }
      act: {
        greeting = makeGreet({ clock })({ name: 'Ada' });
      }
      assert: {
        expect(greeting).toEqual({ text: 'Good afternoon, Ada', hour: 15 });
      }
    },
  );

  it(
    'greets a blank name as a friend',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'greet-blank-name',
        arrange: 'a clock reading 08:00',
        act: 'a blank name is greeted',
        assert: 'the morning greeting for `friend` comes back',
      },
    },
    () => {
      let clock: Clock;
      let greeting: Greeting;
      arrange: {
        clock = makeFakeClock(new Date(2026, 0, 5, 8));
      }
      act: {
        greeting = makeGreet({ clock })({ name: ' ' });
      }
      assert: {
        expect(greeting.text).toBe('Good morning, friend');
      }
    },
  );

  it(
    'throws a clock failure to the caller unchanged',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'greet-clock-failure-thrown',
        arrange: 'a clock that fails when read',
        act: 'Ada is greeted',
        assert: 'the clock error is thrown',
      },
    },
    () => {
      let clock: Clock;
      let outcome: unknown;
      arrange: {
        clock = {
          now: (): Date => {
            throw new Error('clock broken');
          },
        };
      }
      act: {
        try {
          makeGreet({ clock })({ name: 'Ada' });
        } catch (error) {
          outcome = error;
        }
      }
      assert: {
        expect(outcome).toEqual(new Error('clock broken'));
      }
    },
  );
});
