# Entry points: MCP servers

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## MCP servers

MCP servers use three driving blocks: `.tool.ts` (actions), `.resource.ts` (readable
context addressed by URI), and `.prompt.ts` (reusable prompt templates). A `.server.ts`
block creates the server and registers a feature's blocks; `.main.ts` connects the
transport.

### Tools

- One tool calls one use case or flow. MCP tools are often coarser and more task-shaped
  than HTTP endpoints; a task-shaped tool usually calls a flow.
- Descriptions and error messages are part of the contract: say what the tool does, its
  limits, and what to change when a call fails.
- A declared output schema makes structured content a public contract. Derive it from
  an owned `.result.ts`, never from entities or SDK types.
- Annotations (read-only, destructive, idempotent, open-world) describe the use case's
  behavior but are transport metadata; set them in the tool block and keep them true.
- Log each tool call once, in a shared wrapper around the handler
  (`withToolLogging(log, 'dir_tree', handler)`), with the tool name, `ctx.mcpReq.id` as
  the call ID, the outcome (`ok`, `error` for `isError`, `input-required`), and the
  duration. The logger comes from composition through the `registerXTool` function. See
  the logging rules in [operations.md](operations.md).
- Document each tool in the `mcp-tool` template (one `<ordinal>.<tool-with-hyphens>.mcp-tool.md` per
  tool) and list the tools in an `mcp-tool-registry` index beside them; both live in
  `markdown-schema-templates/` and bind by name. Keep what the schemas already say out of the
  documents.
- Sandboxing and access policy that exist only because a model is the caller (for
  example restricting paths to a root folder) belong in the MCP adapter, not inside the
  hexagon. Client roots, when requested as input, feed that adapter policy.

### Resources and prompts

- A `.resource.ts` block parses the URI or template variables with a transport schema,
  calls one query use case, and maps the result to resource contents (text or blob with a
  MIME type). Listing and change notifications come from a query use case and an events
  port, not from adapter state.
- A `.prompt.ts` block validates arguments, optionally calls a query use case for
  context, and renders messages through a `.format.ts` block. Prompt wording is
  presentation; business data comes from use cases.

### User input and model calls: input-required results

Protocol revision 2026-07-28 replaces push-style server-to-client requests (sampling,
elicitation, roots) with multi-round-trip input: a tool returns an input-required result,
the client gathers the input, and retries the same call with the responses attached.
The SDK still serves 2025-era connections by translating the result into a push-style
request, so one handler works for both.

This keeps the hexagon simple: user interaction becomes part of the use-case contract,
not a port the use case awaits.

- The use case returns a result member that says what it needs
  (`{ kind: 'needs-confirmation', question }`) and accepts the answer in its input on
  the next call (`confirmed: true`). It never blocks waiting for a person and never
  mentions MCP.
- The tool maps that member to `inputRequired({ inputRequests: { ... } })` and, on
  retry, reads the answer with `acceptedContent(ctx.mcpReq.inputResponses, key, schema)`
  and calls the use case again. Validate the answer with a schema; it is client input.
- Other transports use the same contract: HTTP answers 409 or 428 with the question and
  the client resends with confirmation; a CLI prompts the user or requires `--yes`.
- Sampling: prefer a normal driven adapter that calls a model provider behind a port
  (`TextSummarizer`). Use `inputRequired.createMessage` only when the client's model
  must be the one used, mapped from a result member exactly like confirmation.
- `requestState` round-trips through the client and is attacker-controlled. Do not let
  it influence authorization or business logic unless it is integrity-protected (the
  SDK's request-state codec with a verify hook).

```ts
// libs/dir-browsing/src/lib/core/delete-files/delete-files.use-case.ts
export const makeDeleteFiles =
  ({ fs }: { fs: FileSystemPort }) =>
  async (
    input: DeleteFilesInput,
    ctx: { signal?: AbortSignal } = {},
  ): Promise<DeleteFilesResult> => {
    if (input.paths.length > 10 && !input.confirmed) {
      return { kind: 'needs-confirmation', question: `Delete ${input.paths.length} files?` };
    }
    for (const path of input.paths) {
      ctx.signal?.throwIfAborted();
      await fs.remove(path);
    }
    return { kind: 'deleted', count: input.paths.length };
  };

// libs/dir-browsing/src/lib/adapters-driving/register-delete-files.tool.ts (handler body)
const answer = acceptedContent(ctx.mcpReq.inputResponses, 'confirm', ConfirmSchema);
if (answer && !answer.confirm) return { content: text('Cancelled; nothing was deleted.') };
const result = await app.deleteFiles(
  { paths, confirmed: answer?.confirm === true },
  { signal: ctx.mcpReq.signal },
);
if (result.kind === 'needs-confirmation') {
  return inputRequired({
    inputRequests: {
      confirm: inputRequired.elicit({ message: result.question, requestedSchema: ConfirmSchema }),
    },
  });
}
return { content: text(`Deleted ${result.count} file(s).`) };
```

If the client cannot provide the input (a 2025-era client without the elicitation
capability), the SDK returns a tool error; the use case has done nothing, so this is
safe.

### Progress, cancellation, and logging

Pass `ctx.mcpReq.signal` and, for long work, a progress callback in the use case's call
context; the tool maps progress to MCP progress notifications when the client sent a
progress token. Logging notifications to the client are deprecated in protocol revision
2026-07-28; log to stderr (stdio) or through OpenTelemetry instead.

### Transports

- stdio: stdout carries the protocol. Log only to stderr. Never print from inside the
  hexagon.
- Streamable HTTP: compose once per process; create a server per session or run
  stateless. Authentication is transport middleware; copy the authenticated identity
  into the use-case input. Session state belongs to the transport, not to use cases.
