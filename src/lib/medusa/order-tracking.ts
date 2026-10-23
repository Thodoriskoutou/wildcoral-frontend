import { t, formatDate } from '#lib/i18n/index.js'
/**
 * Turns a Medusa order into the plain shape the account pages draw: a status, a five-step
 * progress line, the items, the delivery address and any tracking numbers.
 *
 * Medusa keeps three separate statuses on an order, and none of them alone answers "where is my
 * parcel?", so they are combined here:
 *   - `status`             pending | completed | canceled | archived | requires_action
 *   - `payment_status`     not_paid | awaiting | authorized | captured | refunded | canceled …
 *   - `fulfillment_status` not_fulfilled | fulfilled | shipped | delivered | partially_* | canceled
 *
 * Everything here is pure (no Medusa calls, no SvelteKit imports), so the server functions, the
 * pages and the dev preview all share it.
 */

type Row = Record<string, unknown>;

/** The bits of a Medusa order this file reads. Every field is optional: the list endpoint returns fewer. */
export interface RawOrder {
	id: string;
	display_id?: number | string | null;
	created_at?: string | Date | null;
	email?: string | null;
	status?: string | null;
	payment_status?: string | null;
	fulfillment_status?: string | null;
	currency_code?: string | null;
	total?: number | null;
	subtotal?: number | null;
	item_subtotal?: number | null;
	shipping_total?: number | null;
	discount_total?: number | null;
	tax_total?: number | null;
	metadata?: Row | null;
	items?: unknown[] | null;
	shipping_address?: unknown;
	shipping_methods?: unknown[] | null;
	fulfillments?: unknown[] | null;
}

export type OrderPhase = 'processing' | 'shipped' | 'delivered' | 'canceled';

export interface OrderStep {
	label: string;
	done: boolean;
	/** The step in progress right now: the first unfinished one, or the last once all are done (none when canceled). */
	current: boolean;
	/** Extra line under the step, e.g. the shipping date. */
	detail?: string;
}

export interface OrderItemView {
	id: string;
	/** The Medusa product this line was bought from (what reviews attach to). */
	productId: string | null;
	title: string;
	variant: string | null;
	quantity: number;
	unitPrice: number | null;
	total: number | null;
	thumbnail: string | null;
	href: string;
}

export interface ParcelView {
	carrier: string | null;
	trackingNumber: string | null;
	trackingUrl: string | null;
	shippedAt: string | null;
	deliveredAt: string | null;
}

