import { command, query } from '$app/server';
import * as v from 'valibot';
import { getCustomer } from 'sveltekit-medusa-sdk';
import { getMedusaContext } from 'sveltekit-medusa-sdk/server';
import { storeFetch } from './store-fetch.server';

/**
 * The signed-in customer's wishlist, from the `@rsc-labs/medusa-wishlist` plugin.
 *
 * Its routes (all under the customer's own account, so a signed-in session is required):
 *   GET    /store/customers/me/wishlist                                 → { wishlist: { items: [...] } }
 *   POST   /store/customers/me/wishlist/items   { productId, productVariantId, quantity }
 *   DELETE /store/customers/me/wishlist/items?productId=…&productVariantId=…
 *
 * The site saves whole products ("save for later"), but the plugin wants a variant id for every item.
 * Rather than guess a variant, the value stored is a key made of the customer and the product:
 *
 *     wl:<customer id>:<product id>
 *
 * That is deliberate. In version 0.0.6 of the plugin, adding an item looks for an existing item with
 * the same `productVariantId` across ALL customers' wishlists (not only the current customer's), so with
 * a real variant id a second customer saving the same piece would silently change the first customer's
 * item and get nothing saved themselves. A key that includes the customer can never collide. The real
 * product id is stored in `productId`, which is what everything else reads.
 */

type Ctx = ReturnType<typeof getMedusaContext>;
type Row = Record<string, unknown>;

export type WishlistSnapshot = { signedIn: boolean; productIds: string[] };

const SIGNED_OUT: WishlistSnapshot = { signedIn: false, productIds: [] };

/** The signed-in customer's id, or null. The SDK answers null without calling Medusa when there is no session cookie. */
async function customerId(): Promise<string | null> {
	const customer = await getCustomer().catch(() => null);
	return customer?.id ?? null;
}

const productIdOf = (item: Row) => String(item.productId ?? item.product_id ?? '');

async function readItems(ctx: Ctx): Promise<Row[]> {
	const res = await storeFetch<{ wishlist?: { items?: Row[] } | null }>(ctx, '/store/customers/me/wishlist');
	return res.wishlist?.items ?? [];
}

const snapshot = (items: Row[]): WishlistSnapshot => ({
	signedIn: true,
	productIds: [...new Set(items.map(productIdOf).filter(Boolean))]
});

async function readSnapshot(): Promise<WishlistSnapshot> {
	const ctx = getMedusaContext();
	if (!(await customerId())) return SIGNED_OUT;
	return snapshot(await readItems(ctx));
}

/** Which products the customer has saved, for use while a page is rendered (e.g. the account page). */
export const getSavedProductIds = query(readSnapshot);

/**
 * The same, as a command for the browser to call at any time (hearts, after signing in, after a change).
 * Commands can't run while a page is being rendered, hence the two versions.
 * `signedIn: false` (and no ids) when nobody is signed in.
 */
export const loadWishlist = command(readSnapshot);

/** Saves (`saved: true`) or removes (`saved: false`) a product, and returns the updated list of saved products. */
export const setWishlisted = command(
	v.object({ productId: v.pipe(v.string(), v.nonEmpty()), saved: v.boolean() }),
	async ({ productId, saved }): Promise<WishlistSnapshot> => {
		const ctx = getMedusaContext();
		const id = await customerId();
		if (!id) return SIGNED_OUT;

		const items = await readItems(ctx);
		const existing = items.find((i) => productIdOf(i) === productId);

		if (saved && !existing) {
			await storeFetch(ctx, '/store/customers/me/wishlist/items', {
				method: 'POST',
				body: { productId, productVariantId: `wl:${id}:${productId}`, quantity: 1 }
			});
		} else if (!saved && existing) {
			await storeFetch(ctx, '/store/customers/me/wishlist/items', {
				method: 'DELETE',
				// Use the stored key, so items saved some other way (with a real variant id) can be removed too.
				query: { productId, productVariantId: String(existing.productVariantId ?? existing.product_variant_id ?? '') }
			});
		} else {
			return snapshot(items);
		}
		// Read the list back rather than trusting the write's response shape.
		return snapshot(await readItems(ctx));
	}
);
