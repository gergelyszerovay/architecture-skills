import type { Money } from './money.model.ts';

/** A product's current price, as resolved by the catalog. */
export type PriceView = { sku: string; listPrice: Money };
