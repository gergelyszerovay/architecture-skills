import { makeFakeIdGenerator } from './fake-id-generator.fake.ts';
import { idGeneratorContract } from './id-generator.contract.ts';

idGeneratorContract('fake', makeFakeIdGenerator);
