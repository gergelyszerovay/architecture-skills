# Profile: node-block-architecture

> The checkable rules of the Node block architecture: hexagon layers and folders, feature isolation, block dependencies, required TSDoc tags, spec kinds and coverage.

## 1. Identity

- Version: 0.5.3
- Constitution: node-block-architecture.constitution.md
- Classifier: file-suffix

## 2. Layers

| Layer       | Allowed packages                                            | Decision |
| ----------- | ----------------------------------------------------------- | -------- |
| domain      | none                                                        | D4, D5   |
| contracts   | none                                                        | D56, D57 |
| application | node:assert, node:crypto, node:events, node:path, node:util | D1, D5   |
| driving     | \*                                                          | D18      |
| driven      | \*                                                          | D3       |
| mapping     | \*                                                          | D16      |
| composition | \*, workspace                                               | D9, D26  |
| bridging    | workspace, node:path                                        | D9, D55  |
| testing     | \*                                                          | D46      |
| utility     | node:assert, node:crypto, node:events, node:path, node:util | D10, D12 |

## 3. Library roles

| Role    | May depend on | Decision     |
| ------- | ------------- | ------------ |
| feature | shared        | D7, D8, D52  |
| shared  | shared        | D7, D10, D52 |

## 4. Blocks

| Block           | Layer       | Required tags                                                                                      | Spec kinds                     | May depend on                                                                                                       | Decision               |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| .model.ts       | domain      | none                                                                                               | invariant                      | model, util                                                                                                         | D4                     |
| .rules.ts       | domain      | none                                                                                               | invariant                      | model, rules, policy, error, util                                                                                   | D4                     |
| .policy.ts      | domain      | none                                                                                               | invariant                      | model, rules, policy, error, util                                                                                   | D4                     |
| .error.ts       | domain      | none                                                                                               | none                           | model, error, util                                                                                                  | D4, D23                |
| .events.ts      | domain      | none                                                                                               | none                           | model, events, util                                                                                                 | D4                     |
| .use-case.ts    | application | failure                                                                                            | scenario, edge-case            | port, state, model, rules, policy, error, events, input, result, step, util                                         | D2, D14, D20, D23, D54 |
| .flow.ts        | application | lifetime(process/request/operation), failure                                                       | scenario, edge-case            | use-case, port, state, model, rules, policy, error, events, input, result, step, util                               | D14, D20, D54          |
| .step.ts        | application | failure                                                                                            | scenario, edge-case            | port, state, model, rules, policy, error, events, input, result, step, util                                         | D14, D20, D54          |
| .state.ts       | application | owns, lifetime(process/request/operation), cleanup                                                 | scenario, edge-case, invariant | port, model, rules, policy, error, events, state, util                                                              | D15, D20, D24          |
| .port.ts        | application | failure                                                                                            | scenario, edge-case            | model, error, events, port, input, result, util                                                                     | D3, D23                |
| .input.ts       | application | none                                                                                               | none                           | port, model, input, util                                                                                            | D2                     |
| .result.ts      | application | none                                                                                               | none                           | model, error, events, input, result, util                                                                           | D2                     |
| .dto.ts         | contracts   | none                                                                                               | invariant                      | dto, util                                                                                                           | D56, D57               |
| .repository.ts  | driven      | failure                                                                                            | scenario, edge-case            | port, model, error, events, input, result, mapper, wire, util                                                       | D3, D23, D28           |
| .gateway.ts     | driven      | failure                                                                                            | scenario, edge-case            | port, model, error, events, input, result, mapper, wire, util                                                       | D3, D23, D28           |
| .publisher.ts   | driven      | failure                                                                                            | scenario, edge-case            | port, model, error, events, input, result, mapper, wire, util                                                       | D3, D23, D28           |
| .wire.ts        | driven      | none                                                                                               | invariant                      | wire, util                                                                                                          | D28                    |
| .mapper.ts      | mapping     | none                                                                                               | invariant                      | model, error, events, input, result, wire, schema, mapper, dto, util                                                | D16, D56               |
| .route.ts       | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .tool.ts        | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .resource.ts    | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .prompt.ts      | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .cli.ts         | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18, D19          |
| .resolver.ts    | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .procedure.ts   | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .handler.ts     | driving     | none                                                                                               | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18               |
| .socket.ts      | driving     | lifetime(process/request/operation), cleanup                                                       | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18, D20          |
| .consumer.ts    | driving     | concurrency(reject-while-busy/serialize/latest-wins/first-wins/dedupe-by-key/independent), failure | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18, D21          |
| .job.ts         | driving     | concurrency(reject-while-busy/serialize/latest-wins/first-wins/dedupe-by-key/independent), failure | scenario, edge-case            | use-case, flow, input, result, model, error, events, format, schema, mapper, middleware, util                       | D17, D18, D21          |
| .router.ts      | driving     | none                                                                                               | none                           | procedure, router, middleware, use-case, flow, input, result, model, util                                           | D18                    |
| .middleware.ts  | driving     | none                                                                                               | scenario, edge-case            | model, error, format, schema, middleware, util                                                                      | D18, D25               |
| .format.ts      | driving     | none                                                                                               | invariant                      | model, error, events, input, result, format, dto, util                                                              | D18, D56               |
| .schema.ts      | driving     | none                                                                                               | invariant                      | model, input, schema, util                                                                                          | D28                    |
| .composition.ts | composition | none                                                                                               | scenario                       | \*                                                                                                                  | D24, D26, D27          |
| .entry.ts       | composition | none                                                                                               | none                           | \*                                                                                                                  | D26, D59               |
| .bridge.ts      | bridging    | none                                                                                               | scenario, edge-case            | use-case, flow, port, state, input, result, model, error, events, mapper, wire, util                                | D8, D9, D55            |
| .config.ts      | composition | none                                                                                               | edge-case                      | model, schema, config, util                                                                                         | D26                    |
| .server.ts      | composition | cleanup                                                                                            | none                           | router, procedure, route, tool, resource, prompt, resolver, socket, handler, middleware, config, model, error, util | D24, D26               |
| .main.ts        | composition | none                                                                                               | scenario                       | composition, config, server, model, util                                                                            | D19, D24               |
| .fake.ts        | testing     | none                                                                                               | none                           | \*                                                                                                                  | D46                    |
| .util.ts        | utility     | none                                                                                               | invariant                      | util                                                                                                                | D10, D12               |
| .fixture.ts     | testing     | none                                                                                               | none                           | \*                                                                                                                  | D46                    |
| .contract.ts    | testing     | none                                                                                               | none                           | \*                                                                                                                  | D46                    |

