# File and declaration policy

Use one primary declaration per implementation file, with the explicit supporting cases
below. This is not a literal limit of one AST declaration node. The policy is the same in
every layout; the selected layout guide governs placement and visibility.

The policy has two profiles. The **primary profile** (the default, described first) allows
the listed supporting declarations. The **strict profile** (see
[Strict single-declaration profile](#strict-single-declaration-profile)) removes them. An
architecture skill or project instruction selects the profile per package; do not mix
profiles inside one package.

## Primary declarations and permitted companions

- Every implementation file exports exactly one declaration, its primary, except for the
  cases below: a coupled pair, a supporting co-export, and two mutually recursive functions
  that both have external callers.
- A function or class file has one primary function or class. Arrow functions and function
  expressions assigned to variables count as functions, not supporting constants.
- Unexported types, constants, enums and functions used only in that file are supporting
  declarations and stay inline: a primary function or class may keep its private helper
  functions beside it. A private class is not one; give it its own file. A declaration
  another file needs is not private: it gets its own file unless a case below applies
  (companion types are not exempt).
- A type-only or constant-only file exports exactly one declaration, except for a coupled
  pair. Supporting private declarations must be used only in that file or be the schema
  checks described below.
- Supporting declarations may be co-exported from their owning implementation when needed
  by that implementation and its direct consumer. A second exported function is not
  a supporting declaration.
- A constant and its associated type that cannot change independently stay together:
  an as-const value with its derived type, an enum with its derived union, or a schema with
  its hand-written type. Do not interpret arbitrary “tightly coupled code” as an exception.
- Two mutually recursive functions may share a file when separating them would create a
  circular import. Name the file after the primary entry. Normally only it is exported and
  the other is a private helper; export both only when both have external callers. Do not generalize this exception to an
  arbitrary collection of functions or classes.
- Each root-level let/const statement declares at most one variable. Multiple bindings
  are prohibited even if they would otherwise qualify as supporting constants.

Class methods and function-local declarations belong to their enclosing declaration.
A command factory returning several methods remains one primary function. Function overload
signatures describe the same function; a checker must resolve them with its implementation
rather than count them as independent functions.

## Consumers and layout

Consumer analysis follows the actual declaring symbol through aliases and re-exports;
type-only uses count. Importing a primary function does not automatically make that importer
a consumer of every supporting declaration in its file.

For a supporting co-export, the symbol is used in its declaring implementation and by one
direct consuming implementation. Other consumer patterns require a separate declaration
file in the owning library, or a deliberately shared owner if needed across libraries.
Public re-export plumbing is not an additional implementation consumer. This ownership
test does not prescribe parent/child directories; apply the selected layout's placement
rules separately.

Public visibility remains layout-specific. A supporting export does not authorize a deep
import; expose it through the permitted public surface or keep its consumers internal.
Any declaration sharing must also respect the project's architectural dependency rules.

## Schema/type pairs

Use a type-first policy: hand-write the type, then its schema in the same
file. Do not use z.infer as the primary domain type definition. Include the two unexported
type-only compatibility checks below; they are permitted supporting declarations:

```ts
export type OrderItem = { id: string };
export const OrderItemSchema = z.object({ id: z.string() });
type _OrderItemExhaustive<T extends OrderItem = z.infer<typeof OrderItemSchema>> = T;
type _OrderItemReverse<T extends z.infer<typeof OrderItemSchema> = OrderItem> = T;
```

A type parameter's default must satisfy its constraint even when the alias is never used, so
each alias fails to compile (TS2344, naming the property that differs) unless the schema's
output and the type are assignable that way; together they check both directions. The checks
emit no code and need no value. Do not write them as `_`-prefixed variables marked used with
`void _x;`: typescript-eslint 8.71 reports `void` on anything but a call
(`no-meaningless-void-operator`). The `_` prefix exempts them from TSDoc and from
`no-unused-vars` (see the node-block-architecture skill's `references/linting.md`).

This fragment illustrates declaration grouping; imports and required documentation are
omitted. For recursive Zod schemas, use z.lazy() and annotate the schema with z.ZodType<T>
referencing the hand-written type. Co-location decides file grouping only; which layer
may own or expose a schema is decided by the project's architecture.

## Strict single-declaration profile

Every implementation file contains exactly one top-level declaration, and it is exported.
The primary profile's supporting cases do not apply:

- No unexported top-level types, constants, enums, or helpers. Each becomes its own file,
  placed by the selected layout (usually as a private child of its only consumer).
- No supporting co-exports. An operation's request, options, and result types each get
  their own file.
- No coupled pairs. An as-const value and its derived type, an enum and its derived
  union, and a hand-written type and its schema are separate files. The derived or
  schema file imports its counterpart.
- The two schema compatibility assignments move out of the schema file into a type test
  beside it (for example `order-item.schema.test-d.ts`), so the schema file keeps one
  declaration and the check still runs in the test/typecheck task.

What still counts as one declaration: overload signatures with their implementation,
class members, function-local declarations, and a factory returning an object of methods.
Mutual recursion is the only exception: prefer restructuring (an inner function, or
passing the callee as an argument); keep both functions in one file only when that is
impossible without an import cycle.

Enforcement becomes file-local: one top-level declaration, exported, whose name matches
the filename. Symbol/reference analysis is needed only for the mutual-recursion exception.

## Naming, documentation, and special files

### File name from declaration name

The file name is derived from the primary declaration's name, and only from it, so the two
map 1:1 in both directions without a per-block table. Kebab-case the declaration name
(split at each lower-to-upper boundary and before the last capital of an acronym run:
`createVoxelEngine` → `create-voxel-engine`, `HTTPClient` → `http-client`). Then:

1. **The package has no block architecture:** the kebab-cased name is the file stem
   (`emitter.ts` ↔ `Emitter`). In a block architecture this case does not exist: every
   implementation file carries a suffix, and product-independent helpers carry the
   architecture's helper suffix (`.util.ts` in the block architectures of this repository:
   `emitter.util.ts` ↔ `Emitter`, `pick-entity.util.ts` ↔ `pickEntity`), so the
   file-suffix classifier sees every file.
2. **The kebab-cased name ends with `-<suffix>` of the block being declared:** that
   trailing word (or words, for a multi-word suffix such as `use-case`) becomes the file
   suffix and is not repeated in the stem (`flight.controller.ts` ↔ `FlightController`,
   `create-voxel.engine.ts` ↔ `createVoxelEngine`, `voxel.events.ts` ↔ `VoxelEvents`,
   `get-prices.use-case.ts` ↔ `GetPricesUseCase`).
3. **Otherwise:** the whole kebab-cased name is the stem and the block suffix is appended
   (`apply-voxel-params.rules.ts` ↔ `applyVoxelParams`, `voxel-params.model.ts` ↔
   `VoxelParams`, `order-store.port.ts` ↔ `OrderStore`).

Consequences:

- Declaration to file is fully determined once the block kind is known, which the author
  always knows. File to declaration has at most two candidates (the stem alone, or the stem
  followed by the suffix word), so a file-local check compares the kebab-cased primary
  declaration with those two strings and nothing else.
- Casing is a property of the declaration kind (PascalCase for types and classes, camelCase
  for values), never of the file. The file does not say which it holds.
- Verb prefixes such as `create`, `make`, `apply`, `is` or `step` are part of the name and
  therefore of the stem. An architecture may document **one** factory prefix its file names
  omit (for example `make`, so that `catalog.router.ts` holds `makeCatalogRouter`); a checker
  then strips that documented prefix before comparing. Do not invent per-file exceptions, and
  do not document a prefix that is not applied uniformly.
- Only the primary declaration is matched. A permitted companion (a coupled type such as
  `PresentPipeline` next to `createPresentPipeline`, a derived union, a schema) is not
  compared with the file name.
- A file whose primary declaration does not fit either candidate is misnamed or holds the
  wrong declaration; rename or split, do not add a mapping rule.

Name type/schema pairs after the domain concept, with the configured block suffix where
applicable. Suffix schema constants with Schema.

Document every top-level declaration with an immediately preceding TSDoc comment.
Functions require @param for every parameter, and @returns when they return a value;
async functions always have @returns, and a function that returns nothing has none.
Classes require @param for constructor parameters. Destructured parameters with a named
type annotation are exempt from @param; those with inline type annotations are not.

Where the layout permits barrels, they contain named re-exports only, not implementation
declarations. No wildcard or default exports. Tests/stories use explicitly configured
exclusions. Register generated, configuration, and bootstrap
files separately when their actual contracts require it; do not silently exempt all files
with convenient names or exempt application code housed beside configuration.

## Enforcement contract

File-local AST checks cover primary declaration kinds/counts, single variable bindings,
named exports, filename agreement, TSDoc, and recognized coupled-pair/schema patterns.
Overloads and callable variable initializers need correct classification.

Symbol/reference analysis covers supporting-declaration consumer eligibility, aliases and re-exports,
mutual recursion, external callers of the secondary function, and shared ownership.
Validate layout-specific placement separately with the selected layout's structure
validator. A count-only ESLint rule cannot establish these relationships.

Test allowed primary-plus-private-type, primary-plus-private-helper-function, eligible
supporting co-export, coupled pair, type/schema/check assignments, overload group, and
mutual recursion. Reject a second exported function, any second class, extra standalone
exports, multiple variable bindings, and
supporting exports with ineligible consumers. Include aliases, barrels, and type-only uses
in dependency-aware fixtures. Under the strict profile, also reject any unexported
top-level declaration, a type and schema in one file, and schema compatibility assignments
outside a type test. Report unsupported checks as gaps: this document specifies
the policy, it does not install or implement a validator.
