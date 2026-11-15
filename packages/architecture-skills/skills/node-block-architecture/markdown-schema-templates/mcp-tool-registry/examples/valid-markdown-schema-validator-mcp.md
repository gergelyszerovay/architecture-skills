# MCP tools

> Registry of every tool `@gergelyszerovay/markdown-schema-validator-mcp` registers: discovery, retrieval, and validation.

## Key Points

- Tool names are **snake_case** (`list_templates`); the registrar handler is camelCase.
- Three tools cover the lifecycle: `list_templates` (what exists), `get_template` (the raw text and examples), `validate_doc` (check a document).
- Each row has a sibling `5.<tool>.mcp-tool.md` spec; the per-tool doc is the contract.

## Contents

| Topic          | File                                                           | Summary                                                   |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| list_templates | [5.list-templates.mcp-tool.md](./5.list-templates.mcp-tool.md) | List available templates, optionally scoped.              |
| get_template   | [5.get-template.mcp-tool.md](./5.get-template.mcp-tool.md)     | Raw template markdown plus example files.                 |
| validate_doc   | [5.validate-doc.mcp-tool.md](./5.validate-doc.mcp-tool.md)     | Validate a document against a template, refines included. |

## Registry

| tool           | category   | input                                  | output                                                           | spec                                                           |
| -------------- | ---------- | -------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| list_templates | discovery  | `{ scope? }`                           | `{ name, scope, hasRefine, exampleCount }[]`                     | [5.list-templates.mcp-tool.md](./5.list-templates.mcp-tool.md) |
| get_template   | discovery  | `{ template, scope? }`                 | `{ name, scope, templateRaw, hasRefine, examples } \| { error }` | [5.get-template.mcp-tool.md](./5.get-template.mcp-tool.md)     |
| validate_doc   | validation | `{ template, raw, scope?, noRefine? }` | `{ ok: true, json } \| { ok: false, errors }`                    | [5.validate-doc.mcp-tool.md](./5.validate-doc.mcp-tool.md)     |

## Notes

Two categories: discovery and validation. `validate_doc` is the only tool that runs `*.refine.ts`.
