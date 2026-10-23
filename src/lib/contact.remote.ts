import { msg } from '$lib/i18n'
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, RESEND_API_URL } from '$app/env/private';
import { site } from '$lib/site';
import { TOPICS, type Topic } from '$lib/contact';

/**
 * The contact form on /contact. A message is emailed to the shop through Resend (resend.com), using the
 * shop's own API key from the environment (see src/env.ts). The visitor's address is set as the reply-to, so
 * pressing "Reply" in the inbox answers them.
 *
 * Without RESEND_API_KEY there is nothing to send with, so `getContactMode` says so and the page shows the
 * shop's contact details instead of a form that would swallow messages.
 */

const recipient = () => (CONTACT_TO_EMAIL || site.contactEmail).trim();

/** Whether messages can be sent. Says nothing about the keys themselves. */
export const getContactMode = query(async () => ({ canSend: !!RESEND_API_KEY && !!recipient() }));

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

const oneLine = (s: string, max: number) => s.replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export type ContactResult = { ok: true } | { ok: false; code: 'not_configured' | 'rate_limited' | 'send_failed' };

export const sendContactMessage = form(messageSchema, async (data): Promise<ContactResult> => {
	// A bot filled the hidden field: pretend it worked, send nothing.
	if (data.website) return { ok: true };

	const to = recipient();
	if (!RESEND_API_KEY || !to) return { ok: false, code: 'not_configured' };

	let address = 'unknown';
	try {
		address = getRequestEvent().getClientAddress();
	} catch {
		/* behind a host that doesn't expose it: all visitors share one allowance */
	}
	if (tooManyFrom(address)) return { ok: false, code: 'rate_limited' };

	const topic = TOPICS[data.topic];
	const text = [
		`New message from the ${site.name} website`,
		'',
		`From:   ${oneLine(data.name, 100)} <${data.email}>`,
		`Topic:  ${topic}`,
		`Order:  ${data.order || '-'}`,
		'',
		data.message
	].join('\n');

	try {
		const res = await fetch(RESEND_API_URL, {
			method: 'POST',
			headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				// "onboarding@resend.dev" only delivers to the Resend account's own address: fine for a first test.
				from: CONTACT_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
				to: [to],
				reply_to: data.email,
				subject: oneLine(`[${site.name}] ${topic}: ${data.name}`, 150),
				text
			})
		});
		if (!res.ok) {
			console.error(`[contact] Resend answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
			return { ok: false, code: 'send_failed' };
		}
		return { ok: true };
	} catch (e) {
		console.error('[contact] could not reach Resend:', e);
		return { ok: false, code: 'send_failed' };
	}
});
