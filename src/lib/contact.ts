import { msg } from '#lib/i18n/index.js'
/** What a visitor can say their message is about (the key travels in the URL as ?topic=… and in the form). */
export const TOPICS = {
	sizing: msg('Sizing & fit'),
	order: msg('My order'),
	shipping: msg('Shipping & returns'),
	other: msg('Something else')
} as const;

export type Topic = keyof typeof TOPICS;

export const isTopic = (value: unknown): value is Topic => typeof value === 'string' && value in TOPICS;
