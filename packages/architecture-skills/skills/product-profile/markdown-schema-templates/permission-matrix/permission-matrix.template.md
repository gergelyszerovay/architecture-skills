<!-- TEMPLATE-ONLY: guide
// One per product with more than one role (product-profile constitution
// D6): every role, and for every object action, what each role may do and
// where that is enforced. One row per cell, so per-role authorization tests
// can iterate over it.
//
// Title: the product's name.
// Summary: the access model, in one sentence.
//
// Cross-section rules enforced by permission-matrix.refine.ts:
//   - Roles.Role values are unique.
//   - Permissions.Role names a row of Roles.
//   - Object + Action + Role is unique.
//   - Every Object + Action pair has a row for every role.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Roles

<!-- TEMPLATE-ONLY: guide
// Every role, including the visitor without a session.
// How assigned: where the role comes from.
-->

| Role | Meaning | How assigned |
| ---- | ------- | ------------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Role: string; regex `^[a-z][a-z0-9-]*$`; required
Meaning: string; required
How assigned: string; required
-->

| anonymous | A visitor without a session. | Default before sign-in. |

## 2. Permissions

<!-- TEMPLATE-ONLY: guide
// One row per object, action and role.
// Object: a domain-model object. Action: a verb users use ("borrow").
// Access: allow, own (only on records the role's user owns), or deny.
// Enforced by: the package whose check is authoritative, e.g. the database
// for row-level policies; client checks only shape the UI.
-->

| Object | Action | Role | Access | Enforced by |
| ------ | ------ | ---- | ------ | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Object: string; required
Action: string; required
Role: string; required
Access: enum: allow | own | deny; required
Enforced by: string; required
-->

| Tool | view | anonymous | allow | @scope/db |
