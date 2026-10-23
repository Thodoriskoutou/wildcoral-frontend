export type Safe<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Runs a Medusa fetch and turns a failure into a value instead of a thrown error.
 *
 * `<svelte:boundary>`'s `failed` snippet is not rendered during server rendering, so an error
 * thrown while awaiting inside a component would turn the whole page into a 500. Returning the
 * message lets each page render its own "unavailable" state (and keeps the header/footer up).
 */
export async function safe<T>(fn: () => Promise<T>): Promise<Safe<T>> {
	try {
		return { data: await fn(), error: null };
	} catch (e) {
		const err = e as { body?: { message?: string }; message?: string };
		return { data: null, error: err?.body?.message ?? err?.message ?? 'Request failed' };
	}
}
