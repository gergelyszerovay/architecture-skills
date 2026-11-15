import { describe, expect, it } from 'vitest';
import { createCallerFactory, router } from '#libs/shared/trpc';
import type { GetPrices } from '../core/get-prices.use-case.ts';
import { makeGetPricesProcedure } from './get-prices.procedure.ts';

const priced = [{ sku: 'tea', listPrice: { amount: 450, currency: 'EUR' } }];

/**
 * Builds a caller for the `prices` procedure over a stubbed use case.
 * @param calls - Receives each input the use case is called with.
 * @returns A caller with an empty context, since the procedure is public.
 */
const setUp = (calls: unknown[]): { prices: (input: { skus: string[] }) => Promise<unknown> } => {
  const getPrices: GetPrices = (input) => {
    calls.push(input);
    return Promise.resolve(priced);
  };
  return createCallerFactory(router({ prices: makeGetPricesProcedure({ getPrices }) }))({});
};

describe('makeGetPricesProcedure', () => {
  it(
    'answers what the use case answers, for the SKUs it was given',
    {
      tags: ['scenario'],
      meta: {
        spec: 'prices-procedure-answers-use-case',
        arrange: 'a stubbed use case pricing `tea`',
        act: 'the `prices` query is called with `tea`',
        assert: 'the use case got `tea` and its answer is returned',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let caller: ReturnType<typeof setUp>;
      let result: unknown;
      arrange: {
        caller = setUp(calls);
      }
      act: {
        result = await caller.prices({ skus: ['tea'] });
      }
      assert: {
        expect(calls).toEqual([{ skus: ['tea'] }]);
        expect(result).toEqual(priced);
      }
    },
  );

  it(
    'rejects an empty SKU list as a bad request without calling the use case',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'prices-procedure-rejects-empty-list',
        arrange: 'a stubbed use case that must not be called',
        act: 'the `prices` query is called with no SKUs',
        assert: 'the call fails with BAD_REQUEST and the use case was not called',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let caller: ReturnType<typeof setUp>;
      let outcome: Promise<unknown>;
      arrange: {
        caller = setUp(calls);
      }
      act: {
        outcome = caller.prices({ skus: [] });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(calls).toEqual([]);
      }
    },
  );

  it(
    'rejects more than 100 SKUs as a bad request',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'prices-procedure-rejects-over-100-skus',
        arrange: 'a stubbed use case that must not be called',
        act: 'the `prices` query is called with 101 SKUs',
        assert: 'the call fails with BAD_REQUEST and the use case was not called',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let caller: ReturnType<typeof setUp>;
      let outcome: Promise<unknown>;
      arrange: {
        caller = setUp(calls);
      }
      act: {
        outcome = caller.prices({ skus: Array.from({ length: 101 }, (_, i) => `sku${String(i)}`) });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(calls).toEqual([]);
      }
    },
  );
});
