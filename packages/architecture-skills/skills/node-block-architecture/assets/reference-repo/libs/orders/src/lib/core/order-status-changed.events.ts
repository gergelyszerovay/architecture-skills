import type { OrderStatus } from './order-status.model.ts';

/** Published whenever an order's status changes. */
export type OrderStatusChanged = { eventId: string; orderId: string; status: OrderStatus };
