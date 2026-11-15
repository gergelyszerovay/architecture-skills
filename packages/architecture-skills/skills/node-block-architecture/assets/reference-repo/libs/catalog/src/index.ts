export type { GetPrices } from './lib/core/get-prices.use-case.ts';
export type { PriceView } from './lib/core/price-view.result.ts';
export type { Money } from './lib/core/money.model.ts';
export type { Product } from './lib/core/product.model.ts';
export { makeGetPrices } from './lib/core/get-prices.use-case.ts';
export { makeInMemoryProductStore } from './lib/adapters-driven/in-memory-product-store.repository.ts';
export { makeCatalogRouter } from './lib/adapters-driving/catalog.router.ts';
