import { clockContract } from '../testing/clock.contract.ts';
import { makeSystemClock } from './system-clock.gateway.ts';

clockContract('system clock', () => Promise.resolve(makeSystemClock()));
