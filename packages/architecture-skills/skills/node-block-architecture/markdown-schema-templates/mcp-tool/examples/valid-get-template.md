# get_template

> Return the raw template markdown and every example file for a named template, so a client never needs file globs.

## 1. Identity

- Tool: get_template
- Server: @gergelyszerovay/markdown-schema-validator-mcp
- Handler: `@gergelyszerovay/markdown-schema-validator-mcp#registerGetTemplate`
- Category: discovery

## 2. Input

| param    | type   | required | description                                          |
| -------- | ------ | -------- | ---------------------------------------------------- |
| template | string | yes      | Template name (e.g. `concept`).                      |
| scope    | string | no       | App scope for resolution. Omit to search all scopes. |

## 3. Output

On success, a JSON object (in `content[0].text`):

```json
{
  "name": "concept",
  "scope": "global",
  "templateRaw": "# …",
  "hasRefine": true,
  "examples": [{ "path": "…/examples/x.md", "raw": "# …" }]
}
```

`templateRaw` is the verbatim `*.template.md` text; `examples` pairs each `examples/*.md` path with its content; `hasRefine` reports whether a `*.refine.ts` sibling exists. When the name does not resolve, the object is `{ "error": "Template \"<name>\" not found." }`.

## 4. Behaviour

Resolves the template set for `scope` via `@gergelyszerovay/markdown-schema-validator-mcp#resolveTemplates`, finds the record whose `name` matches, then reads `templatePath` and each `examplePaths` entry from disk. The browser consumer uses this as its single source for template text — no in-browser file access, no template globs.

## 5. Errors

| condition                               | result                                          |
| --------------------------------------- | ----------------------------------------------- |
| template name not in the resolved scope | `{ "error": "Template \"<name>\" not found." }` |

## 6. Example

```json
{ "template": "concept", "scope": "global" }
```

```json
{
  "name": "concept",
  "scope": "global",
  "templateRaw": "# <!-- TEMPLATE-ONLY: string; required -->\n…",
  "hasRefine": true,
  "examples": []
}
```

## 7. Notes

This tool reads files; `list_templates` does not. The `templateRaw` it returns is what the preview app renders and what `validate_doc` parses — they share one source. To validate a filled document against this template, pass the same `template`/`scope` to `validate_doc`.
