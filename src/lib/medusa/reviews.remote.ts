import { msg } from '#lib/i18n/index.js'
import { query, command } from '$app/server';
import * as v from 'valibot';
import { getCustomer } from 'sveltekit-medusa-sdk/customer';
import { getMedusaContext } from 'sveltekit-medusa-sdk/server';
import { fetchOrders } from './orders.server';
import { storeFetch } from './store-fetch.server';
import { toOrderView } from './order-tracking';
import {
	toReviewStats,
	toReviewView,
	type ReviewableItem,
	type ReviewStats,
	type ReviewView
} from './reviews';

/**
 * Product reviews from the `@lambdacurry/medusa-product-reviews` plugin.
 *
 * (The SDK's own `getReviews` / `createReview` call `/store/reviews/:productId`, a different plugin's
 * routes, so they don't work with this one.)
 *
 * The plugin ties a review to an order line item, so only someone who bought a product can review it.
 * Its create route doesn't check who is asking, so `submitReview` checks here that the order really
 * belongs to the signed-in customer before anything is sent to Medusa.
 */

type Row = Record<string, unknown>;
const ORDERS_THAT_CAN_BE_REVIEWED = new Set(['shipped', 'delivered']);
/** Statuses to ask for when looking up the customer's own review, pending ones included. */
const ALL_STATUSES = ['pending', 'approved', 'flagged'];

const SORTS = { newest: '-created_at', highest: '-rating', lowest: 'rating' } as const;

/** Approved reviews of a product (the plugin only lists approved ones unless asked otherwise). */
export const getProductReviews = query(
	v.object({
		productId: v.pipe(v.string(), v.nonEmpty()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(50)), 5),
		sort: v.optional(v.picklist(['newest', 'highest', 'lowest']), 'newest'),
		rating: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(5)))
	}),
	async ({ productId, limit, sort, rating }): Promise<{ reviews: ReviewView[]; count: number }> => {
		const ctx = getMedusaContext();
		const res = await storeFetch<{ product_reviews?: unknown[]; count?: number }>(ctx, '/store/product-reviews', {
			query: { product_id: productId, limit, offset: 0, order: SORTS[sort], ...(rating ? { rating } : {}) }
		});
		const reviews = (res.product_reviews ?? []).map(toReviewView);
		return { reviews, count: res.count ?? reviews.length };
	}
);

/** Average rating and per-star counts for a product; `null` until it has an approved review. */
export const getProductReviewStats = query(
	v.object({ productId: v.pipe(v.string(), v.nonEmpty()) }),
	async ({ productId }): Promise<ReviewStats | null> => {
		const ctx = getMedusaContext();
		const res = await storeFetch<{ product_review_stats?: unknown[] }>(ctx, '/store/product-review-stats', {
			query: { product_id: productId }
		});
		return toReviewStats(res.product_review_stats?.[0]);
	}
);

/**
 * What the signed-in customer can review on this product: each item from an order of theirs that has
 * shipped, with their existing review of it if they already wrote one. Empty when signed out or when
 * they haven't bought (and received) the product.
 */
export const getReviewableItems = query(
	v.object({ productId: v.pipe(v.string(), v.nonEmpty()) }),
	async ({ productId }): Promise<{ signedIn: boolean; items: ReviewableItem[] }> => {
		const ctx = getMedusaContext();
		// Signed-out visitors (most of them) stop here without a call to Medusa: the SDK answers null when there is no session cookie.
		if (!(await getCustomer().catch(() => null))) return { signedIn: false, items: [] };
		let orders;
		try {
			orders = await fetchOrders(ctx);
		} catch (e) {
			if ((e as { status?: number })?.status === 401) return { signedIn: false, items: [] };
			throw e;
		}

		const candidates = orders
			.map((raw) => ({ raw, view: toOrderView(raw) }))
			.filter(({ view }) => ORDERS_THAT_CAN_BE_REVIEWED.has(view.phase))
			.flatMap(({ view }) =>
				view.items.filter((i) => i.productId === productId).map((item) => ({ view, item }))
			);

		const items = await Promise.all(
			candidates.map(async ({ view, item }): Promise<ReviewableItem> => {
				// One lookup per order: the listing can't say which line item a review belongs to, but it can be
				// narrowed to one order and one product, and an order rarely holds the same product twice.
				const res = await storeFetch<{ product_reviews?: Row[] }>(ctx, '/store/product-reviews', {
					query: { order_id: view.id, product_id: productId, status: ALL_STATUSES, limit: 1 }
				}).catch(() => ({ product_reviews: [] as Row[] }));
				const mine = res.product_reviews?.[0];
				return {
					orderId: view.id,
					orderNumber: view.number,
					itemId: item.id,
					title: item.title,
					variant: item.variant,
					existing: mine
						? { rating: Number(mine.rating) || 5, content: String(mine.content ?? ''), status: String(mine.status ?? 'approved') }
						: null
				};
			})
		);
		return { signedIn: true, items };
	}
);

export type SubmitReviewResult =
	/** `status` is what the plugin gave the review: "approved" (live) or "pending" (waiting for the shop). */
	| { ok: true; status: string }
	| { ok: false; code: 'signed_out' | 'not_allowed' | 'error' };

/** Writes (or, for an item already reviewed, edits) the signed-in customer's review of something they bought. */
export const submitReview = command(
	v.object({
		productId: v.pipe(v.string(), v.nonEmpty()),
		orderId: v.pipe(v.string(), v.nonEmpty()),
		itemId: v.pipe(v.string(), v.nonEmpty()),
		rating: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
		content: v.pipe(v.string(), v.trim(), v.minLength(10, msg('Please write at least a sentence.')), v.maxLength(2000))
	}),
	async ({ productId, orderId, itemId, rating, content }): Promise<SubmitReviewResult> => {
		const ctx = getMedusaContext();

		let order;
		try {
			order = (await fetchOrders(ctx, orderId)).find((o) => o.id === orderId);
		} catch (e) {
			if ((e as { status?: number })?.status === 401) return { ok: false, code: 'signed_out' };
			throw e;
		}
		// Not this customer's order, not shipped yet, or not an item of this product: refuse.
		const view = order ? toOrderView(order) : null;
		const item = view?.items.find((i) => i.id === itemId);
		if (!view || !item || item.productId !== productId || !ORDERS_THAT_CAN_BE_REVIEWED.has(view.phase)) {
			return { ok: false, code: 'not_allowed' };
		}

		try {
			const res = await storeFetch<{ product_reviews?: Row[] }>(ctx, '/store/product-reviews', {
				method: 'POST',
				body: { reviews: [{ order_id: orderId, order_line_item_id: itemId, rating, content, images: [] }] }
			});
			return { ok: true, status: String(res.product_reviews?.[0]?.status ?? 'approved') };
		} catch {
			return { ok: false, code: 'error' };
		}
	}
);
