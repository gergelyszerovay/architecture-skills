import type { Product } from './product.model.ts';

/**
 * The port for looking products up by SKU.
 * @failure An unknown SKU is not a failure: it is skipped. Infrastructure failures are thrown as they are; nothing is translated.
 */
export interface ProductStore {
  /**
   * Resolves the products for the given SKUs, skipping any that are not found.
   * @param skus - The SKUs to look up.
   * @returns The matching products, in no guaranteed order.
   */
  findBySkus(skus: string[]): Promise<Product[]>;
}
