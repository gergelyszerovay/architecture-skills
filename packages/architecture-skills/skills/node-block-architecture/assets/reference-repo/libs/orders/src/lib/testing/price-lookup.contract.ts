import { describe, expect, it } from 'vitest';
import type { ChargedAmount } from '../core/charged-amount.model.ts';
import type { PriceLookup } from '../core/price-lookup.port.ts';

/** Builds a fresh `PriceLookup` that knows exactly the given prices. */
export type PriceLookupContractSetup = (prices: Record<string, ChargedAmount>) => PriceLookup;

/** A price the specs seed the lookup with. */
const tea: ChargedAmount = { amount: 450, currency: 'EUR' };
/** A second price the specs seed the lookup with. */
const mug: ChargedAmount = { amount: 900, currency: 'EUR' };

/**
 * Run against the fake and every real implementation, so they cannot drift apart. Each spec
 * is declared once, so every run shares its slug; the suite name tells the runs apart.
 * @param name - The implementation's name, used in the suite's description.
 * @param setup - Builds the implementation under test.
 */
export const priceLookupContract = (name: string, setup: PriceLookupContractSetup): void => {
  describe(`PriceLookup contract: ${name}`, () => {
    it(
      'answers the current price of each requested SKU',
      {
        tags: ['scenario'],
        meta: {
          spec: 'price-lookup-known-skus',
          arrange: 'a lookup that prices `tea` and `mug`',
          act: 'prices for `tea` and `mug` are requested',
          assert: 'each SKU maps to its price',
        },
      },
      async () => {
        let lookup: PriceLookup;
        let answer: Map<string, ChargedAmount>;
        arrange: {
          lookup = setup({ tea, mug });
        }
        act: {
          answer = await lookup.currentPrices(['tea', 'mug']);
        }
        assert: {
          expect([...answer]).toEqual([
            ['tea', tea],
            ['mug', mug],
          ]);
        }
      },
    );

    it(
      'leaves SKUs without a price out of the answer instead of failing',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'price-lookup-omits-unknown-skus',
          arrange: 'a lookup that prices only `tea`',
          act: 'prices for `tea` and `nope` are requested',
          assert: 'only `tea` is in the answer',
        },
      },
      async () => {
        let lookup: PriceLookup;
        let answer: Map<string, ChargedAmount>;
        arrange: {
          lookup = setup({ tea });
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
      'answers an empty map for no SKUs',
      {
        tags: ['edge-case'],
        meta: {
          spec: 'price-lookup-no-skus',
          arrange: 'a lookup that prices `tea`',
          act: 'no SKUs are requested',
          assert: 'the answer is empty',
        },
      },
      async () => {
        let lookup: PriceLookup;
        let answer: Map<string, ChargedAmount>;
        arrange: {
          lookup = setup({ tea });
        }
        act: {
          answer = await lookup.currentPrices([]);
        }
        assert: {
          expect(answer.size).toBe(0);
        }
      },
    );
  });
};
