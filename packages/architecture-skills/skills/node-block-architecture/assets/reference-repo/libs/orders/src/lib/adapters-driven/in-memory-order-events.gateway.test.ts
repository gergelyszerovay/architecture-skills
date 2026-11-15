import { makeInMemoryOrderEvents } from './in-memory-order-events.gateway.ts';
import { orderEventsContract } from '../testing/order-events.contract.ts';

orderEventsContract('in-memory gateway', () => Promise.resolve(makeInMemoryOrderEvents()));
