import type { ChargedAmount } from './charged-amount.model.ts';

/** One priced line item on an order, with its price frozen at order time. */
export type OrderLine = { sku: string; quantity: number; unitPrice: ChargedAmount };
