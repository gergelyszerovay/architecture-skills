import type { OrderLine } from '../order-line.model.ts';

/** The outcome of pricing an order's lines: every line priced, or the SKUs without a price. */
export type PricedOrderLines =
  | { kind: 'priced'; lines: OrderLine[] }
  | { kind: 'unknown-products'; skus: string[] };
