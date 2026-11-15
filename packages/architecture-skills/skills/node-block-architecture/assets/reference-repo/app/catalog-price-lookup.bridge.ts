import type { GetPrices } from '#libs/catalog';
import type { ChargedAmount, PriceLookup } from '#libs/orders';

/**
 * Bridges the orders library's `PriceLookup` port to the catalog library's `GetPrices` use case.
 * @param deps - The catalog use case to look prices up with.
 *   - `getPrices`: Resolves current list prices for a set of SKUs.
 * @returns A `PriceLookup` that resolves current prices keyed by SKU.
 */
export const makeCatalogPriceLookup = ({ getPrices }: { getPrices: GetPrices }): PriceLookup => ({
  async currentPrices(skus): Promise<Map<string, ChargedAmount>> {
    const prices = await getPrices({ skus });
    return new Map(
      prices.map((p) => [p.sku, { amount: p.listPrice.amount, currency: p.listPrice.currency }]),
    );
  },
});
