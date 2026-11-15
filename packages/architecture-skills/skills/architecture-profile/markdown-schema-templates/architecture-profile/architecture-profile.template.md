<!-- TEMPLATE-ONLY: guide
// An architecture profile is the only machine-readable, normative copy of an
// architecture's checkable rules (see the architecture's constitution). Lint
// configs, checkers, documentation generators and reviewer tools read it
// instead of hard-coding their own copy. Every rule row cites the constitution
// decision it implements.
//
// Title: the architecture skill's name, e.g. `angular-block-architecture`.
// Summary: one sentence stating what the profile governs.
//
// Rules come from a fixed vocabulary that tools implement; a profile selects
// and parameterizes them. A rule outside the vocabulary is a template error:
// add the rule type to the tools first, or keep the rule in prose for review.
//
// Cross-section rules enforced by architecture-profile.refine.ts:
//   - Layer, Role, Block and Kind names are unique within their tables.
//   - Every Blocks.Layer names a row of Layers.
//   - Every Blocks.May depend on entry names a block, or is `*`.
//   - Every Library roles.May depend on entry names a role.
//   - Every role a structural rule's role parameter names is a Library role.
//   - Every block a structural rule's `blocks` parameter names is a block.
//   - Every Blocks.Spec kinds entry names a row of Spec kinds.
//   - With the `file-suffix` classifier, every block name is a file suffix
//     such as `.store.ts`.
//   - Structural and coverage rule names are in the tools' vocabulary.
//   - Every Coverage rules.Applies to entry names a block.
-->

# Profile: <!-- TEMPLATE-ONLY: string; regex `^[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,300}$` -->

## 1. Identity

<!-- TEMPLATE-ONLY: guide
// Version: the profile's version; packages bind to a profile name and version.
// Constitution: the constitution this profile implements, relative to the profile.
// Classifier: how tools decide which block a source unit is. `file-suffix`
// classifies TypeScript files by suffix (`.store.ts`); `sql-object` classifies
// database objects (tables, policies, functions) found in migrations.
-->

- Version: <!-- TEMPLATE-ONLY: string; regex `^\d+\.\d+\.\d+$`; required -->
- Constitution: <!-- TEMPLATE-ONLY: string; required -->
- Classifier: <!-- TEMPLATE-ONLY: enum: file-suffix | sql-object; required -->

## 2. Layers

<!-- TEMPLATE-ONLY: guide
// Groups of blocks, and the external packages their blocks may import.
// Allowed packages: `*` for any, `none` for no external packages, or a
// comma-separated list of package patterns such as `@angular/*, rxjs`;
// the token `workspace` in the list stands for every package of the
// repository's own workspace (references/rules.md, "Layers").
// Node built-in modules are named with their `node:` prefix (`node:crypto`);
// `none` excludes built-ins too.
-->

| Layer | Allowed packages | Decision |
| ----- | ---------------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Layer: string; regex `^[a-z][a-z-]*$`; required
Allowed packages: string; regex `^(\*|none|[@a-z0-9*][@a-z0-9*/._:-]*(, [@a-z0-9*][@a-z0-9*/._:-]*)*)$`; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| domain | none | D14 |