## 5. Structural rules

| Rule                    | Parameters                                                                                                                                                                                                                                                                                 | Enforced by        | Decision                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------- |
| library-roles           | role-source=context-path; shared-dir=shared; default-role=feature; shared-role=shared                                                                                                                                                                                                      | architecture-check | D7, D8, D52                       |
| context-access          | contexts=package-doc; shared-dir=shared                                                                                                                                                                                                                                                    | architecture-check | D52                               |
| acyclic                 | include-type-only=true                                                                                                                                                                                                                                                                     | architecture-check | D32                               |
| public-entry-only       | layout=barrel; test-entry=src/testing.ts                                                                                                                                                                                                                                                   | architecture-check | D29                               |
| composition-root        | dir=app                                                                                                                                                                                                                                                                                    | architecture-check | D26                               |
| directory-allow-list    | core=core; adapters-driving=adapters-driving, core; adapters-driven=adapters-driven, core                                                                                                                                                                                                  | architecture-check | D1, D28                           |
| layer-packages          | approved=package-doc                                                                                                                                                                                                                                                                       | architecture-check | D4, D5, D9, D25, D55, D56         |
| block-allow-list        | include-type-only=true                                                                                                                                                                                                                                                                     | architecture-check | D14, D15, D16, D18, D28, D54, D56 |
| no-testing-in-prod      | test-suffix=.test.ts; test-entry=src/testing.ts                                                                                                                                                                                                                                            | architecture-check | D46                               |
| private-blocks          | blocks=step                                                                                                                                                                                                                                                                                | architecture-check | D54                               |
| entry-only              | blocks=entry                                                                                                                                                                                                                                                                               | eslint             | D59                               |
| block-placement         | domain=core; application=core; driving=adapters-driving; driven=adapters-driven; mapping=adapters-driving, adapters-driven; composition=app; bridging=app; contracts=core; testing=testing; router=adapters-driving, app; entry=src/; utility=core, adapters-driving, adapters-driven, app | checker            | D9, D12, D16, D55, D56, D59       |
| tsdoc-tags              | none                                                                                                                                                                                                                                                                                       | checker            | D20, D39                          |
| originating-declaration | none                                                                                                                                                                                                                                                                                       | architecture-check | D29, D33                          |
| spec-structure          | none                                                                                                                                                                                                                                                                                       | planned            | D41, D42, D43, D47                |

## 6. Coverage rules

| Rule                  | Applies to                                                                                                                                                             | Parameters                              | Enforced by | Decision      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------- | ------------- |
| export-has-spec       | .use-case.ts, .flow.ts                                                                                                                                                 | kind=scenario                           | planned     | D44, D45, D51 |
| failure-path-has-spec | .use-case.ts, .flow.ts, .state.ts, .route.ts, .tool.ts, .resource.ts, .prompt.ts, .cli.ts, .resolver.ts, .procedure.ts, .handler.ts, .socket.ts, .consumer.ts, .job.ts | kind=edge-case                          | planned     | D44, D51      |
| export-has-spec       | .rules.ts, .policy.ts                                                                                                                                                  | kind=invariant                          | planned     | D44, D51      |
| port-has-contract     | .port.ts                                                                                                                                                               | suite=.contract.ts; runs=fake, adapters | planned     | D44, D46, D51 |
| export-has-spec       | .main.ts                                                                                                                                                               | kind=scenario                           | planned     | D44, D51      |

## 7. Spec kinds

| Kind      | Structure          | Runners | Decision      |
| --------- | ------------------ | ------- | ------------- |
| scenario  | aaa                | vitest  | D41, D43, D48 |
| edge-case | aaa                | vitest  | D41, D43, D48 |
| invariant | statement-examples | vitest  | D41, D43, D48 |

## 8. Levels

| Level   | Doc template | Decision |
| ------- | ------------ | -------- |
| group   | none         | D36      |
| package | node-package | D38      |
| lib     | node-lib     | D37      |
| block   | none         | D39      |
