import { describe, expect, it } from 'vitest';
import { makeFakePriceLookup } from '../../testing/fake-price-lookup.fake.ts';
import type { PriceLookup } from '../price-lookup.port.ts';
import { makePriceOrderLines } from './price-order-lines.step.ts';
import type { PricedOrderLines } from './priced-order-lines.result.ts';

describe('makePriceOrderLines', () => {
  it(
    'freezes the current price on each line',
    {
      tags: ['scenario'],
      meta: {
        spec: 'price-order-lines-freezes-prices',
        arrange: 'a price lookup pricing `tea` at 450 EUR',
        act: 'the step prices a line of two `tea`',
        assert: 'the result is `priced`, with the line at a unit price of 450 EUR',
      },
    },
    async () => {
      let prices: PriceLookup;
      let result: PricedOrderLines;
      arrange: {
        prices = makeFakePriceLookup({ tea: { amount: 450, currency: 'EUR' } });
      }
      act: {
        result = await makePriceOrderLines({ prices })([{ sku: 'tea', quantity: 2 }]);
      }
      assert: {
        expect(result).toEqual({
          kind: 'priced',
          lines: [{ sku: 'tea', quantity: 2, unitPrice: { amount: 450, currency: 'EUR' } }],
        });
      }
    },
  );

  it(
    'names every SKU the lookup does not price',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'price-order-lines-unknown-products',
        arrange: 'a price lookup that knows `tea` only',
        act: 'the step prices lines of `tea`, `nope` and `gone`',
        assert: 'the result is `unknown-products` naming `nope` and `gone`',
      },
    },
    async () => {
      let prices: PriceLookup;
      let result: PricedOrderLines;
      arrange: {
        prices = makeFakePriceLookup({ tea: { amount: 450, currency: 'EUR' } });
      }
      act: {
        result = await makePriceOrderLines({ prices })([
          { sku: 'tea', quantity: 1 },
          { sku: 'nope', quantity: 1 },
          { sku: 'gone', quantity: 3 },
        ]);
      }
      assert: {
        expect(result).toEqual({ kind: 'unknown-products', skus: ['nope', 'gone'] });
      }
    },
  );
});
