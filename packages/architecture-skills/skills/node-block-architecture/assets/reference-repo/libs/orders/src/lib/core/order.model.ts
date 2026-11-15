import type { OrderLine } from './order-line.model.ts';
import type { OrderStatus } from './order-status.model.ts';

/** A placed order, owned by one customer. */
export type Order = { id: string; customerId: string; lines: OrderLine[]; status: OrderStatus };
