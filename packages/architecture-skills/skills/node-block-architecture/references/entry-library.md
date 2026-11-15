# Entry points: libraries and SDKs

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## Libraries and SDKs

A library has no driving adapter: its public exports are the primary ports. Export use
cases (or a facade object grouping them), input and result contracts, domain errors, and
secondary port interfaces the consumer may implement. Composition happens in a
`create<Name>({ ...adapters, ...options })` factory, often with default driven adapters
(`createClient({ fetch = globalThis.fetch })`), so consumers can swap infrastructure
without touching internals. The `exports` field is the boundary: never export adapters'
private types, mappers, or schemas. Framework integrations (`<name>-nestjs`,
`<name>-react`) are separate packages or subpath exports that depend on the core
package.

Build with tsdown (ESM plus declarations) and check the package with publint; see
[setup.md](setup.md#building). Declare explicit types on every export; with
`isolatedDeclarations` on, the compiler enforces this and tsdown generates declarations
without `tsc`.
