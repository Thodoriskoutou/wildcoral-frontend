/**
 * The languages of the site. To change which one visitors get without a prefix in the address,
 * change `defaultLocale`; every other language lives under its own prefix (`/el/shop`).
 *
 * Medusa names its locales with a region (en-US, el-GR); the site's addresses use the short code.
 * `medusaLocales` maps one to the other and must match Settings → Store → Languages in the Admin.
 */
export const locales = ['en', 'el'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** How each language names itself (always in its own language, so a visitor can find theirs). */
export const localeNames: Record<Locale, string> = {
	en: 'English',
	el: 'Ελληνικά'
};

/** Short form for the language switch in the header. */
export const localeShort: Record<Locale, string> = {
	en: 'EN',
	el: 'ΕΛ'
};

/** The locale code Medusa uses for products, categories and collections. */
export const medusaLocales: Record<Locale, string> = {
	en: 'en-US',
	el: 'el-GR'
};

/** The locale used to format dates, numbers and prices. */
export const formatLocales: Record<Locale, string> = {
	en: 'en-GB',
	el: 'el-GR'
};

/** Remembers the visitor's choice for requests that carry no language in their address. */
export const LOCALE_COOKIE = 'locale';

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
