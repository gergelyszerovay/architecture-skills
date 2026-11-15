/** Input for the place-order use case. */
export type PlaceOrderInput = {
  customerId: string;
  lines: { sku: string; quantity: number }[];
};
