import type { Money } from './money.model.ts';

/** A sellable product in the catalog. */
export type Product = { sku: string; name: string; listPrice: Money };
