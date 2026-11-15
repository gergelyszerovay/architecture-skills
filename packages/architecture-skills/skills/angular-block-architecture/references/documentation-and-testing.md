# Documentation and testing

How an Angular package documents itself and specifies its behaviour (constitution
[D26](../angular-block-architecture.constitution.md#D26)–D41). The conventions shared with the other architectures (where each fact lives,
levels, behaviour tags, spec kinds, slugs, phase metadata, skeletons, fast-forward) are in
the architecture-docs-and-specs skill; read it first. This reference adds what is specific
to Angular. The checkable parts are in [angular-block-architecture.architecture-profile.md](../angular-block-architecture.architecture-profile.md).

## Docs

| Level   | Authored                                                                    | Template      |
| ------- | --------------------------------------------------------------------------- | ------------- |
| Package | boundaries, provider scopes and why, rule exceptions, package decisions     | `angular-app` |
| Lib     | role, boundaries, state ownership that no TSDoc tag declares, lib decisions | `angular-lib` |

Derivable facts include inputs and outputs, VM shapes, provider scopes and the route map;
they are generated, not written. The templates ship with this skill in
`markdown-schema-templates/`. A lib-private block (a facade, store or VM that no exported
declaration encloses) is cited as `<package>:<lib>#/<Name>`.

## Behaviour tags

The profile lists the required tags per block; `@lifetime` and `@concurrency` have fixed
value sets. For example:

```ts
/**
 * Requests a file's content unless it is cached or already in flight.
 * @concurrency dedupe-by-key — one request per path at a time.
 * @failure A failed request is logged; the next open retries it.
 */
```

## Specs: where each kind belongs

- **Facades** are the main scenario level: store state in, VM out; command in, effects out;
  lower blocks faked.
- **UI blocks** get scenarios for interaction behaviour: initial state, keyboard handling.
- **Stores, commands, resources, flows, realtime and connector blocks** get failure-path
  edge cases, including their concurrency policy.
- **Rules, policies and formats** get invariants.
- **Pages, containers and routes** have no specs of their own; composition tests and
  journeys cover them.

For the Angular CLI and Vitest setup (tag definitions, the test target, types), read
[testing-setup.md](testing-setup.md).

## Visual and interaction intent

What a part of the UI shows and does, and why, lives in its region document (the
product-profile skill, "Regions"), not in the components:

- Every block that implements part of a region (a `.ui.ts`, a `.page.ts`, a facade, a
  rules file) carries `@region <place>/<region>` in its TSDoc, declared in the package's
  `tsdoc.json`. Its TSDoc keeps only what is local to the code.
- A part of a component's template that is the region carries `data-region="<region>"`.
  Extract a component instead when the part is worth one for its own sake; the region and
  its rules don't change.
- A rule with logic behind it (an order, a limit, a state transition) lives in a facade or
  a `.rules.ts` and gets a spec that cites the rule. Styling (a fixed size, truncation, an
  overlay that must not reflow) gets no unit spec: the plan checks it by eye, with
  screenshots in its implementation notes.

## Checks

Besides the shared checks: the profile's dependency rules, judged by architecture-check
(`reviewer2-check --rule dependencies`, and `--rule facades` for `max-facades-per-component`;
[enforcement.md](enforcement.md)).
