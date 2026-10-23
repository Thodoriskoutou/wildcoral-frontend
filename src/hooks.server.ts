import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { getRequestEvent } from '$app/server';
import { building } from '$app/environment';
import { createMedusaHandle } from 'sveltekit-medusa-sdk/server';

import {
	MEDUSA_BACKEND_URL,
	MEDUSA_PUBLISHABLE_KEY,
	MEDUSA_DEFAULT_REGION_ID,
	MEDUSA_DEFAULT_COUNTRY_CODE
} from '$app/env/private';

import {
	defaultLocale,
	isLocale,
	localeInPath,
	localizePath,
	medusaLocales,
	provideServerLocale,
	stripLocale,
	type Locale
} from '#lib/i18n/index.js';

import { LOCALE_COOKIE } from '#lib/i18n/config.js';

/**
 * Configures the Medusa client once, per request. Everything else — cart, session,
 * region and country resolution — is handled by the SDK's remote functions, which
 * resolve the same context on their own.
 *
 * See the SDK docs for the full option list (cookie names, `transferCartOnLogin`,
 * affiliate tracking, analytics headers).
 */
const medusaHandle = createMedusaHandle({
	baseUrl: MEDUSA_BACKEND_URL,
	publishableKey: MEDUSA_PUBLISHABLE_KEY,
	defaultRegionId: MEDUSA_DEFAULT_REGION_ID || undefined,
	defaultCountryCode: MEDUSA_DEFAULT_COUNTRY_CODE || undefined
})

const ONE_YEAR = 60 * 60 * 24 * 365

/** The language of the request being answered; read by `t()` and friends (see src/lib/i18n/runtime.ts). */
const requestLocale = (): Locale | undefined => {
	try {
		return getRequestEvent().locals.locale
	} catch {
		return undefined // not inside a request (build time)
	}
}

provideServerLocale(requestLocale)

/** A language picked in a cookie or query string; anything else is ignored. */
const asLocale = (value: string | null | undefined): Locale | undefined => isLocale(value) ? value : undefined;

/**
 * Decides the language of every request, from the first source that has one:
 *
 *  1. `?lang=el` (the language switcher): remember it, then show the same page in that language.
 *  2. A language prefix in the address (`/el/shop`). The default language has no prefix; `/en/shop`
 *     is sent to `/shop` so a page has one address.
 *  3. For data calls the page makes (remote functions, `__data.json`): the page they come from, found
 *     in the `Referer`, because their own address carries no language.
 *  4. Otherwise the default language, except that a visitor who chose another language before is
 *     taken to that language's address when they open a page without a prefix.
 */
const localeHandle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;
	const remembered = asLocale(event.cookies.get(LOCALE_COOKIE));

	const remember = (locale: Locale) => event.cookies.set(LOCALE_COOKIE, locale, {
		path: '/',
		maxAge: ONE_YEAR,
		sameSite: 'lax',
		httpOnly: false,
		secure: url.protocol === 'https:'
	});

	const isPageRequest = request.method === 'GET' && !event.isRemoteRequest && !event.isDataRequest && !url.pathname.startsWith('/_app/');

	// During prerendering SvelteKit intentionally forbids url.search/searchParams.
	// Static routes do not need language-query redirects or cookie persistence.
	if (isPageRequest && !building) {
		const picked = asLocale(url.searchParams.get('lang'))
		if (picked) {
			remember(picked)
			const next = new URL(url)
			next.searchParams.delete('lang')
			redirect(303, localizePath(stripLocale(next.pathname), picked) + next.search + next.hash)
		}

		const prefixed = localeInPath(url.pathname)
		if (prefixed === defaultLocale) {
			// `/en/shop` → `/shop`
			redirect(308, stripLocale(url.pathname) + url.search)
		}
		if (!prefixed && remembered && remembered !== defaultLocale && request.headers.get('accept')?.includes('text/html')) {
			redirect(307, localizePath(url.pathname, remembered) + url.search)
		}
	}

	let locale: Locale = localeInPath(url.pathname) ?? defaultLocale

	if (!isPageRequest || event.isRemoteRequest || event.isDataRequest) {
		// The data call's own address has no language: use the one of the page it was made from.
		const referer = request.headers.get('referer')
		let fromPage: Locale | undefined
		if (referer) {
			try {
				const from = new URL(referer)
				if (from.origin === url.origin) fromPage = localeInPath(from.pathname) ?? defaultLocale
			} catch {
				// a Referer that is not a URL is simply ignored
			}
		}
		locale = fromPage ?? remembered ?? defaultLocale
	} else if (localeInPath(url.pathname)) {
		if (remembered !== locale) remember(locale)
	}

	event.locals.locale = locale

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	})
}

let medusaLocalePatched = false

/**
 * Makes the shared Medusa client answer in the visitor's language. The JS SDK sends an
 * `x-medusa-locale` header with every request when its `locale` is set, but it keeps one value for
 * the whole server; here it is looked up per request instead. Medusa then returns translated
 * product, category and collection texts (Admin → Settings → Translations).
 */
const medusaLocaleHandle: Handle = ({ event, resolve }) => {
	if (!medusaLocalePatched) {
		const client = (event.locals.medusa.client as unknown as { client: object }).client
		Object.defineProperty(client, 'locale', {
			configurable: true,
			get: () => medusaLocales[requestLocale() ?? defaultLocale]
		})
		medusaLocalePatched = true
	}

	return resolve(event)
}

/**
 * Dynamic HTML and remote/data responses must never be stored by a browser or an
 * intermediary. Public journal/catalog freshness is controlled exclusively by
 * the server-side TTL cache, whose keys include locale and pricing region.
 */
const cacheControlHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)
	if (
		event.isRemoteRequest ||
		event.isDataRequest ||
		response.headers.get('content-type')?.includes('text/html')
	) {
		response.headers.set('cache-control', 'private, no-store')
	}
	return response
}

export const handle = sequence(localeHandle, medusaHandle, medusaLocaleHandle, cacheControlHandle)
