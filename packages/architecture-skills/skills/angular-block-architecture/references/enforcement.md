# Enforcement and verification

Separate mechanically checked restrictions from ownership and behavior assessed through
contracts and tests. No single lint configuration proves this architecture.

Register authored library roots, roles, layouts, public surfaces, and allowed dependencies.
Include package-root libs and src as applicable, plus grouped/generated roots and tests.
Use existing tooling where possible; verify version-specific capabilities before adding
configuration.

| Concern                                                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library edges/cycles                                                  | Resolved graph, including type-only dependencies                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Privacy                                                               | Resolved ownership and alias/relative/deep-import checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Block restrictions through barrels                                    | architecture-check judges every block rule at the declaration a barrel re-exports (the profile's `originating-declaration` row)                                                                                                                                                                                                                                                                                                                                                                                         |
| Component/facade consumption limits                                   | The profile's `max-facades-per-component` row, judged by architecture-check's `facades` rule (ESLint's `buildMaxFacades` is the fallback, [linting.md](linting.md))                                                                                                                                                                                                                                                                                                                                                     |
| Component, template and TypeScript conventions                        | ESLint with angular-eslint and typescript-eslint ([linting.md](linting.md))                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Subscriptions above the view-model seam                               | The profile's `no-symbol` rule, built into ESLint by `eslint-rules.cjs`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| State ownership/lifetime                                              | Provider inspection and targeted isolation/lifecycle tests                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Freshness/atomic publication                                          | Overlap/failure behavior tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Wire isolation                                                        | Public type/import inspection and relevant validation/mapping tests                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| File/declaration policy                                               | AST classification plus symbol/reference analysis; see the architecture-source-organization skill's declarations reference                                                                                                                                                                                                                                                                                                                                                                                              |
| Block allow-list, layer packages, library roles, cycles, public entry | architecture-check's `dependencies` rule (`reviewer2-check`), over the manifest's imports, dynamic `import()` and side-effect imports included                                                                                                                                                                                                                                                                                                                                                                          |
| Context access, contract surfaces                                     | The profile's `context-access` and `contract-only` rules, from the package doc's Contexts table and the role source, judged by architecture-check; `contract-only` judges the imported declaration's block, so a capability's wiring, a `.providers.ts` block the row does not list (D51), stays the composition's                                                                                                                                                                                                      |
| Facades per component                                                 | The profile's `max-facades-per-component` rule, judged by architecture-check's `facades` rule; `buildMaxFacades` of `eslint-rules.cjs` builds the same rule into ESLint for a project without `reviewer2-check`                                                                                                                                                                                                                                                                                                         |
| Route provider wiring                                                 | The block allow-list (a `.routes.ts` imports its `.providers.ts` and none of the stores, flows, commands, resources, facades, connectors or realtime blocks it provides) and the profile's `providers-only` rule, built into ESLint by `eslint-rules.cjs`                                                                                                                                                                                                                                                               |
| Lazy places                                                           | The profile's `lazy-places` rule, judged by architecture-check over the dynamic `import()` edges, which say which library is lazy and which `.routes.ts` loads it: of a library a `.routes.ts` loads through `import()`, no file of another library imports it statically (every `import` or `export … from` declaration counts, an `import type` and a spec included; only an `import()` does not); no fallback, so review where `reviewer2-check` does not run, and the production build keeps the place's lazy chunk |
| Required TSDoc tags                                                   | The profile's `tsdoc-tags` checker on each block's primary declaration                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Spec kinds and metadata                                               | Vitest tag definitions with `strictTags`, plus the spec-kind type augmentation                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Spec structure and coverage                                           | The profile's `spec-structure` and coverage rules; review while they are `planned`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Authored docs                                                         | `validate-md` against this skill's templates, through the layered-docs tree check                                                                                                                                                                                                                                                                                                                                                                                                                                       |

The architecture profile ([angular-block-architecture.architecture-profile.md](../angular-block-architecture.architecture-profile.md)) is the only copy of the checkable
rules (constitution [D23](../angular-block-architecture.constitution.md#D23)). Its import rules name `architecture-check` (`reviewer2-check`), which
reads the profile and the package doc as data and reports a finding naming the profile rule and
the decision it breaks; a package doc's Rule Exceptions table excuses a finding as an `info` with
its reason. It is the one engine of the import rules (the architecture-profile skill's
`rules.md`, "Engines"): `layer-packages` reads a layer's `*` as every external package and no
package of the workspace, so an application imports another workspace package (its API types,
say) only through an Approved Packages row for the layer.

A rule a package adopts gradually is recorded in the package doc's Rule Exceptions table, which
turns its findings into `info`s with the reason.

Legal container-to-facade-to-store dependencies must pass. Forbidden direct consumption
of a re-exported store symbol must fail. A transitive graph ban cannot distinguish these;
record coverage gaps rather than claiming a library graph tool proves symbol restrictions.

## ESLint pitfalls

no-restricted-imports matches specifier text, not resolved ownership or declaration origins.

Flat-config entries setting the same rule replace its options; they do not merge arrays.
Suffix-specific entries can replace general restrictions even when the suffix groups are
disjoint from one another. Construct complete restrictions for each matched file class
and inspect effective configuration for representative files.

Negated import patterns describe import specifiers, not importing source locations.
Use files/ignores or generated per-file-class configuration for importer exemptions.

Apply schema restrictions by ownership: local URL/form schemas are not wire schemas.
Check both .command.ts and legacy .mutation.ts during migration. Rendering restrictions
cover pages, containers, dialogs, layouts, UI, and adapters.

## Verify enforcement changes

Use small fixtures or temporary examples when changing boundary tooling:

- Reject private imports through aliases and relative paths.
- Reject forbidden store/API/facade symbols consumed through barrels.
- Reject cycles, including type-only back-edges.
- Accept legal containers and composition hosting multiple independent containers.
- Accept permitted domain dependencies and local input schemas.
- Reject production imports of testing helpers.
- Confirm general restrictions remain active in suffix-specific files.

Do not present illustrative config as complete without checking actual roots, aliases,
compiler settings, and re-exports.

## Routine checks

Run relevant existing lint, build/type, and behavioral checks in proportion to changes.
Do not install hooks or require whole-repository tests after every agent turn.

Identifier greps aid inspection but do not prove wire isolation. Grep cannot reliably
validate template semantics or DI ownership either.

Exceptions follow D25. Never bypass boundaries by changing import spelling; correct
ownership, contracts, or the documented policy.
