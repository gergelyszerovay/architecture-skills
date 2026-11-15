import type { Logger } from 'pino';

/**
 * Transport context: identity and request data only, never repositories or use cases.
 * `log` is the request-scoped logger (already bound to `requestId`); without it nothing is logged.
 */
export type TrpcContext = { user?: { id: string }; requestId?: string; log?: Logger };
