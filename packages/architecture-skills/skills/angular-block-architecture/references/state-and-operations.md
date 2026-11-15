# State ownership and asynchronous operations

## State contracts

Every authoritative value has one owner, and scope follows ownership (constitution [D15](../angular-block-architecture.constitution.md#D15),
[D16](../angular-block-architecture.constitution.md#D16)); the required TSDoc tags declare it (D17). For each meaningful stateful block, document ownership and behavior in existing code/docs
at the level its complexity warrants. Do not mechanically create a document per block.

- Authoritative values, derived views, drafts, caches, and persisted values.
- Public reads and intent-based commands; who may change each value.
- Provider owner and lifetime: application, route, component instance, or operation.
- Cleanup/reset triggers, including identity changes and route reuse where applicable.
- Failure behavior and relationships with other owners.

A facade owns presentation state only (D49): the selection, the expansion, the draft of its
interaction area. It copies no other owner's value into a signal of its own, and it starts
no read or subscription: a read that must follow a state change is a flow's, a store holds
what two components share. Choose the narrowest scope covering actual consumers. Multiple panes can have independent
component-scoped capability instances. Sharing does not automatically imply root scope.
Verify router reuse/provider behavior rather than assuming navigation destroys injectors.
Dispose work at its actual owner.

There are no mutable module-level singletons. Read-only signals do not make nested objects
immutable; protect published result objects too.

## Execution contracts

| Kind           | Behavior                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| Query/resource | May rerun from input changes when repetition is appropriate; owns identity and result state. |
| Command        | Runs explicitly, including writes, scans, materialization, and refresh; reports an outcome.  |
| Subscription   | Receives external changes within a declared lifetime; maps events or requests invalidation.  |

A long-lived subscription (D40; a live document, a presence feed, a manifest being watched)
derives its identity from owned state and its lifetime from its provider scope, like a
resource that reruns when its input changes. Commands change that state; they never
subscribe or unsubscribe. Provide the realtime or connector block at the scope that owns
the subscription (for example the place's `.providers.ts` block, D51) and release it on that scope's
destruction. A stream that belongs to one explicitly triggered operation, such as a scan's
progress, is owned by the command running the operation instead.

HTTP method or backend naming does not determine the block. Expensive source materialization
may return data but still requires an explicit command.

Where overlap is possible, pick one of D18's policies and declare it in the block's
`@concurrency` tag. One pending boolean can't represent several independent requests.

## Result publication

Combined results need a publication contract (D19). For a multi-operation load, specify inputs and generation/request identity, candidate
results, commit preconditions, publication boundary, failure visibility, and cleanup/retry.

Cancellation does not prove freshness. Reject stale completions even after requesting
abort. Cache identity includes every input affecting validity; live results may require
an observation or generation identity.

For a code workspace, selection owns drafts and an analysis flow owns the applied source
pair. Package results identify their applied generation. Tree/source facades derive views
from that owner. Search selects declarations through the navigation capability.

Atomic publication means atomic client visibility, not a distributed transaction.
Previously completed external side effects require their own recovery/cleanup contract.

Connectors adapt browser history, identity, or filesystem events into explicit commands.
Do not copy state between owners through a network of effects. Distinguish inbound URL
restoration from outbound updates to avoid loops. Persist stable identities rather than
process-local handles, and define when restored inputs become applied.
