import type { ProductStore } from '../core/product-store.port.ts';
import type { Product } from '../core/product.model.ts';

/**
 * Builds an in-memory `ProductStore` seeded with the given products, keyed by SKU.
 * @param seed - The products to seed the store with.
 * @returns A `ProductStore` backed by an in-memory map.
 * @failure None: lookups never fail, and unknown SKUs are skipped as the port requires.
 */
export const makeInMemoryProductStore = (seed: Product[] = []): ProductStore => {
  const bySku = new Map(seed.map((p) => [p.sku, p]));
  return {
    async findBySkus(skus): Promise<Product[]> {
      return skus.flatMap((sku) => bySku.get(sku) ?? []);
    },
  };
};
