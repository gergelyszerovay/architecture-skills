/** The outcome of a place-order call: the placed order, or the unrecognized SKUs. */
export type PlaceOrderResult =
  | { kind: 'placed'; orderId: string; total: { amount: number; currency: string } }
  | { kind: 'unknown-products'; skus: string[] };
