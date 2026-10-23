import type { StoreOrder } from '@medusajs/types';

/**
 * A small summary of the order that was just placed, kept in sessionStorage so the `/success`
 * page can show it after the checkout redirects. Medusa doesn't let a guest fetch an order by id
 * from the storefront, and the completed order is only in hand at the moment of checkout, so we
 * carry the bits the confirmation page needs across the navigation. A page refresh keeps it;
 * closing the tab drops it.
 */

const KEY = 'last-order';

export interface OrderSummary {
	id: string;
	displayId: number | string | null;
	email: string | null;
	currency: string;
	total: number | null;
	shippingMethod: string | null;
	items: { title: string; variant: string | null; quantity: number; unitPrice: number | null }[];
}

export function rememberOrder(order: StoreOrder): void {
	const summary: OrderSummary = {
		id: order.id,
		displayId: order.display_id ?? null,
		email: order.email ?? null,
		currency: (order.currency_code ?? 'eur').toUpperCase(),
		total: typeof order.total === 'number' ? order.total : null,
		shippingMethod: order.shipping_methods?.[0]?.name ?? null,
		items: (order.items ?? []).map((i) => ({
			title: i.product_title ?? i.title,
			variant: i.variant_title ?? null,
			quantity: i.quantity,
			unitPrice: typeof i.unit_price === 'number' ? i.unit_price : null
		}))
	};
	try {
		sessionStorage.setItem(KEY, JSON.stringify(summary));
	} catch {
		// Private mode / storage blocked: the success page just shows the generic thank-you.
	}
}

export function recallOrder(): OrderSummary | null {
	try {
		const raw = sessionStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as OrderSummary) : null;
	} catch {
		return null;
	}
}
