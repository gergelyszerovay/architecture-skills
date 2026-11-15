import { makeInMemoryProductStore } from './in-memory-product-store.repository.ts';
import { productStoreContract } from '../testing/product-store.contract.ts';

productStoreContract('in-memory repository', (products) =>
  Promise.resolve(makeInMemoryProductStore(products)),
);
