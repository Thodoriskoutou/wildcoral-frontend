import { msg } from '#lib/i18n/index.js'
import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { TOPICS, type Topic } from '#lib/contact.js';
import { getMedusaContext } from 'sveltekit-medusa-sdk/server'
import { storeFetch } from '#lib/medusa/store-fetch.server.js'

/**
 * The contact form on /contact. Medusa validates and delivers the message through its SMTP Notification
 * Module; sender and recipient configuration never lives in this storefront.
 */

const messageSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.nonEmpty(msg('Please enter your name.')), v.maxLength(100, msg('That name is too long.'))),
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty(msg('Please enter your email.')),
		v.email(msg('That email address doesn’t look right.')),
		v.maxLength(200, msg('That email address is too long.'))
	),
	topic: v.optional(v.picklist(Object.keys(TOPICS) as [Topic, ...Topic[]]), 'other'),
	order: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(40, msg('That order number is too long.'))), ''),
	message: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(10, msg('Please write at least a sentence.')),
		v.maxLength(3000, msg('Please keep your message under 3000 characters.'))
	),
	/** Honeypot: hidden from people, filled in by bots. */
	website: v.optional(v.string(), '')
});

// A few messages per visitor per ten minutes, kept in memory (enough to stop a script flooding the inbox).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, { count: number; resetsAt: number }>();

function tooManyFrom(address: string): boolean {
	const now = Date.now();
	for (const [key, entry] of recent) if (entry.resetsAt < now) recent.delete(key);
	const entry = recent.get(address) ?? { count: 0, resetsAt: now + WINDOW_MS };
	entry.count++;
	recent.set(address, entry);
	return entry.count > MAX_PER_WINDOW;
}

export type ContactResult = { ok: true } | { ok: false; code: 'rate_limited' | 'send_failed' };

export const sendContactMessage = form(messageSchema, async (data): Promise<ContactResult> => {
	// A bot filled the hidden field: pretend it worked, send nothing.
	if (data.website) return { ok: true };

	let address = 'unknown';
	try {
		address = getRequestEvent().getClientAddress();
	} catch {
		/* behind a host that doesn't expose it: all visitors share one allowance */
	}
	if (tooManyFrom(address)) return { ok: false, code: 'rate_limited' };

	try {
		await storeFetch(getMedusaContext(), '/store/contact', {
			method: 'POST',
			body: { name: data.name, email: data.email, topic: data.topic, order: data.order, message: data.message }
		});
		return { ok: true };
	} catch {
		return { ok: false, code: 'send_failed' };
	}
});
