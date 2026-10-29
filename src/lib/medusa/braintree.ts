import type { StoreCart } from '@medusajs/types'

export function formatBraintreeAddress(type: 'shipping' | 'billing', cart: StoreCart | null | undefined) {
	if (!cart) return {}
	const shipping = cart.shipping_address
	const billing = cart.billing_address
	const address = type === 'shipping' ? shipping : billing
	return {
		firstName: address?.first_name || shipping?.first_name || '',
		lastName: address?.last_name || shipping?.last_name || '',
		streetAddress: address?.address_1 || shipping?.address_1 || '',
		extendedAddress: address?.address_2 || (type === 'shipping' ? '' : shipping?.address_2) || '',
		locality: address?.city || shipping?.city || '',
		region: address?.province || shipping?.province || '',
		postalCode: address?.postal_code || shipping?.postal_code || '',
		countryCodeAlpha2: (address?.country_code || shipping?.country_code)?.toUpperCase() || ''
	}
}
