import type { ProductStore } from './product-store.port.ts';
import type { GetPricesInput } from './get-prices.input.ts';
import type { PriceView } from './price-view.result.ts';

/** The get-prices use case contract. */
export type GetPrices = (input: GetPricesInput) => Promise<PriceView[]>;

/**
 * Builds the get-prices use case.
 * @param deps - The product store to read prices from.
 *   - `products`: The product store port.
 * @returns A function resolving current prices for a set of SKUs.
 * @failure SKUs the store doesn't know are omitted from the result, not failures; a store failure is thrown to the driving adapter unchanged.
 */
export const makeGetPrices =
  ({ products }: { products: ProductStore }): GetPrices =>
  async (input) =>
    (await products.findBySkus(input.skus)).map((p) => ({ sku: p.sku, listPrice: p.listPrice }));
