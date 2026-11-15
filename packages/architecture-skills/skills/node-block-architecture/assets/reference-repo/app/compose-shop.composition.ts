import { createContainer, asFunction, asValue, InjectionMode, type AwilixContainer } from 'awilix';
import {
  makeGetPrices,
  makeInMemoryProductStore,
  type GetPrices,
  type Product,
} from '#libs/catalog';
import {
  makePlaceOrder,
  makeWatchOrder,
  makeInMemoryOrderStore,
  makeInMemoryOrderEvents,
  makeCryptoIdGenerator,
  type PlaceOrder,
  type WatchOrder,
  type PriceLookup,
  type IdGenerator,
} from '#libs/orders';
import { makeCatalogPriceLookup } from './catalog-price-lookup.bridge.ts';

/** The Awilix cradle for the shop composition: seeds, use cases, and their dependencies. */
type ShopCradle = {
  seedProducts: Product[];
  products: ReturnType<typeof makeInMemoryProductStore>;
  getPrices: GetPrices;
  orders: ReturnType<typeof makeInMemoryOrderStore>;
  events: ReturnType<typeof makeInMemoryOrderEvents>;
  ids: IdGenerator;
  prices: PriceLookup;
  placeOrder: PlaceOrder;
  watchOrder: WatchOrder;
};

/** The use cases exposed by the shop composition. */
type ShopApp = { getPrices: GetPrices; placeOrder: PlaceOrder; watchOrder: WatchOrder };

/** The shop use cases, container, and disposer created by {@link composeShop}. */
export type ShopComposition = {
  app: ShopApp;
  container: AwilixContainer<ShopCradle>;
  dispose: () => Promise<void>;
};

/**
 * The only file that knows Awilix.
 * @param options - The seed products to register into the catalog on startup.
 * @returns The composed use cases and a disposer.
 */
export const composeShop = (options: { seedProducts?: Product[] } = {}): ShopComposition => {
  const container = createContainer<ShopCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });
  container.register({ seedProducts: asValue(options.seedProducts ?? []) });
  container.register({
    products: asFunction(
      ({ seedProducts }: ShopCradle): ReturnType<typeof makeInMemoryProductStore> =>
        makeInMemoryProductStore(seedProducts),
    ).singleton(),
    getPrices: asFunction(makeGetPrices).singleton(),
  });
  container.register({
    orders: asFunction(makeInMemoryOrderStore).singleton(),
    events: asFunction(makeInMemoryOrderEvents).singleton(),
    ids: asFunction(makeCryptoIdGenerator).singleton(),
    placeOrder: asFunction(makePlaceOrder).singleton(),
    watchOrder: asFunction(makeWatchOrder).singleton(),
  });
  container.register({ prices: asFunction(makeCatalogPriceLookup).singleton() });
  const { getPrices, placeOrder, watchOrder } = container.cradle;
  const dispose = (): Promise<void> => container.dispose();
  return { app: { getPrices, placeOrder, watchOrder }, container, dispose };
};
