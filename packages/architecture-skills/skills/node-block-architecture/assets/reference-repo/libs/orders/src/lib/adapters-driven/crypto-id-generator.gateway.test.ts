import { idGeneratorContract } from '../testing/id-generator.contract.ts';
import { makeCryptoIdGenerator } from './crypto-id-generator.gateway.ts';

idGeneratorContract('crypto', makeCryptoIdGenerator);
