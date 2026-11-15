import { describe, expect, it } from 'vitest';
import { makeFakeProductStore } from '../testing/fake-product-store.fake.ts';
import type { ProductStore } from './product-store.port.ts';
import { makeGetPrices } from './get-prices.use-case.ts';
import type { PriceView } from './price-view.result.ts';

const tea = { sku: 'tea', name: 'Green tea', listPrice: { amount: 450, currency: 'EUR' } };
const mug = { sku: 'mug', name: 'Mug', listPrice: { amount: 900, currency: 'EUR' } };

describe('makeGetPrices', () => {
  it(
    'answers the list price of each requested SKU and nothing else about the product',
    {
      tags: ['scenario'],
      meta: {
        spec: 'prices-of-requested-skus',
        arrange: 'a store holding `tea` and `mug`',
        act: 'prices are requested for `tea` and `mug`',
        assert: 'each SKU comes back with its list price only',
      },
    },
    async () => {
      let products: ProductStore;
      let result: PriceView[];
      arrange: {
        products = makeFakeProductStore([tea, mug]);
      }
      act: {
        result = await makeGetPrices({ products })({ skus: ['tea', 'mug'] });
      }
      assert: {
        expect(result).toEqual([
          { sku: 'tea', listPrice: { amount: 450, currency: 'EUR' } },
          { sku: 'mug', listPrice: { amount: 900, currency: 'EUR' } },
        ]);
      }
    },
  );

  it(
    'leaves out SKUs the store does not know',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'prices-omit-unknown-skus',
        arrange: 'a store holding only `tea`',
        act: 'prices are requested for `tea` and `nope`',
        assert: 'only `tea` is priced',
      },
    },
    async () => {
      let products: ProductStore;
      let result: PriceView[];
      arrange: {
        products = makeFakeProductStore([tea]);
      }
      act: {
        result = await makeGetPrices({ products })({ skus: ['tea', 'nope'] });
      }
      assert: {
        expect(result.map((p) => p.sku)).toEqual(['tea']);
      }
    },
  );

  it(
    'throws a store failure to the caller unchanged',
    {
      tags: ['edge-case'],
      meta: {
        spec: 'prices-store-failure-thrown',
        arrange: 'a store whose lookups fail with a database error',
        act: 'prices are requested for `tea`',
        assert: 'the database error is thrown',
      },
    },
    async () => {
      let products: ProductStore;
      let outcome: Promise<PriceView[]>;
      arrange: {
        products = { findBySkus: (): Promise<never> => Promise.reject(new Error('database down')) };
      }
      act: {
        outcome = makeGetPrices({ products })({ skus: ['tea'] });
      }
      assert: {
        await expect(outcome).rejects.toThrow('database down');
      }
    },
  );
});
