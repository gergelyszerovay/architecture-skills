import { z } from 'zod';

/** A TCP port: 0 lets the OS pick one, 65535 is the highest. */
const PortSchema = z.coerce.number().int().min(0).max(65535);

/** The resolved configuration for the shop HTTP server. */
export type ShopHttpConfig = { port: number };

/**
 * Reads PORT once; defaults to 3000.
 * @param env - The process environment to read from; defaults to `process.env`.
 * @returns The resolved shop HTTP configuration.
 */
export const loadShopHttpConfig = (env: NodeJS.ProcessEnv = process.env): ShopHttpConfig => ({
  port: PortSchema.parse(env.PORT ?? 3000),
});
