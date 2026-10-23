import { defineEnvVars } from '@sveltejs/kit/env'
import * as v from 'valibot'

/** Empty, null and zero all deliberately disable the corresponding in-process cache. */
const cacheTtl = (name: string) => (value: string | undefined): number => {
	const normalized = value?.trim()
	if (!normalized || normalized === '0' || normalized.toLowerCase() === 'null') return 0
	if (!/^[1-9]\d*$/.test(normalized)) throw new Error(`${name} must be a non-negative integer number of seconds`)
	return Number(normalized)
}

/**
 * SvelteKit 3 replaced `$env/*` with explicit environment variables. Every var the
 * app reads must be declared here. Private vars are imported from `$app/env/private`
 * and `public: true` vars from `$app/env/public` — there is no `PUBLIC_` prefix.
 *
 * Values still come from `.env` (or the host's environment) by name. Anything not
 * marked `v.optional(...)` fails validation at boot when missing, which is what you
 * want for the two Medusa vars — the app cannot do anything useful without them.
 */
export const variables = defineEnvVars({
	/** Your Medusa server, e.g. http://localhost:9000 */
	MEDUSA_BACKEND_URL: { schema: v.string() },
	/** Publishable API key from the Medusa admin (Settings → Publishable API keys). */
	MEDUSA_PUBLISHABLE_KEY: { schema: v.string() },
	/** Optional: pin a region instead of resolving one per visitor. */
	MEDUSA_DEFAULT_REGION_ID: { schema: v.optional(v.string()) },
	/** Optional: two-letter country code used to pick the default region. */
	MEDUSA_DEFAULT_COUNTRY_CODE: { schema: v.optional(v.string()) },

	/** Public journal data cache lifetime in seconds; unset or 0 disables it. */
	JOURNAL_CACHE_TTL_SECONDS: { schema: cacheTtl('JOURNAL_CACHE_TTL_SECONDS') },
	/** Public catalog data cache lifetime in seconds; unset or 0 disables it. */
	PRODUCT_CACHE_TTL_SECONDS: { schema: cacheTtl('PRODUCT_CACHE_TTL_SECONDS') },
	/** Bearer token accepted by the two cache-purge webhook endpoints. */
	CACHE_PURGE_TOKEN: { schema: v.optional(v.string(), '') },

	/** Stripe publishable key (pk_...). Leave unset until you wire up payments. */
	STRIPE_KEY: { public: true, schema: v.optional(v.string(), '') },

	/** Guest order tracking code and verified-session lifetime, in seconds. */
	GUEST_ORDER_TRACKING_OTP_TTL_SECONDS: {
		schema: (value: string | undefined) => {
			const normalized = value?.trim() || '600'
			if (!/^[1-9]\d*$/.test(normalized)) throw new Error('GUEST_ORDER_TRACKING_OTP_TTL_SECONDS must be a positive integer number of seconds')
			return Number(normalized)
		}
	},

	/** Shown in <title>, Open Graph tags, and JSON-LD. */
	SITE_NAME: { public: true, schema: v.optional(v.string(), 'My Store') },
	SITE_URL: { public: true, schema: v.optional(v.string(), 'http://localhost:5173') }
})
