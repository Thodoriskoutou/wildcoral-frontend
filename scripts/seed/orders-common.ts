/**
 * Placing, shipping and delivering orders the way the storefront and staff do, shared by the seed
 * tools that need orders (demo-orders.ts, customers.ts). Orders are placed through the Store API
 * (cart → shipping → manual payment → complete); shipping and delivery need an admin login.
 */
import type Medusa from '@medusajs/js-sdk';
import { say, envValue } from './common.ts';

export const PROVIDER = 'pp_system_default';

export type Address = { first_name: string; last_name: string; address_1: string; city: string; postal_code: string; phone: string };

export type Variant = { id: string; label: string };

export async function pickRegionAndVariants(store: Medusa) {
	const { regions } = await store.store.region.list({ fields: '*countries,*payment_providers' });
	if (!regions.length) throw new Error('The store has no regions. Create one in Settings → Regions first.');
	const wanted = (envValue('MEDUSA_DEFAULT_COUNTRY_CODE') || 'GR').toLowerCase();
	const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === wanted)) ?? regions[0];
	const country = region.countries?.find((c) => c.iso_2 === wanted)?.iso_2 ?? region.countries?.[0]?.iso_2;
	if (!country) throw new Error(`Region "${region.name}" has no countries.`);
	if (region.payment_providers && !region.payment_providers.some((p) => p.id === PROVIDER)) {
		throw new Error(`Region "${region.name}" doesn't offer the manual payment provider (${PROVIDER}). Enable it in Settings → Regions → ${region.name} → Payment providers.`);
	}

	const { products } = await store.store.product.list({ region_id: region.id, limit: 50, fields: '+variants.inventory_quantity' });
	const perProduct = products.map((p) =>
		(p.variants ?? [])
			.filter((v) => v.manage_inventory === false || v.allow_backorder || (v.inventory_quantity ?? 0) >= 2)
			.map((v) => ({ id: v.id, label: `${p.title} (${v.title})` }))
	);
	// One variant per product first, so the orders show different things; then any spare ones.
	const picks: Variant[] = [...perProduct.map((v) => v[0]).filter(Boolean), ...perProduct.flatMap((v) => v.slice(1))];
	if (!picks.length) throw new Error('No product variant can be bought right now (nothing in stock). Set stock on some variants first.');
	say(`Region "${region.name}" (${country.toUpperCase()}), ${picks.length} purchasable variant${picks.length > 1 ? 's' : ''}\n`);
	return { region, country, picks };
}

/** Places an order for the customer `store` is signed in as; `metadata` marks it as seed data. */
export async function placeOrder(
	store: Medusa,
	region: { id: string },
	country: string,
	variantIds: string[],
	opts: { email: string; address: Address; metadata: Record<string, string> }
) {
	const address = { ...opts.address, country_code: country };
	const { cart: created } = await store.store.cart.create({ region_id: region.id, email: opts.email, metadata: opts.metadata });
	for (const variant_id of variantIds) await store.store.cart.createLineItem(created.id, { variant_id, quantity: 1 });
	await store.store.cart.update(created.id, { email: opts.email, shipping_address: address, billing_address: address });

	const { shipping_options } = await store.store.fulfillment.listCartOptions({ cart_id: created.id });
	const option = shipping_options?.[0];
	if (!option) throw new Error('No shipping option is available for this cart. Add one in Settings → Locations & Shipping.');
	await store.store.cart.addShippingMethod(created.id, { option_id: option.id });

	const { cart } = await store.store.cart.retrieve(created.id);
	await store.store.payment.initiatePaymentSession(cart, { provider_id: PROVIDER });
	const result = await store.store.cart.complete(created.id);
	if (result.type !== 'order') throw new Error(`The cart didn't complete: ${result.error?.message ?? 'unknown reason'}`);
	return result.order;
}

/**
 * Ships an order with a tracking number and, when `deliver` is set, marks it delivered. `metadata`
 * is kept on the order next to the tracking details (the site reads tracking from it, because
 * Medusa's Store API doesn't expose shipment labels).
 */
export async function ship(
	admin: Medusa,
	orderId: string,
	displayId: number | string | undefined,
	deliver: boolean,
	opts: { trackingPrefix: string; carrier: string; metadata: Record<string, string> }
) {
	const trackingNumber = `${opts.trackingPrefix}-${displayId ?? orderId.slice(-6)}`;
	const trackingUrl = `https://example.com/track/${trackingNumber}`;

	const { order } = await admin.admin.order.retrieve(orderId, { fields: '*items' });
	const items = (order.items ?? []).map((i) => ({ id: i.id, quantity: i.quantity }));
	const { stock_locations } = await admin.admin.stockLocation.list({ limit: 1 });

	await admin.admin.order.createFulfillment(orderId, { items, location_id: stock_locations[0]?.id, no_notification: true });
	const { order: withFulfillment } = await admin.admin.order.retrieve(orderId, { fields: '*fulfillments' });
	const fulfillment = withFulfillment.fulfillments?.at(-1);
	if (!fulfillment) throw new Error('The fulfillment was created but could not be found again.');

	await admin.admin.order.createShipment(orderId, fulfillment.id, {
		items,
		labels: [{ tracking_number: trackingNumber, tracking_url: trackingUrl, label_url: trackingUrl }],
		no_notification: true
	});
	await admin.admin.order.update(orderId, { metadata: { ...opts.metadata, tracking_number: trackingNumber, tracking_url: trackingUrl, carrier: opts.carrier } });
	if (deliver) await admin.admin.order.markAsDelivered(orderId, fulfillment.id, { no_notification: true });
}
