import type { MedusaContext } from 'sveltekit-medusa-sdk'
import type { Locale } from '#lib/i18n/index.js'

declare global {
	namespace App {
		interface Locals {
			medusa: MedusaContext
			/** The language of this request (see src/hooks.server.ts). */
			locale: Locale
		/** The one guest order this storefront process authenticated for the current request. */
			guestOrderId: string | null
		}
	}
}

export {}
