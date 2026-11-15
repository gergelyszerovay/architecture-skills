import type { OrderStore } from '../order-store.port.ts';
import type { PriceLookup } from '../price-lookup.port.ts';
import type { OrderEvents } from '../order-events.port.ts';
import type { IdGenerator } from '../id-generator.port.ts';
import type { PlaceOrderInput } from './place-order.input.ts';
import type { PlaceOrderResult } from './place-order.result.ts';
import { makePriceOrderLines } from './price-order-lines.step.ts';

/** The place-order use case contract. */
export type PlaceOrder = (input: PlaceOrderInput) => Promise<PlaceOrderResult>;

/**
 * Builds the place-order use case: prices each line through the price-order-lines step, saves
 * the order, and publishes its status.
 * @param deps - The ports the use case depends on.
 *   - `orders`: Where the placed order is saved.
 *   - `prices`: Resolves current prices for the ordered SKUs.
 *   - `events`: Publishes the order's status changes.
 *   - `ids`: Generates the new order's ID.
 * @returns The place-order use case.
 * @failure Unknown SKUs become the `unknown-products` result and nothing is saved or published; a port failure is thrown to the driving adapter, and a failed publish leaves the saved order in place.
 */
export const makePlaceOrder = ({
  orders,
  prices,
  events,
  ids,
}: {
  orders: OrderStore;
  prices: PriceLookup;
  events: OrderEvents;
  ids: IdGenerator;
}): PlaceOrder => {
  const priceOrderLines = makePriceOrderLines({ prices });
  return async (input) => {
    const priced = await priceOrderLines(input.lines);
    if (priced.kind === 'unknown-products') return priced;
    const { lines } = priced;
    const id = ids.next();
    await orders.save({ id, customerId: input.customerId, lines, status: 'placed' });
    await events.publish({ orderId: id, status: 'placed' });
    const currency = lines[0]?.unitPrice.currency ?? 'EUR';
    return {
      kind: 'placed',
      orderId: id,
      total: { amount: lines.reduce((s, l) => s + l.unitPrice.amount * l.quantity, 0), currency },
    };
  };
};
