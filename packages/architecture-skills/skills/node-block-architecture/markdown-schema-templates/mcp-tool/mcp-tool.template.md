<!-- TEMPLATE-ONLY: guide
// One authored doc per MCP tool, in the `tools/` folder of the package that
// defines the tool, bound by the `.mcp-tool.md` suffix (node-block-architecture
// `entry-mcp.md`: one tool calls one use case or flow). The doc holds what the
// tool's schemas and TSDoc cannot: the contract in prose, limits, and failure
// answers. Derivable facts (the schemas themselves) stay in code.
//
// Title: the registered MCP tool name verbatim (snake_case, e.g.
// `find_declaration`). Summary: one sentence stating what the tool returns
// and for what caller.
//
// Cross-section rules enforced by mcp-tool.refine.ts:
//   - the title equals Identity.Tool;
//   - Identity.Handler lives in Identity.Server's package (the part before
//     `:` or `#`);
//   - a `(none)` input row is never required.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Identity

<!-- TEMPLATE-ONLY: guide
// Tool: the name registered with `server.registerTool(...)`, snake_case.
// Server: the name (`package.json#name`) of the package that defines the
// tool. Handler: the symbol citation of the function that implements the
// tool, in backticks: `<package>#<Symbol>` when the package entry exports it,
// else the library citation `<package>:<lib-id>#<Symbol>` (the citations skill).
// Category: an optional grouping
// label matching the registry's category column (e.g. `discovery`).
// Access: `read-only` (default) for a tool that changes nothing, which is
// what its `readOnlyHint` annotation says; `mutating` otherwise.
-->

- Tool: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9_]*$` -->
- Server: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+$` -->
- Handler: <!-- TEMPLATE-ONLY: string; required; regex `^@[a-z0-9_-]+/[a-z0-9_.-]+(:[a-z0-9-]+(/[a-z0-9-]+)*)?#[a-zA-Z_$][\w$]*$` -->
- Category: <!-- TEMPLATE-ONLY: string; default= -->
- Access: <!-- TEMPLATE-ONLY: string; regex `^(read-only|mutating)$`; default=read-only -->

## 2. Input

<!-- TEMPLATE-ONLY: guide
// One row per field of the tool's input schema. Mirror the schema exactly:
// name, TS type, whether it is required (an `.optional()` field is `no`). A
// no-argument tool still needs one row: use a single `(none)` param with
// type `—` and required `no`.
-->

| param | type | required | description |
| ----- | ---- | -------- | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
param: string; required; regex `^([a-zA-Z_][a-zA-Z0-9_]*|\(none\))$`
type: string; required
required: enum: yes | no
description: string; required
-->

| package | string | yes | The package name to query. |

<!-- TEMPLATE-ONLY: guide
// Describe the result shape, which is also the output schema's contract.
// Prefer citing a `<package>#<Type>` when the handler returns a named type;
// otherwise give the literal TS shape in a fenced block. State what an
// empty / "nothing found" result looks like (e.g. `[]`), since callers
// branch on it.
-->

## 3. Output

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// What the tool computes or resolves, and against what data (manifest, file
// system, graph); which use case or flow it calls. Note any disambiguation rules, ordering, or limits. Keep
// it to observable behaviour — implementation detail belongs in the code.
-->

## 4. Behaviour

<!-- TEMPLATE-ONLY: freetext; required -->

## 5. Errors

<!-- TEMPLATE-ONLY: guide
// One row per failure or empty-result condition the caller must handle:
// the trigger and what the tool returns (an error object, an empty array,
// etc.). Omit the section only when the tool cannot fail or return empty.
-->

<!-- TEMPLATE-ONLY: section; optional -->

| condition | result |
| --------- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
condition: string; required
result: string; required
-->

| package not found | empty result |

<!-- TEMPLATE-ONLY: guide
// A minimal call + response. Show the input arguments as a fenced ```json
// block and the returned value as another. Use a realistic package/symbol.
-->

## 6. Example

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Irreducible prose: edge cases, relationship to sibling tools, gotchas
// (e.g. resolves only exported declarations, so `_shared/` symbols are
// invisible).
-->

## 7. Notes

<!-- TEMPLATE-ONLY: freetext; required -->
