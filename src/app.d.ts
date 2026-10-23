import type { MedusaContext } from 'sveltekit-medusa-sdk'
import type { Locale } from '$lib/i18n'

declare global {
	namespace App {
		interface Locals {
			medusa: MedusaContext
			/** The language of this request (see src/hooks.server.ts). */
			locale: Locale
		}
	}
}

export {}
