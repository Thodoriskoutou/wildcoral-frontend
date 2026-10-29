import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { localizePath } from '#lib/i18n/index.js'
import { toOrderView, type RawOrder } from '#lib/medusa/order-tracking.js'

const FIELDS = '+email,+payment_status,+fulfillment_status,+item_subtotal,+shipping_total,+discount_total,+tax_total,*items,*shipping_address,*shipping_methods,*fulfillments'

/** Signed-in customers keep using their existing account order history. */
export const load: PageServerLoad = async ({ locals }) => {
	try {
		await locals.medusa.client.store.customer.retrieve({}, locals.medusa.headers())
		redirect(303, `${localizePath('/account', locals.locale)}#orders`)
	} catch (error) {
		if ((error as { status?: number }).status !== 401) throw error
	}

	if (!locals.guestOrderId) return { order: null }
	try {
		const { order } = await locals.medusa.client.store.order.retrieve(locals.guestOrderId, { fields: FIELDS }, locals.medusa.headers())
		return { order: toOrderView(order as unknown as RawOrder) }
	} catch {
		// A restarted storefront loses its process-local session, while a deleted/invalid order must not render.
		return { order: null }
	}
}
