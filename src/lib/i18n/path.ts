import { defaultLocale, isLocale, type Locale } from './config';

/**
 * Language prefixes in addresses. The default language has none (`/shop`), every other language
 * has its code first (`/el/shop`). Everything here is plain string handling, so it works on the
 * server, in the browser and in the `reroute` hook alike.
 */

/** The language named by the first part of the path, or null when the path has no language prefix. */
export function localeInPath(pathname: string): Locale | null {
	const first = pathname.split('/')[1];
	return isLocale(first) ? first : null;
}

/** The path without its language prefix: `/el/shop` → `/shop`, `/el` → `/`. */
export function stripLocale(pathname: string): string {
	const locale = localeInPath(pathname);
	if (!locale) return pathname;
	return pathname.slice(locale.length + 1) || '/';
}

/** Not pages of the site: framework internals, build output and files (anything whose last part has an extension). */
const NOT_A_PAGE = /^\/(?:_app|src|node_modules|api)(?:[/?#]|$)|^\/(?:@|__)|\/[^/?#]*\.[A-Za-z0-9]+(?:[?#]|$)/;

/**
 * Puts the language prefix on a link to a page of this site. External links, `#anchors`, `mailto:`,
 * files and the like come back unchanged, and a link that already has a prefix is switched to
 * `locale`. Missing links (`undefined`, `null`) come back as they are.
 */
export function localizePath<T extends string | null | undefined>(href: T, locale: Locale): T {
	if (typeof href !== 'string') return href;
	if (!href.startsWith('/') || href.startsWith('//') || NOT_A_PAGE.test(href)) return href;
	return localizeInternal(href, locale) as T;
}

function localizeInternal(href: string, locale: Locale): string {
	const rest = stripLocale(href.split(/[?#]/)[0]);
	const suffix = href.slice(href.split(/[?#]/)[0].length);

	const prefix = locale === defaultLocale ? '' : `/${locale}`;
	return `${prefix}${rest === '/' && prefix ? '' : rest}${suffix}` || '/';
}
