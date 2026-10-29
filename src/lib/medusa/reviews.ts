import { t } from '#lib/i18n/index.js'
/**
 * Product reviews, as the site draws them. Pure helpers (no Medusa calls, no SvelteKit imports) that
 * turn the responses of the `@lambdacurry/medusa-product-reviews` plugin into plain objects.
 *
 * That plugin is not the one the SDK's built-in review functions talk to, so the site has its own
 * (see reviews.remote.ts). Its routes: GET /store/product-reviews, GET /store/product-review-stats,
 * POST /store/product-reviews (a review belongs to an order line item, so only buyers can review).
 */

type Row = Record<string, unknown>;

export interface ReviewView {
	id: string;
	rating: number;
	content: string;
	/** "Maria P.": first name and the initial of the last, so full names aren't shown publicly. */
	author: string;
	createdAt: string;
	/** The shop's public reply, if it wrote one in the admin. */
	response: string | null;
	images: string[];
}

export interface ReviewStats {
	average: number;
	count: number;
	/** Number of reviews per star, index 0 = 1 star … index 4 = 5 stars. */
	distribution: [number, number, number, number, number];
}

/** An item the signed-in customer bought and may review. */
export interface ReviewableItem {
	orderId: string;
	orderNumber: string;
	itemId: string;
	title: string;
	variant: string | null;
	/** Their existing review of this item, when there is one (the form then edits it). */
	existing: { rating: number; content: string; status: string } | null;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function publicName(name: string | null): string {
	if (!name) return t('Customer');
	const [first, ...rest] = name.trim().split(/\s+/);
	const last = rest.at(-1);
	return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

export function toReviewView(raw: unknown): ReviewView {
	const r = raw as Row;
	const response = r.response as Row | null | undefined;
	const images = Array.isArray(r.images) ? (r.images as Row[]) : [];
	return {
		id: String(r.id),
		rating: Math.min(5, Math.max(1, num(r.rating) ?? 5)),
		content: str(r.content) ?? '',
		author: publicName(str(r.name)),
		createdAt: str(r.created_at) ?? new Date(0).toISOString(),
		response: str(response?.content),
		images: images.map((i) => str(i.url)).filter((u): u is string => !!u)
	};
}

export function toReviewStats(raw: unknown): ReviewStats | null {
	const r = raw as Row | null | undefined;
	if (!r) return null;
	const count = num(r.review_count) ?? 0;
	if (count <= 0) return null;
	const distribution = [1, 2, 3, 4, 5].map((n) => num(r[`rating_count_${n}`]) ?? 0) as ReviewStats['distribution'];
	return { average: num(r.average_rating) ?? 0, count, distribution };
}

/** "4.8" (one decimal, no trailing ".0" needed). */
export const formatAverage = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
