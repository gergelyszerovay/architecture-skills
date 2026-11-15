import { makeInMemoryOrderStore } from './in-memory-order-store.repository.ts';
import { orderStoreContract } from '../testing/order-store.contract.ts';

orderStoreContract('in-memory repository', () => Promise.resolve(makeInMemoryOrderStore()));
