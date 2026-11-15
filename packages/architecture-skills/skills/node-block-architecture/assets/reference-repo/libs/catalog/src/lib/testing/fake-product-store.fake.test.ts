import { makeFakeProductStore } from './fake-product-store.fake.ts';
import { productStoreContract } from './product-store.contract.ts';

productStoreContract('fake', (products) => Promise.resolve(makeFakeProductStore(products)));
