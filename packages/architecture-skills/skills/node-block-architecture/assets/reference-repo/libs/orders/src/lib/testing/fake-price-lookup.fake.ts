import type { ChargedAmount } from '../core/charged-amount.model.ts';
import type { PriceLookup } from '../core/price-lookup.port.ts';

/**
 * Builds a fake `PriceLookup` over a fixed price list.
 * @param prices - The price per SKU the lookup knows.
 * @returns The fake `PriceLookup`.
 */
export const makeFakePriceLookup = (prices: Record<string, ChargedAmount>): PriceLookup => ({
  async currentPrices(skus): Promise<Map<string, ChargedAmount>> {
    const answer = new Map<string, ChargedAmount>();
    for (const sku of skus) {
      const price = prices[sku];
      if (price) answer.set(sku, price);
    }
    return answer;
  },
});
