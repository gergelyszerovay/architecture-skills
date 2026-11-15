import { makeFakeOrderEvents } from './fake-order-events.fake.ts';
import { orderEventsContract } from './order-events.contract.ts';

orderEventsContract('fake', () => Promise.resolve(makeFakeOrderEvents().events));
