// Host tier: plain data and engine factories only. No three.js type may appear in an
// exported signature (three-block-architecture skill, constitution D2).
export {
  applyExampleParams,
  defaultExampleParams,
  exampleBindingSpecs,
  exampleParamSpecs,
  exampleResolutions,
} from '~libs/example-domain';
export type {
  CommandSpec,
  EffectEngine,
  EngineEvents,
  EngineOptions,
  EngineSnapshot,
  ExampleEvents,
  ExampleParams,
  ExampleResolution,
  InputBindingSpec,
  ParamSpec,
  ReadoutSpec,
} from '~libs/example-domain';
export { createExampleEngine } from '~libs/example-engine';
