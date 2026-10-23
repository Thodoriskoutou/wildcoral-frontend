import { defaultLocale, type Locale } from './config';

/** A text that is either the same in every language or written once per language. */
export type Localized = string | Partial<Record<Locale, string>>;

/** The text in `locale`, else in the default language, else the first one written; '' when there is none. */
export function pick(value: Localized | null | undefined, locale: Locale): string {
	if (!value) return '';
	if (typeof value === 'string') return value;
	return value[locale] || value[defaultLocale] || Object.values(value).find(Boolean) || '';
}
