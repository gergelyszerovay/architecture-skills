# Profile: product-profile

> The checkable rules of a group's end-to-end package: page objects, seeds, fixtures and specs, the journey spec kinds, and the group-level documentation.

## 1. Identity

- Version: 0.2.1
- Constitution: product-profile.constitution.md
- Classifier: file-suffix

## 2. Layers

| Layer      | Allowed packages          | Decision |
| ---------- | ------------------------- | -------- |
| end-to-end | @playwright/test, node:\* | D9       |

## 4. Blocks

| Block           | Layer      | Required tags | Spec kinds                   | May depend on              | Decision |
| --------------- | ---------- | ------------- | ---------------------------- | -------------------------- | -------- |
| .page-object.ts | end-to-end | drives, place | none                         | page-object                | D15      |
| .seed.ts        | end-to-end | world         | none                         | seed                       | D17      |
| .fixture.ts     | end-to-end | none          | none                         | page-object, seed, fixture | D17      |
| .spec.ts        | end-to-end | none          | journey, scenario, edge-case | fixture, page-object, seed | D10, D16 |

## 5. Structural rules

| Rule                 | Parameters                                                             | Enforced by        | Decision      |
| -------------------- | ---------------------------------------------------------------------- | ------------------ | ------------- |
| acyclic              | include-type-only=true                                                 | architecture-check | D9            |
| block-allow-list     | include-type-only=true                                                 | architecture-check | D15, D16, D17 |
| layer-packages       | none                                                                   | architecture-check | D9            |
| block-placement      | page-object=page-objects; seed=seeds; fixture=fixtures; spec=specs     | checker            | D24           |
| tsdoc-tags           | none                                                                   | checker            | D15, D17      |
| no-symbol            | symbols=locator, getByRole, getByText, getByTestId, $, $$; blocks=spec | planned            | D16           |
| spec-structure       | none                                                                   | planned            | D10, D11, D12 |
| use-case-has-journey | registry=use-case-registry                                             | planned            | D8, D19, D26  |
| package-allow-list   | source=product-group                                                   | planned            | D3            |

## 7. Spec kinds

| Kind      | Structure | Runners    | Decision |
| --------- | --------- | ---------- | -------- |
| journey   | gwt-steps | playwright | D10, D12 |
| scenario  | gwt-steps | playwright | D10, D12 |
| edge-case | gwt-steps | playwright | D10, D12 |

## 8. Levels

| Level   | Doc template  | Decision |
| ------- | ------------- | -------- |
| group   | product-group | D1, D3   |
| package | none          | D23      |
| lib     | none          | D23      |
| block   | none          | D15, D17 |
