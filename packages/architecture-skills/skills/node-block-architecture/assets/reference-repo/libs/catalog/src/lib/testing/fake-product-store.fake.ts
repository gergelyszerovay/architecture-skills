import type { ProductStore } from '../core/product-store.port.ts';
import type { Product } from '../core/product.model.ts';

/**
 * Builds a fake `ProductStore` over the given products.
 * @param products - The products the store knows, keyed by SKU.
 * @returns The fake `ProductStore`.
 */
export const makeFakeProductStore = (products: Product[] = []): ProductStore => {
  const bySku = new Map(products.map((p) => [p.sku, p]));
  return {
    async findBySkus(skus): Promise<Product[]> {
      return skus.flatMap((sku) => bySku.get(sku) ?? []);
    },
  };
};
