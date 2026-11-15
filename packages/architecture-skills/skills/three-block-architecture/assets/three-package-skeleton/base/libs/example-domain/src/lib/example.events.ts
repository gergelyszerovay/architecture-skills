import type { EngineEvents } from './engine-events.model';
import type { ExampleParams } from './example-params.model';

/** Events the example engine emits to its host. */
export type ExampleEvents = EngineEvents<ExampleParams>;
