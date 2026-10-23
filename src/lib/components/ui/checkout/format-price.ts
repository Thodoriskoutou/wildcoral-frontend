import { formatLocale } from '$lib/i18n'
export function formatPrice(amount: number | null | undefined, currencyCode: string | null | undefined, locale = formatLocale()): string {
	if (amount == null || !currencyCode) return ''
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currencyCode.toUpperCase()
	}).format(amount)
}
