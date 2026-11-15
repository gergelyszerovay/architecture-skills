import { describe, expect, it } from 'vitest';
import { createCallerFactory, router, type TrpcContext } from '#libs/shared/trpc';
import type { PlaceOrder } from '../core/place-order/place-order.use-case.ts';
import type { PlaceOrderInput } from '../core/place-order/place-order.input.ts';
import type { PlaceOrderResult } from '../core/place-order/place-order.result.ts';
import { makePlaceOrderProcedure } from './place-order.procedure.ts';

type PlaceCaller = {
  place: (input: { lines: { sku: string; quantity: number }[] }) => Promise<unknown>;
};

/**
 * Builds a caller for the `place` mutation over a stubbed use case.
 * @param result - What the use case answers.
 * @param calls - Receives each input the use case is called with.
 * @param ctx - The request context, holding the identity.
 * @returns The caller.
 */
const setUp = (
  result: PlaceOrderResult,
  calls: PlaceOrderInput[],
  ctx: TrpcContext,
): PlaceCaller => {
  const placeOrder: PlaceOrder = (input) => {
    calls.push(input);
    return Promise.resolve(result);
  };
  return createCallerFactory(router({ place: makePlaceOrderProcedure({ placeOrder }) }))(ctx);
};

const placed: PlaceOrderResult = {
  kind: 'placed',
  orderId: 'o1',
  total: { amount: 900, currency: 'EUR' },
};
const lines = [{ sku: 'tea', quantity: 2 }];

describe('makePlaceOrderProcedure', () => {
  it(
    'places the order for the caller and answers the order ID and total',
    {
      tags: ['scenario'],
      meta: {
        spec: 'place-order-procedure-uses-caller-identity',
        arrange: 'a stubbed use case placing `o1`, and a context for user `c1`',
        act: 'the `place` mutation is called with two `tea`',
        assert:
          'the use case got customer `c1` and the lines, and the order ID and total come back',
      },
    },
    async () => {
      const calls: PlaceOrderInput[] = [];
      let caller: PlaceCaller;
      let result: unknown;
      arrange: {
        caller = setUp(placed, calls, { user: { id: 'c1' } });
      }
      act: {
        result = await caller.place({ lines });
      }
      assert: {
        expect(calls).toEqual([{ customerId: 'c1', lines }]);
        expect(result).toEqual({ orderId: 'o1', total: { amount: 900, currency: 'EUR' } });
      }
    },
  );

  it(
    'maps unknown products to BAD_REQUEST naming them',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-procedure-unknown-products',
        arrange: 'a stubbed use case answering `unknown-products` for `nope`, and user `c1`',
        act: 'the `place` mutation is called',
        assert: 'the call fails with BAD_REQUEST mentioning `nope`',
      },
    },
    async () => {
      let caller: PlaceCaller;
      let outcome: Promise<unknown>;
      arrange: {
        caller = setUp({ kind: 'unknown-products', skus: ['nope'] }, [], { user: { id: 'c1' } });
      }
      act: {
        outcome = caller.place({ lines });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Unknown products: nope',
        });
      }
    },
  );

  it(
    'requires an identity and does not call the use case without one',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-procedure-requires-identity',
        arrange: 'a stubbed use case that must not be called, and a context without a user',
        act: 'the `place` mutation is called',
        assert: 'the call fails with UNAUTHORIZED and the use case was not called',
      },
    },
    async () => {
      const calls: PlaceOrderInput[] = [];
      let caller: PlaceCaller;
      let outcome: Promise<unknown>;
      arrange: {
        caller = setUp(placed, calls, {});
      }
      act: {
        outcome = caller.place({ lines });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(calls).toEqual([]);
      }
    },
  );

  it(
    'rejects an order without lines as a bad request',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'place-order-procedure-rejects-empty-order',
        arrange: 'a stubbed use case that must not be called, and user `c1`',
        act: 'the `place` mutation is called with no lines',
        assert: 'the call fails with BAD_REQUEST and the use case was not called',
      },
    },
    async () => {
      const calls: PlaceOrderInput[] = [];
      let caller: PlaceCaller;
      let outcome: Promise<unknown>;
      arrange: {
        caller = setUp(placed, calls, { user: { id: 'c1' } });
      }
      act: {
        outcome = caller.place({ lines: [] });
      }
      assert: {
        await expect(outcome).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(calls).toEqual([]);
      }
    },
  );
});
