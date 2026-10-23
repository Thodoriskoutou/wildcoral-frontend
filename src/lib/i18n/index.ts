import { formatLocales, type Locale } from './config';
import { translate, type Params } from './format';
import { localizePath, stripLocale } from './path';
import { pick, type Localized } from './localized';
import { getLocale } from './runtime';
import { el } from './el';

export { locales, defaultLocale, localeNames, localeShort, medusaLocales, formatLocales, isLocale, type Locale } from './config';
export { localeInPath, stripLocale, localizePath } from './path';
export { pick, type Localized } from './localized';
export { getLocale, provideServerLocale } from './runtime';

const dictionaries: Partial<Record<Locale, Record<string, string>>> = { el };

/** A piece of text in the visitor's language. See format.ts for the message syntax. */
export function t(message: string, params?: Params): string {
	const locale = getLocale();
	return translate(dictionaries[locale], formatLocales[locale], message, params);
}

/**
 * Marks English text for translation without translating it yet. Use it for texts kept in a table
 * that is created when the module loads (before any visitor's language is known), and translate at
 * the place where the text is shown: `const LABELS = { a: msg('Alpha') }` … `{t(LABELS.a)}`.
 * It returns its argument; `pnpm run check:i18n` reads `msg('…')` like `t('…')`.
 */
export function msg<T extends string>(text: T): T {
	return text;
}

/** The locale used to format dates, numbers and prices on the current page, e.g. `el-GR`. */
export function formatLocale(): string {
	return formatLocales[getLocale()];
}

/** A link to a page of this site, in the visitor's language: `l('/shop')` → `/el/shop` in Greek. */
export function l<T extends string | null | undefined>(href: T): T {
	return localizePath(href, getLocale());
}

/** The path of the current page without its language prefix (for "is this the home page?" checks). */
export function pathOf(pathname: string): string {
	return stripLocale(pathname);
}

/** A settings text (see Localized) in the visitor's language. */
export function localized(value: Localized | null | undefined): string {
	return pick(value, getLocale());
}

export function formatDate(value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
	if (value === null || value === undefined || value === '') return '';
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString(formatLocales[getLocale()], options ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat(formatLocales[getLocale()], { style: 'currency', currency }).format(amount);
}
