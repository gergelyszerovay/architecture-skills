---
name: product-profile
description: Write or review a product's group-level documentation (brief, domain model, permission matrix, information architecture, use-case registry, package roles, glossary) and its Playwright end-to-end tests (journeys, page objects, seeds). Use when describing a product of several packages, recording who may do what, listing places or use cases, or adding or reviewing an end-to-end test.
---

# Product profile

A product is a group of packages: a UI, services, a database, shared contracts, an
end-to-end package. Each package documents its own inside through its architecture skill
(Angular, Node, Supabase). This skill covers what belongs to the product as a whole: why
it exists, the words it uses, who may do what, where users go, what they want to achieve,
and the end-to-end journeys that prove it.

## Rules

[product-profile.constitution.md](product-profile.constitution.md) holds the rules, and it overrides anything else in
this skill: its **Documents** topic for the product documents, **Journeys** for the
end-to-end package, **Enforcement** for the checks. The references explain the decisions
and give examples; they don't restate them. [product-profile.architecture-profile.md](product-profile.architecture-profile.md) is the
machine-readable form of the end-to-end package's checkable rules.

## What to read

Find the group first: the directory holding the product's packages. Its documentation is
the group's `layered-docs/` tree; read its index and constitution if they exist.

| Task                                                                          | Read                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Which product documents to write, what each holds, planned versus built       | [documents.md](references/documents.md)                                                                |
| Fill or validate a document                                                   | the template (below), with the markdown-schema skill; place files with layered-documentation-authoring |
| The group constitution                                                        | the constitution skill's template, `Kind: product`                                                     |
| Journeys, scenarios, page objects, seeds, skeletons, Playwright configuration | [journeys.md](references/journeys.md)                                                                  |

Validate every document with `validate-md --template <path-to>/<template>.template.md <doc>.md`.
When done, report which cross-document checks are still `planned` in the profile and were
checked in review.

## Templates

| Template                   | Document                                                            | When                                 |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| `product-group`            | package roles, allowed dependencies between packages, glossary      | a group with more than one package   |
| `product-brief`            | problem, audiences, outcomes                                        | a product others need to understand  |
| `domain-model`             | objects, relationships, attributes                                  | a product with its own vocabulary    |
| `permission-matrix`        | roles, and every object action per role                             | more than one role                   |
| `information-architecture` | places, regions, navigation, modes, commands, wireframe links       | a product with a UI                  |
| `region`                   | a region's structure, states, interactions, rules, limits, messages | a region that needs more than a line |
| `use-case-registry`        | use cases, their journeys and extensions                            | a product with end-to-end tests      |

A group's documents bind to these templates by name and proximity (constitution D38);
nothing is installed beside them.

## Boundaries

- Architecture inside a package: the angular-block-architecture, node-block-architecture
  or Supabase skills.
- Constitutions: the constitution skill. Profiles: the architecture-profile skill.
- Roadmaps, priorities and delivery status: not documented here.
