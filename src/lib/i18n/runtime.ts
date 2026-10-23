import { browser } from '$app/env';
import { defaultLocale, type Locale } from './config';
import { localeInPath } from './path';

/**
 * Which language the current page is in.
 *
 * In the browser it is the language prefix of the address. On the server it is the language of
 * the request being answered: hooks.server.ts registers a function that reads it from the
 * request, which keeps working after `await`s and inside remote functions (SvelteKit tracks the
 * current request for us), so nothing has to be passed down from component to component.
 */

let serverLocale: (() => Locale | undefined) | null = null;

/** Called once by hooks.server.ts. */
export function provideServerLocale(read: () => Locale | undefined) {
	serverLocale = read;
}

export function getLocale(): Locale {
	if (browser) return localeInPath(location.pathname) ?? defaultLocale;

	return serverLocale?.() ?? defaultLocale;
}
