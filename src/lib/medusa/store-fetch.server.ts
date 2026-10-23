import type { MedusaCtx } from './orders.server';

/**
 * Calls a Store API route that the SDK has no method for (routes added by Medusa plugins), signed in as
 * the current visitor: the session is replayed the same way the SDK's own functions do it.
 */
export function storeFetch<T>(
	ctx: MedusaCtx,
	path: string,
	init: { method?: 'GET' | 'POST' | 'DELETE'; query?: Record<string, unknown>; body?: Record<string, unknown> } = {}
): Promise<T> {
	return ctx.client.client.fetch<T>(path, { ...init, headers: ctx.headers() } as never);
}
