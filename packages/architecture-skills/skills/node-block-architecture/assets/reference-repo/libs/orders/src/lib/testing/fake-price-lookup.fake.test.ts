import { makeFakePriceLookup } from './fake-price-lookup.fake.ts';
import { priceLookupContract } from './price-lookup.contract.ts';

priceLookupContract('fake', (prices) => makeFakePriceLookup(prices));
