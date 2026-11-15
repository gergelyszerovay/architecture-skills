import { describe, expect, it } from 'vitest';
import type { ProductStore } from '../core/product-store.port.ts';
import type { Product } from '../core/product.model.ts';

/** Builds a fresh `ProductStore` that knows exactly the given products. */
export type ProductStoreContractSetup = (products: Product[]) => Promise<ProductStore>;

/** A product the specs seed the store with. */
const tea: Product = { sku: 'tea', name: 'Green tea', listPrice: { amount: 450, currency: 'EUR' } };
/** A second product the specs seed the store with. */
const mug: Product = { sku: 'mug', name: 'Mug', listPrice: { amount: 900, currency: 'EUR' } };

/**
 * Run against the fake and every real adapter, so they cannot drift apart. Each spec is
 * declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const productStoreContract = (name: string, setup: ProductStoreContractSetup): void => {
  describe(`ProductStore contract: ${name}`, () => {
    it(
      'finds the products for the requested SKUs',
      {
        tags: ['scenario'],
        meta: {
          spec: 'product-store-finds-by-sku',
          arrange: 'a store holding `tea` and `mug`',
          act: 'the SKUs `tea` and `mug` are requested',
          assert: 'both products come back',
        },
      },
      async () => {
        let store: ProductStore;
        let found: Product[];
        arrange: {
          store = await setup([tea, mug]);
        }
        act: {
          found = await store.findBySkus(['tea', 'mug']);
        }
        assert: {
          expect(found).toHaveLength(2);
          expect(found).toContainEqual(tea);
          expect(found).toContainEqual(mug);
        }
      },
    );

    it(
      'skips SKUs it does not know instead of failing',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'product-store-skips-unknown-skus',
          arrange: 'a store holding only `tea`',
          act: 'the SKUs `tea` and `nope` are requested',
          assert: 'only `tea` comes back',
        },
      },
      async () => {
        let store: ProductStore;
        let found: Product[];
        arrange: {
          store = await setup([tea]);
        }
        act: {
          found = await store.findBySkus(['tea', 'nope']);
        }
        assert: {
          expect(found).toEqual([tea]);
        }
      },
    );

    it(
      'answers an empty list for no SKUs',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'product-store-no-skus',
          arrange: 'a store holding `tea`',
          act: 'no SKUs are requested',
          assert: 'the answer is empty',
        },
      },
      async () => {
        let store: ProductStore;
        let found: Product[];
        arrange: {
          store = await setup([tea]);
        }
        act: {
          found = await store.findBySkus([]);
        }
        assert: {
          expect(found).toEqual([]);
        }
      },
    );
  });
};
