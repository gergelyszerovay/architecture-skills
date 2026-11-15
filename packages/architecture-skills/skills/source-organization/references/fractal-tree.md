# Fractal-tree layout

Use the repository's authoritative specification and installed validator. Private placement
follows dependency relationships; project configuration declares feature public surfaces.

Before edits, read applicable project rules and the actual tooling contract, such as the
repository's architecture docs and the validator's configuration.

A characteristic shape is:

```text
feature/
  price-order.ts
  price-order/
    private-helper.ts
  _shared/
    shared-helper.ts
```

Exact entry points, allowed imports, public declarations, and shared placement come from
project specs; the file/declaration policy is [declarations.md](declarations.md). A \_shared
directory does not automatically authorize arbitrary cross-library imports.

A file's responsibility and its dependency position are separate. No category of file
(domain, data access, UI, utilities) is exempt from placement. Apply the
[file/declaration policy](declarations.md) and authoritative placement rules, including
physical parent/child eligibility.

Use a compatible existing generator when restructuring calls for one. Do not assume it
understands framework metadata or non-TypeScript references, or that every edit requires
generation. Verify that path-based references (templates, styles, assets, dynamic imports,
DI or registration wiring), tests, aliases, and public declarations survive moves. Do not
invent flags or ignore directives to make placement pass.

Run the relevant structure validator. If a generator is used, verify its second pass is
stable. Separately check the project's other dependency rules. A structurally valid tree
does not prove architectural correctness.

When converting away, inventory public names first: root files/shared helpers can have
different visibility in the target layout. Preserve intended contracts explicitly.
