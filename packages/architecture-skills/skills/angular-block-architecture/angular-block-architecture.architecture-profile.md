# Profile: angular-block-architecture

> The checkable rules of the Angular block architecture: block types, layers, library roles, dependencies, required TSDoc tags, spec kinds and coverage.

## 1. Identity

- Version: 0.8.6
- Constitution: angular-block-architecture.constitution.md
- Classifier: file-suffix

## 2. Layers

| Layer        | Allowed packages | Decision |
| ------------ | ---------------- | -------- |
| presentation | \*               | D11      |
| state        | \*               | D15      |
| data-access  | \*               | D20      |
| domain       | none             | D14      |
| routing      | \*               | D7       |
| testing      | \*               | D7       |
| utility      | none             | D2, D6   |

## 3. Library roles

| Role           | May depend on                                                                             | Decision    |
| -------------- | ----------------------------------------------------------------------------------------- | ----------- |
| shell          | composition, capability, data-access, domain, ui, utility, infrastructure                 | D2          |
| composition    | composition, capability, domain, ui, utility, infrastructure                              | D2, D5, D47 |
| capability     | capability, data-access, domain, ui, utility, infrastructure                              | D2, D45     |
| data-access    | data-access, domain, utility                                                              | D2          |
| domain         | domain                                                                                    | D2, D14     |
| ui             | ui, domain, utility, infrastructure                                                       | D2, D6      |
| utility        | utility                                                                                   | D2          |
| infrastructure | domain, utility, infrastructure                                                           | D46         |
| testing        | shell, composition, capability, data-access, domain, ui, utility, infrastructure, testing | D2          |

## 4. Blocks

| Block           | Layer        | Required tags                                                                           | Spec kinds                     | May depend on                                                                                               | Decision           |
| --------------- | ------------ | --------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------ |
| .page.ts        | presentation | none                                                                                    | none                           | container, ui, layout, dialog, adapter, pipe, facade, vm, format, rules, paths, model, events, token, util  | D11, D35           |
| .container.ts   | presentation | none                                                                                    | none                           | container, ui, layout, dialog, adapter, pipe, facade, vm, format, rules, paths, model, events, token, util  | D10, D11, D35, D46 |
| .ui.ts          | presentation | none                                                                                    | scenario, edge-case            | ui, layout, adapter, pipe, vm, format, rules, model, events, paths, util                                    | D10, D11           |
| .layout.ts      | presentation | none                                                                                    | none                           | ui, layout, pipe, vm, format, util                                                                          | D11                |
| .dialog.ts      | presentation | dismiss                                                                                 | scenario, edge-case            | container, ui, layout, pipe, facade, vm, format, model, util                                                | D10, D11           |
| .adapter.ts     | presentation | lifetime(app/route/component/operation), cleanup                                        | scenario, edge-case            | vm, format, model, util                                                                                     | D11, D17           |
| .pipe.ts        | presentation | none                                                                                    | invariant                      | format, model, rules, util                                                                                  | D11                |
| .facade.ts      | presentation | none                                                                                    | scenario, edge-case            | store, flow, resource, command, mutation, rules, policy, model, format, vm, paths, token, events, util      | D10, D11, D35      |
| .vm.ts          | presentation | none                                                                                    | none                           | model, vm, util                                                                                             | D11                |
| .format.ts      | presentation | none                                                                                    | invariant                      | model, rules, format, util                                                                                  | D13                |
| .loader.ts      | presentation | none                                                                                    | scenario                       | container, ui, format, model, util                                                                          | D11, D52           |
| .store.ts       | state        | owns, lifetime(app/route/component/operation), reset                                    | scenario, edge-case, invariant | model, rules, policy, events, token, util                                                                   | D15, D16, D17      |
| .flow.ts        | state        | owns, lifetime(app/route/component/operation), failure                                  | scenario, edge-case            | command, mutation, resource, store, rules, policy, model, events, token, util                               | D16, D17, D19      |
| .resource.ts    | state        | identity, cache, failure                                                                | scenario, edge-case            | api, rules, policy, model, token, util                                                                      | D17                |
| .command.ts     | state        | concurrency(latest-wins/serialize/reject-while-busy/dedupe-by-key/independent), failure | scenario, edge-case            | api, rules, policy, model, store, command, events, token, util                                              | D9, D17, D18       |
| .mutation.ts    | state        | concurrency(latest-wins/serialize/reject-while-busy/dedupe-by-key/independent), failure | scenario, edge-case            | api, rules, policy, model, store, command, events, token, util                                              | D9                 |
| .connector.ts   | state        | lifetime(app/route/component/operation), cleanup, failure                               | scenario, edge-case            | command, mutation, store, rules, model, events, token, util                                                 | D17                |
| .realtime.ts    | state        | lifetime(app/route/component/operation), cleanup, failure                               | scenario, edge-case            | api, mapper, store, command, events, model, token, util                                                     | D17                |
| .events.ts      | state        | none                                                                                    | none                           | model, util                                                                                                 | D7                 |
| .token.ts       | state        | none                                                                                    | none                           | loader, model, util                                                                                         | D7                 |
| .api.ts         | data-access  | failure                                                                                 | scenario, edge-case            | schema, mapper, interceptor, model, token, util                                                             | D20, D21           |
| .schema.ts      | data-access  | none                                                                                    | invariant                      | model, schema, util                                                                                         | D21                |
| .mapper.ts      | data-access  | none                                                                                    | invariant                      | model, schema, rules, util                                                                                  | D20                |
| .interceptor.ts | data-access  | none                                                                                    | scenario, edge-case            | token, model, util                                                                                          | D7                 |
| .model.ts       | domain       | none                                                                                    | invariant                      | model, util                                                                                                 | D14                |
| .rules.ts       | domain       | none                                                                                    | invariant                      | model, rules, policy, util                                                                                  | D14                |
| .policy.ts      | domain       | none                                                                                    | invariant                      | model, rules, util                                                                                          | D14                |
| .util.ts        | utility      | none                                                                                    | invariant                      | util                                                                                                        | D6, D7             |
| .routes.ts      | routing      | none                                                                                    | none                           | page, guard, resolver, paths, routes, providers, token, util                                                | D7, D51            |
| .providers.ts   | routing      | none                                                                                    | none                           | store, flow, command, mutation, resource, facade, connector, realtime, providers, rules, model, token, util | D7, D40, D51       |
| .paths.ts       | routing      | none                                                                                    | invariant                      | model, util                                                                                                 | D7                 |
| .guard.ts       | routing      | pending                                                                                 | scenario, edge-case            | store, resource, policy, rules, model, paths, token, util                                                   | D17                |
| .resolver.ts    | routing      | blocking                                                                                | scenario, edge-case            | resource, store, model, paths, token, util                                                                  | D17                |
| .fixture.ts     | testing      | none                                                                                    | none                           | \*                                                                                                          | D7                 |
| .fake.ts        | testing      | none                                                                                    | none                           | \*                                                                                                          | D7                 |

