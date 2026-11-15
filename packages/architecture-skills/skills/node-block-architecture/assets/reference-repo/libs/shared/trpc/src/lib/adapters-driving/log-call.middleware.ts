import { trpc } from './trpc.middleware.ts';

/** Logs each call's outcome once; expected failures at info, unexpected ones at error with the cause. */
export const logCall = trpc.middleware(async ({ ctx, path, type, next }) => {
  const started = performance.now();
  const result = await next();
  const ms = Math.round(performance.now() - started);
  if (result.ok) ctx.log?.info({ path, type, outcome: 'ok', ms }, 'trpc call');
  else if (result.error.code === 'INTERNAL_SERVER_ERROR')
    ctx.log?.error({ path, type, err: result.error.cause ?? result.error, ms }, 'trpc call failed');
  else ctx.log?.info({ path, type, outcome: result.error.code, ms }, 'trpc call');
  return result;
});
