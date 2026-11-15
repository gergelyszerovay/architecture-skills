# Profile: tiny-architecture

> A two-layer example: pure rules below, a service above that may use them.

## 1. Identity

- Version: 0.1.0
- Constitution: small-architecture.constitution.md
- Classifier: file-suffix

## 2. Layers

| Layer   | Allowed packages | Decision |
| ------- | ---------------- | -------- |
| service | \*               | D1       |
| domain  | none             | D2       |

## 4. Blocks

| Block       | Layer   | Required tags | Spec kinds          | May depend on  | Decision |
| ----------- | ------- | ------------- | ------------------- | -------------- | -------- |
| .service.ts | service | failure       | scenario, edge-case | rules, service | D1       |
| .rules.ts   | domain  | none          | invariant           | rules          | D2       |

## 5. Structural rules

| Rule             | Parameters             | Enforced by        | Decision |
| ---------------- | ---------------------- | ------------------ | -------- |
| acyclic          | include-type-only=true | architecture-check | D3       |
| block-allow-list | none                   | architecture-check | D1, D2   |

## 6. Coverage rules

| Rule            | Applies to | Parameters     | Enforced by | Decision |
| --------------- | ---------- | -------------- | ----------- | -------- |
| export-has-spec | .rules.ts  | kind=invariant | planned     | D2       |

## 7. Spec kinds

| Kind      | Structure          | Runners | Decision |
| --------- | ------------------ | ------- | -------- |
| scenario  | aaa                | vitest  | D1       |
| edge-case | aaa                | vitest  | D1       |
| invariant | statement-examples | vitest  | D2       |

## 8. Levels

| Level | Doc template | Decision |
| ----- | ------------ | -------- |
| lib   | none         | D1       |
