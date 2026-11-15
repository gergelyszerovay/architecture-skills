import { makeFakeOrderStore } from './fake-order-store.fake.ts';
import { orderStoreContract } from './order-store.contract.ts';

orderStoreContract('fake', () => Promise.resolve(makeFakeOrderStore().store));
