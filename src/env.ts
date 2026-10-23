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
	/** Absolute URL Stripe redirects back to after payment — must be your /checkout/return route. */
	STRIPE_REDIRECT_URL: { public: true, schema: v.optional(v.string(), 'http://localhost:5173/checkout/return') },

	/**
	 * Contact form (/contact). Messages are emailed through Resend (resend.com): create an API key there and
	 * set these. Without RESEND_API_KEY the page shows your contact details but no form.
	 */
	RESEND_API_KEY: { schema: v.optional(v.string(), '') },
	/** Where messages arrive. Defaults to `contactEmail` in src/lib/site.ts. */
	CONTACT_TO_EMAIL: { schema: v.optional(v.string(), '') },
	/** The sender shown on the notification, e.g. "Wild Coral <shop@yourdomain.gr>" (a domain verified in Resend). */
	CONTACT_FROM_EMAIL: { schema: v.optional(v.string(), '') },
	/** Resend's API address. Only change it for a proxy or testing. */
	RESEND_API_URL: { schema: v.optional(v.string(), 'https://api.resend.com/emails') },

	/** Shown in <title>, Open Graph tags, and JSON-LD. */
	SITE_NAME: { public: true, schema: v.optional(v.string(), 'My Store') },
	SITE_URL: { public: true, schema: v.optional(v.string(), 'http://localhost:5173') }
})
