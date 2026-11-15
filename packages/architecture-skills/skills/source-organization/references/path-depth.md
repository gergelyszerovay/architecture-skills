# Path-depth layout

Public modules sit directly at registered library roots; descendants are private.

```text
libs/order-pricing/
  price-order.ts
  pricing-errors.ts
  internal/
    calculate-discount.ts
    tax-rules.ts
```

Cross-library imports use a public module alias, for example
@app/libs/order-pricing/price-order. Same-library imports are relative.
No index barrels or wildcard re-exports.

Implementation details belong in the interior. Public entry modules can import private
descendants; wiring and registration code does not require root/public placement.

Register roots explicitly. When discovering candidates beneath the configured libs root,
grouping directories contain no source and traversal stops at an established library.
Do not classify source directories inside a library as new libraries. Confirm candidates
against configuration and generated/test roots.

Public placement does not override other
dependency restrictions the project defines. Apply the
[file/declaration policy](declarations.md) with direct consumers resolved through public
modules.
