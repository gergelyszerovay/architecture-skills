import type { ChargedAmount } from './charged-amount.model.ts';

/**
 * What orders needs from "somewhere": current prices. Implemented by a bridge in app/.
 * @failure SKUs without a price are absent from the answer, not failures; a failure of the source is thrown unchanged.
 */
export interface PriceLookup {
  currentPrices(skus: string[]): Promise<Map<string, ChargedAmount>>;
}
