import type { PriceLookup } from '../price-lookup.port.ts';
import type { OrderLine } from '../order-line.model.ts';
import type { PlaceOrderInput } from './place-order.input.ts';
import type { PricedOrderLines } from './priced-order-lines.result.ts';

/** The price-order-lines step contract. */
export type PriceOrderLines = (lines: PlaceOrderInput['lines']) => Promise<PricedOrderLines>;

/**
 * Builds the step that freezes the current price on each ordered line. The feature's use cases
 * compose it; the library's entry does not export it.
 * @param deps - The ports the step depends on.
 *   - `prices`: Resolves current prices for the ordered SKUs.
 * @returns The price-order-lines step.
 * @failure SKUs without a price become the `unknown-products` result; a failure of the price lookup is thrown unchanged.
 */
export const makePriceOrderLines =
  ({ prices }: { prices: PriceLookup }): PriceOrderLines =>
  async (lines) => {
    const current = await prices.currentPrices(lines.map((l) => l.sku));
    const unknown = lines.filter((l) => !current.has(l.sku)).map((l) => l.sku);
    if (unknown.length > 0) return { kind: 'unknown-products', skus: unknown };
    const priced: OrderLine[] = lines.map((l) => {
      const unitPrice = current.get(l.sku);
      // every line's SKU was confirmed present in `current` by the `unknown` check above
      if (!unitPrice) throw new Error(`unexpected missing price for ${l.sku}`);
      return { ...l, unitPrice };
    });
    return { kind: 'priced', lines: priced };
  };
