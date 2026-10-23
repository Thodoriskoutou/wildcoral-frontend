/**
 * Turns a message into the visitor's language. Messages are written in English and the English
 * text is also the key: `t('Add to bag')`. The Greek version is looked up under that same text
 * (see el.ts), and a message without a translation simply shows its English text.
 *
 *   t('Hello {name}', { name })                      {name} is replaced by the value
 *   t('{count} item|{count} items', { count: 3 })    "one|other" forms, picked by `count`
 *   t('Order::verb')                                 "Context::" tells translators which meaning
 *                                                    is meant; it is never shown
 *
 * Plain string handling only, so it can run (and be tested) anywhere.
 */

export type Params = Record<string, string | number | null | undefined>;

const CONTEXT = /^[^:|{}]*::/;

/** The English text of a message: the message without its optional "Context::" prefix. */
export function sourceText(message: string): string {
	return message.replace(CONTEXT, '');
}

function pickForm(text: string, count: number, formatLocale: string): string {
	const forms = text.split('|');
	if (forms.length < 2) return text;

	// "one" is the first form; every other plural category (Greek and English have just one more) the last.
	return new Intl.PluralRules(formatLocale).select(count) === 'one' ? forms[0] : forms[forms.length - 1];
}

export function translate(
	dictionary: Record<string, string> | undefined,
	formatLocale: string,
	message: string,
	params?: Params
): string {
	let text = dictionary?.[message] ?? sourceText(message);

	if (typeof params?.count === 'number') text = pickForm(text, params.count, formatLocale);
	if (!params) return text;

	return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name] ?? '') : whole));
}
