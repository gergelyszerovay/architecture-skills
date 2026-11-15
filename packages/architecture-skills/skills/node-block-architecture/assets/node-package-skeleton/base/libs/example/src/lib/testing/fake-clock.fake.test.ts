import { clockContract } from './clock.contract.ts';
import { makeFakeClock } from './fake-clock.fake.ts';

clockContract('fake', () => Promise.resolve(makeFakeClock()));