## 5. Structural rules

| Rule                      | Parameters                                                                                                                                  | Enforced by        | Decision                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------- |
| library-roles             | role-source=context-path; shared-dir=shared; places-dir=places; default-role=capability; places-role=composition; vendor-roots=package-doc  | architecture-check | D2, D5, D44, D46, D50       |
| acyclic                   | include-type-only=true                                                                                                                      | architecture-check | D3                          |
| public-entry-only         | layout=barrel; test-entry=src/testing.ts                                                                                                    | architecture-check | D3, D45                     |
| block-allow-list          | include-type-only=true                                                                                                                      | architecture-check | D9, D10, D11, D20, D51, D52 |
| layer-packages            | approved=package-doc                                                                                                                        | architecture-check | D14, D22, D50               |
| context-access            | contexts=package-doc; shared-dir=shared; places-dir=places                                                                                  | architecture-check | D44                         |
| contract-only             | blocks=store, flow, command, mutation, model, rules, format, token, events, util; contract-roles=capability; index-roles=composition, shell | architecture-check | D45, D47                    |
| lazy-places               | none                                                                                                                                        | architecture-check | D53                         |
| no-testing-in-prod        | test-entry=src/testing.ts                                                                                                                   | architecture-check | D2                          |
| max-facades-per-component | max=1                                                                                                                                       | architecture-check | D10, D47                    |
| no-symbol                 | symbols=subscribe; blocks=page, container, ui, facade                                                                                       | eslint             | D12                         |
| providers-only            | blocks=providers                                                                                                                            | eslint             | D51                         |
| originating-declaration   | none                                                                                                                                        | architecture-check | D4, D24                     |
| tsdoc-tags                | none                                                                                                                                        | checker            | D17, D39                    |
| spec-structure            | none                                                                                                                                        | planned            | D31, D32, D33, D36          |

## 6. Coverage rules

| Rule                    | Applies to                                                                                             | Parameters     | Enforced by | Decision |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------- | ----------- | -------- |
| public-method-has-spec  | .facade.ts                                                                                             | kind=scenario  | planned     | D34, D41 |
| failure-path-has-spec   | .store.ts, .flow.ts, .resource.ts, .command.ts, .mutation.ts, .connector.ts, .realtime.ts, .adapter.ts | kind=edge-case | planned     | D34, D41 |
| export-has-spec         | .rules.ts, .policy.ts                                                                                  | kind=invariant | planned     | D34, D41 |
| interactive-ui-has-spec | .ui.ts                                                                                                 | kind=scenario  | planned     | D34, D41 |

## 7. Spec kinds

| Kind      | Structure          | Runners | Decision |
| --------- | ------------------ | ------- | -------- |
| scenario  | aaa                | vitest  | D31, D33 |
| edge-case | aaa                | vitest  | D31, D33 |
| invariant | statement-examples | vitest  | D31, D33 |

## 8. Levels

| Level   | Doc template | Decision |
| ------- | ------------ | -------- |
| group   | none         | D27      |
| package | angular-app  | D27      |
| lib     | angular-lib  | D28      |
| block   | none         | D39      |