## 3. Library roles

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Library roles and the roles each may depend on (an upper bound; block rules
// still apply). A library declares its role in its authored lib doc.
-->

| Role | May depend on | Decision |
| ---- | ------------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Role: string; regex `^[a-z][a-z-]*$`; required
May depend on: string; regex `^(none|[a-z][a-z-]*(, [a-z][a-z-]*)*)$`; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| domain | domain | D2 |

## 4. Blocks

<!-- TEMPLATE-ONLY: guide
// One row per block type.
// Block: the classifier's name for it, e.g. `.store.ts`.
// Required tags: TSDoc tags the block's primary declaration must carry,
// comma-separated; a tag with a fixed value set lists it in parentheses,
// separated by `/`, e.g. `lifetime(app/route/component)`. `none` if none.
// Spec kinds: the kinds its specs may use, comma-separated, or `none`.
// May depend on: blocks this block may import, by name without dot and
// extension (`store` for `.store.ts`), comma-separated; `*` for any; `none`.
-->

| Block | Layer | Required tags | Spec kinds | May depend on | Decision |
| ----- | ----- | ------------- | ---------- | ------------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Block: string; key; required
Layer: string; required
Required tags: string; regex `^(none|[a-z][a-z-]*(\([a-z/-]+\))?(, [a-z][a-z-]*(\([a-z/-]+\))?)*)$`; required
Spec kinds: string; regex `^(none|[a-z][a-z-]*(, [a-z][a-z-]*)*)$`; required
May depend on: string; regex `^(\*|none|[a-z][a-z-]*(, [a-z][a-z-]*)*)$`; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| .rules.ts | domain | none | invariant | model, rules | D14 |

## 5. Structural rules

<!-- TEMPLATE-ONLY: guide
// Rules about the dependency graph and declarations, from the tools'
// vocabulary: library-roles, acyclic, public-entry-only, block-allow-list,
// layer-packages, no-testing-in-prod, private-blocks, composition-root,
// directory-allow-list, context-access, contract-only, lazy-places,
// block-placement, max-facades-per-component, no-symbol, providers-only,
// entry-only, originating-declaration, tsdoc-tags, spec-structure,
// package-allow-list, use-case-has-journey, file-naming, unit-manifest, unit-imports,
// entry-excludes-package.
// Parameters: rule-specific, `key=value` pairs separated by `; `, or `none`
// (references/rules.md). A parameter that names roles (default-role,
// places-role, shared-role, contract-roles, index-roles) names rows of Library
// roles: the tools know no role of their own.
// Enforced by: the tool that checks the rule today (architecture-check, which judges a rule
// by symbol over the manifest, eslint, oxlint or checker), or `planned`. `dependency-cruiser`
// stays valid for the copies of profiles written before plan 0121, which architecture-check
// judges as `architecture-check`.
-->

| Rule | Parameters | Enforced by | Decision |
| ---- | ---------- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Rule: string; key; required
Parameters: string; required
Enforced by: enum: dependency-cruiser | eslint | oxlint | checker | architecture-check | planned; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| acyclic | include-type-only=true | architecture-check | D3 |

## 6. Coverage rules

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Which specs each block must have, from the tools' vocabulary:
// public-method-has-spec, failure-path-has-spec, export-has-spec,
// interactive-ui-has-spec, port-has-contract, dispose-has-spec. Applies to:
// block names, comma-separated. Omit the section when no block has its own coverage rule.
-->

| Rule | Applies to | Parameters | Enforced by | Decision |
| ---- | ---------- | ---------- | ----------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Rule: string; required
Applies to: string; required
Parameters: string; required
Enforced by: enum: dependency-cruiser | eslint | oxlint | checker | architecture-check | planned; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| export-has-spec | .rules.ts | kind=invariant | planned | D34 |

## 7. Spec kinds

<!-- TEMPLATE-ONLY: guide
// Structure: `aaa` (arrange/act/assert, one act), `statement-examples`
// (a statement plus an example table or property body), or `gwt-steps`
// (one Given, then ordered When/Then steps). Runners: comma-separated.
-->

| Kind | Structure | Runners | Decision |
| ---- | --------- | ------- | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Kind: string; regex `^[a-z][a-z-]*$`; required
Structure: enum: aaa | statement-examples | gwt-steps; required
Runners: string; regex `^[a-z][a-z-]*(, [a-z][a-z-]*)*$`; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| invariant | statement-examples | vitest | D33 |

## 8. Levels

<!-- TEMPLATE-ONLY: guide
// The authored doc template bound to each documentation level, or `none`.
-->

| Level | Doc template | Decision |
| ----- | ------------ | -------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Level: enum: group | package | lib | block; required
Doc template: string; regex `^(none|[a-z][a-z0-9-]*)$`; required
Decision: string; regex `^D[1-9][0-9]*(, D[1-9][0-9]*)*$`; required
-->

| lib | angular-lib | D28 |
