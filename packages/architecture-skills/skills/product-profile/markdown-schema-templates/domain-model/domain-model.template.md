<!-- TEMPLATE-ONLY: guide
// One per product, in the group's layered-docs tree (product-profile
// constitution D5): the objects users think in, how they relate, and their
// core attributes, in the words users use. Code, UI and tests name things
// after it. Actions on objects and who may perform them are in the
// permission matrix.
//
// Title: the product's name.
// Summary: the model's scope, in one sentence.
//
// Cross-section rules enforced by domain-model.refine.ts:
//   - Objects.Object values are unique.
//   - Relationships.From and To name rows of Objects.
//   - Attributes.Object names a row of Objects; Object + Attribute is unique.
//   - Objects.Meaning is set unless Modeled by is set.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Objects

<!-- TEMPLATE-ONLY: guide
// Object: singular, capitalized as users write it.
// Meaning: what the object is, in the words users use. Optional when Modeled
// by is set and the declaration's TSDoc summary already says it; write it
// only when the users' words differ (one home per fact).
// Identified by: what makes one instance distinct, in user terms.
// Owner: the package that holds the object's authoritative records.
// Modeled by: optional; a symbol citation (the citations skill) of the declaration that models the
// object in code, e.g. `@scope/contracts#Tool`. Empty while the object is
// planned: whether it is built is derived from this link (constitution D27).
-->

| Object | Meaning | Identified by | Owner | Modeled by |
| ------ | ------- | ------------- | ----- | ---------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Object: string; key; required
Meaning: string; optional
Identified by: string; required
Owner: string; required
Modeled by: string; regex `^([@a-z0-9][a-z0-9/._-]*(:[a-z0-9][a-z0-9/._-]*)?#/?[A-Za-z_$][A-Za-z0-9_$./]*)?$`; optional
-->

| Tool | A physical tool contributed to the shelf. | Its label number | @scope/db | `@scope/contracts#Tool` |

## 2. Relationships

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Relationship: a verb phrase read from From to To ("borrows", "holds").
-->

| From | Relationship | To  | Cardinality |
| ---- | ------------ | --- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
From: string; required
Relationship: string; required
To: string; required
Cardinality: enum: one-to-one | one-to-many | many-to-one | many-to-many; required
-->

| Member | contributes | Tool | one-to-many |

## 3. Attributes

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Attributes users see or decide on; not every column.
// Kind: core (users recognise the object by it), metadata (supports it), or
// derived (computed from other attributes).
// Notes: optional; for derived attributes, what they derive from.
-->

| Object | Attribute | Kind | Notes |
| ------ | --------- | ---- | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Object: string; required
Attribute: string; required
Kind: enum: core | metadata | derived; required
Notes: string; optional
-->

| Tool | Name | core | |
