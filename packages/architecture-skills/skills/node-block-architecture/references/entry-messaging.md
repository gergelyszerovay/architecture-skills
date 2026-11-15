# Entry points: consumers and jobs

Shared rules (outcome mapping, adding an entry point) are in
[entry-points.md](entry-points.md).

## Consumers

A `.consumer.ts` block handles one message type. It decodes the message with a
`.schema.ts` (an inbound message is driving-side, not a `.wire.ts`), calls one use case,
and maps the outcome to a disposition the broker binding in composition applies:

```ts
// libs/orders/src/lib/adapters-driving/payment-timeout.consumer.ts
/**
 * Expires an order when its payment times out.
 * @concurrency first-wins — the job may expire the same order; the store's conditional write decides.
 * @failure An invalid message is dead-lettered; an unexpected error is retried by the broker.
 */
export const makePaymentTimeoutConsumer =
  (app: { expireOrder: ExpireOrder }) =>
  async (message: unknown): Promise<Disposition> => {
    const parsed = PaymentTimeoutMessageSchema.safeParse(message);
    if (!parsed.success) return 'dead-letter';
    await app.expireOrder({ orderId: parsed.data.orderId }); // every result member is final
    return 'ack';
  };
```

- Acknowledge once the use case returns: its result members (`expired`,
  `already-expired`, `already-paid`) are final, and redelivering wouldn't change them. An
  unexpected error propagates, and the broker redelivers.
- A use case called from a consumer is idempotent or deduplicates by message key, because
  delivery is at least once.
- The broker SDK stays in composition or a shared transport helper; the consumer sees only
  the decoded message and returns a disposition.

## Jobs

A `.job.ts` block runs one use case or flow on a schedule. Its `@concurrency` tag names
the policy for a run that starts while the previous one is still running (constitution
[D21](../node-block-architecture.constitution.md#D21)): usually `reject-while-busy` (skip the run) or `serialize` (queue it). The scheduler
lives in composition; the job receives the use case and a `now` from a clock port or the
scheduler, never `Date.now()` inside the hexagon (D4).
