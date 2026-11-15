import { describe, expect, it } from 'vitest';
import { makeGetPrices, type GetPrices, type PriceView } from '#libs/catalog';
import { makeFakeProductStore } from '#libs/catalog/testing';
import type { ChargedAmount } from '#libs/orders';
import { priceLookupContract } from '#libs/orders/testing';
import { makeCatalogPriceLookup } from './catalog-price-lookup.bridge.ts';

const tea: PriceView = { sku: 'tea', listPrice: { amount: 450, currency: 'EUR' } };

describe('makeCatalogPriceLookup', () => {
  it(
    "maps the catalog's list prices to the amounts orders charges, keyed by SKU",
    {
      tags: ['scenario'],
      meta: {
        spec: 'bridge-maps-list-prices',
        arrange: 'a catalog use case pricing `tea` at 450 EUR',
        act: 'prices are looked up for `tea`',
        assert: 'the catalog got the SKUs and `tea` maps to 450 EUR',
      },
    },
    async () => {
      const calls: unknown[] = [];
      let lookup: ReturnType<typeof makeCatalogPriceLookup>;
      let answer: Map<string, ChargedAmount>;
      arrange: {
        lookup = makeCatalogPriceLookup({
          getPrices: (input) => {
            calls.push(input);
            return Promise.resolve([tea]);
          },
        });
      }
      act: {
        answer = await lookup.currentPrices(['tea']);
      }
      assert: {
        expect(calls).toEqual([{ skus: ['tea'] }]);
        expect([...answer]).toEqual([['tea', { amount: 450, currency: 'EUR' }]]);
      }
    },
  );

  it(
    'leaves out SKUs the catalog does not price',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'bridge-omits-unpriced-skus',
        arrange: 'a catalog use case pricing only `tea`',
        act: 'prices are looked up for `tea` and `nope`',
        assert: 'only `tea` is in the answer',
      },
    },
    async () => {
      let lookup: ReturnType<typeof makeCatalogPriceLookup>;
      let answer: Map<string, ChargedAmount>;
      arrange: {
        lookup = makeCatalogPriceLookup({ getPrices: () => Promise.resolve([tea]) });
      }
      act: {
        answer = await lookup.currentPrices(['tea', 'nope']);
      }
      assert: {
        expect([...answer.keys()]).toEqual(['tea']);
      }
    },
  );

  it(
    'throws a catalog failure to the caller unchanged',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'bridge-catalog-failure-thrown',
        arrange: 'a catalog use case that fails with a database error',
        act: 'prices are looked up for `tea`',
        assert: 'the database error is thrown',
      },
    },
    async () => {
      let getPrices: GetPrices;
      let outcome: Promise<Map<string, ChargedAmount>>;
      arrange: {
        getPrices = (): Promise<never> => Promise.reject(new Error('database down'));
      }
      act: {
        outcome = makeCatalogPriceLookup({ getPrices }).currentPrices(['tea']);
      }
      assert: {
        await expect(outcome).rejects.toThrow('database down');
      }
    },
  );
});

// The bridge is PriceLookup's real adapter: hold it to the port's contract over the real
// catalog use case, seeded through the catalog's product-store fake.
priceLookupContract('catalog bridge', (prices) =>
  makeCatalogPriceLookup({
    getPrices: makeGetPrices({
      products: makeFakeProductStore(
        Object.entries(prices).map(([sku, listPrice]) => ({ sku, name: sku, listPrice })),
      ),
    }),
  }),
);
