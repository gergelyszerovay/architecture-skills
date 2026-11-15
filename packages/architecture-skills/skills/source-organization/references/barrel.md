# Barrel / Nx-like layout

Libraries live in a `libs/` directory at the package root; in a repository without
workspace packages, the repository is the package. Each library's `src/index.ts` declares
its named public exports, and all other source lives under `src/lib/`. Every file except
`src/index.ts` is private. The library root can hold its own package.json, project.json, or
tsconfig.

```text
libs/order-pricing/
  src/
    index.ts
    lib/
      price-order.ts
      calculate-discount.ts
      rules/
        tax-rules.ts
```

Grouping directories under `libs/` (for example `libs/shared/`) contain no source files.
Discovery stops at the first directory holding `src/index.ts`; libraries do not nest, and
directories inside a library are never libraries.

```text
libs/
  order-pricing/        # library
  shared/               # grouping directory
    money/              # library
    http-client/        # library
```

Cross-library imports name only the library's public alias, such as `#libs/order-pricing`
or `@app/order-pricing`. Prefer an alias that resolves only to the barrel, for example a
package.json `imports` pattern `"#libs/*": "./libs/*/src/index.ts"`, so a deep import
fails to resolve. Same-library imports are relative and bypass the barrel. No nested
barrels or wildcard re-exports.

An architecture that offers some importers less than the whole barrel states it as a rule
over the barrel's exports, judged by the declaration imported (the Angular block
architecture: D45), not as a second, narrower entry. Grouping directories may nest one level
(`libs/<context>/<lib>`), and the `#libs/*` pattern matches across the slash. When applying the [file/declaration policy](declarations.md),
resolve consumers through barrels to the actual declaring implementations.

Code that is not a library (entry points, composition, framework application shells)
lives outside `libs/`, where the owning architecture places it, and imports libraries
through their public aliases.

Lazily loaded entry points (routes, plugins, commands) are exported by name, and lazy
imports use the public barrel. Deep imports are not an exception for lazy loading.

This layout does not require Nx, project.json, independent builds, or workspace packages.
Register library roots, grouping directories, and generated roots explicitly.

Eagerly loaded exports (such as typed path builders or constants) must remain free of heavy
implementation dependencies. When eager exports share a barrel with lazy entry points,
verify actual bundling rather than assuming tree-shaking isolates them. A single barrel relies on
the package's `sideEffects` field to drop its unused exports, and an ESLint rule that refuses imports
with no bindings keeps the field safe.