export interface OrderView {
	id: string;
	/** What customers quote to support: "#1042". */
	number: string;
	createdAt: string;
	email: string | null;
	currency: string;
	phase: OrderPhase;
	/** One friendly line: "Being prepared", "On its way", "Delivered", … */
	statusLabel: string;
	steps: OrderStep[];
	totals: { total: number | null; subtotal: number | null; shipping: number | null; discount: number | null; tax: number | null };
	items: OrderItemView[];
	itemCount: number;
	shippingMethod: string | null;
	/** Delivery address as printed lines (name, street, city …). Empty when Medusa didn't send it. */
	address: string[];
	parcels: ParcelView[];
	giftMessage: string | null;
	ecoPackaging: boolean;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const iso = (v: unknown): string | null => {
	if (!v) return null;
	const d = new Date(v as string);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const PAID = new Set(['authorized', 'captured', 'partially_captured', 'partially_refunded', 'refunded', 'completed']);
const PREPARED = new Set(['fulfilled', 'partially_fulfilled', 'shipped', 'partially_shipped', 'delivered', 'partially_delivered']);
const SHIPPED = new Set(['shipped', 'partially_shipped', 'delivered', 'partially_delivered']);

function phaseOf(o: RawOrder): OrderPhase {
	const f = o.fulfillment_status ?? '';
	if (o.status === 'canceled' || f === 'canceled' || o.payment_status === 'canceled') return 'canceled';
	if (f === 'delivered') return 'delivered';
	if (SHIPPED.has(f)) return 'shipped';
	return 'processing';
}

function labelOf(o: RawOrder, phase: OrderPhase): string {
	const f = o.fulfillment_status ?? '';
	if (phase === 'canceled') return t('Canceled');
	if (phase === 'delivered') return t('Delivered');
	if (f === 'partially_delivered') return t('Partly delivered');
	if (f === 'partially_shipped') return t('Partly shipped');
	if (phase === 'shipped') return t('On its way');
	if (o.payment_status && !PAID.has(o.payment_status)) return t('Awaiting payment');
	if (PREPARED.has(f)) return t('Packed, leaving soon');
	return t('Being prepared');
}

const dayFmt = (d: string | null) =>
	d ? formatDate(d) : undefined;

function stepsOf(o: RawOrder, phase: OrderPhase, parcels: ParcelView[]): OrderStep[] {
	if (phase === 'canceled') return [];
	const f = o.fulfillment_status ?? '';
	// No payment status (an older list response) means the order exists, so payment went through.
	const paid = o.payment_status ? PAID.has(o.payment_status) : true;
	const prepared = PREPARED.has(f);
	const shipped = SHIPPED.has(f);
	const delivered = f === 'delivered';

	const flags = [true, paid, prepared, shipped, delivered];
	// "Current" is what is happening right now: the first step not finished yet (or the last one, once all are).
	const firstOpen = flags.indexOf(false);
	const current = firstOpen === -1 ? flags.length - 1 : firstOpen;
	const shippedAt = parcels.map((p) => p.shippedAt).find(Boolean) ?? null;
	const deliveredAt = parcels.map((p) => p.deliveredAt).find(Boolean) ?? null;

	const labels = [t('Order placed'), t('Payment confirmed'), t('Being prepared'), t('Shipped'), t('Delivered')];
	const details = [dayFmt(iso(o.created_at)), undefined, undefined, dayFmt(shippedAt), dayFmt(deliveredAt)];
	return labels.map((label, i) => ({ label, done: flags[i], current: i === current, detail: flags[i] ? details[i] : undefined }));
}

function itemsOf(o: RawOrder): OrderItemView[] {
	return (o.items ?? []).map((raw) => {
		const i = raw as Row;
		const handle = str(i.product_handle);
		return {
			id: String(i.id),
			productId: str(i.product_id),
			title: str(i.product_title) ?? str(i.title) ?? t('Item'),
			variant: str(i.variant_title),
			quantity: num(i.quantity) ?? 1,
			unitPrice: num(i.unit_price),
			total: num(i.total) ?? num(i.subtotal),
			thumbnail: str(i.thumbnail),
			href: handle ? `/product/${handle}` : '/shop'
		};
	});
}

/**
 * Where the tracking numbers come from:
 *   1. The labels on a fulfillment (what "Create shipment" in Medusa's admin stores), if the Store API
 *      hands them over. Medusa doesn't expose them today, so this normally finds nothing.
 *   2. The order's metadata: `tracking_number`, plus optional `tracking_url` and `carrier`. The store
 *      owner types these into the order's Metadata box in the admin; they're what the page shows.
 * With neither, a shipped order still shows its ship / delivery dates.
 */
function parcelsOf(o: RawOrder): ParcelView[] {
	const meta = (o.metadata ?? {}) as Row;
	const carrier = str(meta.carrier);
	const fulfillments = (o.fulfillments ?? []) as Row[];
	const firstDate = (key: 'shipped_at' | 'delivered_at') => fulfillments.map((f) => iso(f[key])).find(Boolean) ?? null;

	const out: ParcelView[] = [];
	for (const f of fulfillments) {
		const labels = Array.isArray(f.labels) ? (f.labels as Row[]) : [];
		for (const l of labels) {
			if (!str(l.tracking_number)) continue;
			out.push({ carrier, trackingNumber: str(l.tracking_number), trackingUrl: str(l.tracking_url), shippedAt: iso(f.shipped_at), deliveredAt: iso(f.delivered_at) });
		}
	}
	if (out.length) return out;

	const shippedAt = firstDate('shipped_at');
	const deliveredAt = firstDate('delivered_at');
	const trackingNumber = str(meta.tracking_number);
	if (trackingNumber || shippedAt || deliveredAt) {
		out.push({ carrier, trackingNumber, trackingUrl: str(meta.tracking_url), shippedAt, deliveredAt });
	}
	return out;
}

function addressOf(o: RawOrder): string[] {
	const a = o.shipping_address as Row | null | undefined;
	if (!a) return [];
	const name = [str(a.first_name), str(a.last_name)].filter(Boolean).join(' ');
	const cityLine = [str(a.postal_code), str(a.city), str(a.province)].filter(Boolean).join(' ');
	const country = str(a.country_code)?.toUpperCase();
	return [name, str(a.company), str(a.address_1), str(a.address_2), [cityLine, country].filter(Boolean).join(', ')].filter(
		(l): l is string => !!l
	);
}

export function toOrderView(o: RawOrder): OrderView {
	const phase = phaseOf(o);
	const parcels = parcelsOf(o);
	const items = itemsOf(o);
	const meta = (o.metadata ?? {}) as Row;
	const method = (o.shipping_methods?.[0] as Row | undefined)?.name;
	return {
		id: o.id,
		number: `#${o.display_id ?? o.id}`,
		createdAt: iso(o.created_at) ?? new Date(0).toISOString(),
		email: str(o.email),
		currency: (str(o.currency_code) ?? 'eur').toUpperCase(),
		phase,
		statusLabel: labelOf(o, phase),
		steps: stepsOf(o, phase, parcels),
		totals: {
			total: num(o.total),
			subtotal: num(o.item_subtotal) ?? num(o.subtotal),
			shipping: num(o.shipping_total),
			discount: num(o.discount_total),
			tax: num(o.tax_total)
		},
		items,
		itemCount: items.reduce((n, i) => n + i.quantity, 0),
		shippingMethod: str(method),
		address: addressOf(o),
		parcels,
		giftMessage: str(meta.gift_message),
		ecoPackaging: meta.eco_packaging === true || meta.eco_packaging === 'true'
	};
}
