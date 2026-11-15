<!-- TEMPLATE-ONLY: guide
// Specialized index for the `tools/` folder of the package that defines an
// MCP server's tools (node-block-architecture `entry-mcp.md`). Title:
// "MCP tools" (kept consistent across packages). Summary: one sentence
// stating that this is the registry of tools the package defines.
//
// Cross-section rules enforced by mcp-tool-registry.refine.ts: tool and spec
// values are unique, every spec is also a Contents row, and a spec is named
// `<ordinal>.<tool with _ as ->.mcp-tool.md`. The registry's `tool` column is
// the key, so a row can be cited as `<doc>#<tool>`.
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## Key Points

<!-- TEMPLATE-ONLY: guide
// 2-4 prose bullets. Each captures something a reader MUST know before
// drilling into per-tool docs (e.g. tool-name casing, what the tools query,
// which tools are gated by a server option).
-->

- First bullet placeholder.
- Second bullet placeholder.

## Contents

<!-- TEMPLATE-ONLY: guide
// Standard `## Contents` nav table: one row per per-tool spec sibling. The
// File cell is a Markdown link `[basename](path)` to the sibling spec; the
// extractor yields the URL. Use the SAME URL string here and in the Registry
// `spec` cell — the refine matches them by string equality.
-->

| Topic | File | Summary |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Topic: string; required; regex `^[A-Za-z][A-Za-z0-9 +/&_-]*$`
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Summary: string; required; regex `^[^\n]{5,160}$`
-->

| find_declaration | [5.find-declaration.mcp-tool.md](./5.find-declaration.mcp-tool.md) | Resolve a declaration name to manifest keys. |

## Registry

<!-- TEMPLATE-ONLY: guide
// One row per tool registered with `server.registerTool(...)`. The document
// check over the manifest cross-checks that:
//   - every row has a matching per-tool fill in this folder;
//   - every per-tool fill appears as a row;
//   - each `spec` file's Identity.Tool equals this row's `tool`.
// The `spec` cell is a Markdown link `[basename](path)`; the extractor
// yields the URL, which may carry a `./` or directory prefix. Use the SAME
// URL string as the matching §Contents `File` cell. `input` is a compact
// shape (the field list); `output` the result type or shape. `category`
// groups tools for navigation.
-->

| tool | category | input | output | spec |
| ---- | -------- | ----- | ------ | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
tool: string; key; regex `^[a-z][a-z0-9_]*$`
category: string; required; regex `^[a-z][a-z0-9-]*$`
input: string; required
output: string; required
spec: string; required; regex `^[A-Za-z0-9_./-]+\.mcp-tool\.md$`
-->

| find_declaration | declarations | `{ package, name, filePath? }` | `string[]` | [5.find-declaration.mcp-tool.md](./5.find-declaration.mcp-tool.md) |

## Cross-Domain

<!-- TEMPLATE-ONLY: section; optional -->

| Topic | File | Domains |
| ----- | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Topic: string; required
File: string; required; regex `^[A-Za-z0-9_./-]+\.md$`
Domains: string; required; regex `^[a-z][a-z0-9-]*(,\s*[a-z][a-z0-9-]*)*$`
-->

| Symbol references | [2.fractal-tree.spec.md](/layered-docs/1.architecture/2.fractal-tree.spec.md) | architecture |

<!-- TEMPLATE-ONLY: guide
// Optional commentary on the tool set as a whole — categories, option-gated
// tools, transport notes. Required section, but "None." is acceptable.
-->

## Notes

<!-- TEMPLATE-ONLY: freetext; required -->
