import { describe, expect, it } from 'vitest';
import { composeShop } from './compose-shop.composition.ts';

describe('composeShop', () => {
  it(
    'resolves every registration',
    {
      tags: ['scenario'],
      meta: {
        spec: 'shop-composition-resolves-everything',
        arrange: 'the shop composed once',
        act: 'every registered name is resolved from the container',
        assert: 'no registration throws',
      },
    },
    async () => {
      let composition: ReturnType<typeof composeShop>;
      let names: string[];
      let resolved: string[];
      arrange: {
        composition = composeShop();
        names = Object.keys(composition.container.registrations);
      }
      act: {
        resolved = names.map((name) => {
          composition.container.resolve(name as never);
          return name;
        });
      }
      assert: {
        expect(resolved).toEqual(names);
        expect(names).toEqual(
          expect.arrayContaining(['getPrices', 'placeOrder', 'watchOrder', 'prices']),
        );
        await composition.dispose();
      }
    },
  );
});
