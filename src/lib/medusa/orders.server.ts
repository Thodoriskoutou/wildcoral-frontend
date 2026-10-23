import { getMedusaContext } from 'sveltekit-medusa-sdk/server';
import type { RawOrder } from './order-tracking';

/**
 * Reads the signed-in customer's orders from Medusa's `GET /store/orders`, which only ever returns
 * that customer's own orders. Shared by the order-tracking and review server functions.
 *
 * The SDK's own `getOrders()` asks Medusa for its default fields, which leave out the line items and
 * the payment / fulfillment status. (Medusa's single-order endpoint is public by id and hides
 * `metadata`, which is why it isn't used.)
 *
 * Medusa's Store API silently drops any requested field it doesn't allow, so a missing field shows up
 * as missing data, not an error. What it *does* reject (400) is a query parameter it doesn't know;
 * each call therefore falls back to a simpler request on a 400 rather than failing the page.
 */

const FIELDS = [
	'+email',
	'+payment_status',
	'+fulfillment_status',
	'+item_subtotal',
	'+shipping_total',
	'+discount_total',
	'+tax_total',
	'*items',
	'*shipping_address',
	'*shipping_methods',
	'*fulfillments',
	// Medusa doesn't allow this one on the Store API today (it is dropped silently); kept so tracking
	// labels appear by themselves if a future version, or a customised backend, exposes them.
	'*fulfillments.labels'
].join(',');

export type MedusaCtx = ReturnType<typeof getMedusaContext>;

/** The customer's orders, or just the one with this `id` (undefined result = not theirs / not found). */
export async function fetchOrders(ctx: MedusaCtx, id?: string): Promise<RawOrder[]> {
	const list = async (params: Record<string, unknown>) =>
		(await ctx.client.store.order.list(params, ctx.headers())).orders as unknown as RawOrder[];

	const attempts: { params: Record<string, unknown>; onlyId: boolean }[] = [
		...(id ? [{ params: { limit: 1, fields: FIELDS, id }, onlyId: false }] : []),
		{ params: { limit: 50, fields: FIELDS }, onlyId: !!id },
		{ params: { limit: 50 }, onlyId: !!id }
	];

	let last: unknown;
	for (const { params, onlyId } of attempts) {
		try {
			const orders = await list(params);
			return onlyId ? orders.filter((o) => o.id === id) : orders;
		} catch (e) {
			last = e;
			if ((e as { status?: number })?.status !== 400) throw e;
		}
	}
	throw last;
}
