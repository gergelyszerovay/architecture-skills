<!-- TEMPLATE-ONLY: guide
// One per group (a directory holding the packages of one product), in the
// group's layered-docs tree (product-profile constitution D3). It holds what
// no package can state about itself: each package's role, which packages may
// depend on which, and the product's glossary. Each package's architecture
// profile is its package.json binding, and its actual dependencies are
// derivable; neither is repeated here.
//
// Title: the group directory's name, e.g. `reviewer2`.
// Summary: what the product is, in one sentence.
//
// Cross-section rules enforced by product-group.refine.ts:
//   - Packages.Package values are unique.
//   - Every Packages.May depend on entry names another row's Package.
//   - Glossary.Term values are unique.
-->

# <!-- TEMPLATE-ONLY: string; regex `^[a-z0-9][a-z0-9-]*$`; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Packages

<!-- TEMPLATE-ONLY: guide
// Every package in the group.
// Role: app (a UI), service (a backend or worker), database (schema,
// policies and functions), contract (types and schemas shared across a
// boundary), toolkit (a reusable library or CLI), e2e (the end-to-end
// package).
// May depend on: the group's packages this one may depend on, by name,
// comma-separated, or `none`. The package-allow-list rule reads it.
-->

| Package | Role | May depend on |
| ------- | ---- | ------------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Package: string; regex `^(@[a-z0-9_-]+/)?[a-z0-9._-]+$`; required
Role: enum: app | service | database | contract | toolkit | e2e; required
May depend on: string; regex `^(none|(@[a-z0-9_-]+/)?[a-z0-9._-]+(, (@[a-z0-9_-]+/)?[a-z0-9._-]+)*)$`; required
-->

| @scope/web | app | @scope/contracts |

## 2. Glossary

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Product terms whose meaning a newcomer would get wrong, and terms that are
// easily confused. The domain model's objects are defined there, not here.
// Not to be confused with: optional; a nearby term and how it differs.
-->

| Term | Meaning | Not to be confused with |
| ---- | ------- | ----------------------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Term: string; required
Meaning: string; required
Not to be confused with: string; optional
-->

| Loan | A tool lent to a member for a fixed period. | Reservation: a claim on a future loan. |
