import { form, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { getMedusaContext } from 'sveltekit-medusa-sdk/server'
import { GUEST_ORDER_TRACKING_OTP_TTL_SECONDS } from '$app/env/private'
import { storeFetch } from './store-fetch.server.js'
import {
	GUEST_ORDER_SESSION_COOKIE,
	createTrackingChallenge,
	discardTrackingChallenge,
	normalizeOrderNumber,
	normalizeTrackingEmail,
	verifyTrackingChallenge
} from '#lib/server/guest-order-tracking.js'

const email = v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter your email.'), v.email('That email address doesn’t look right.'))
const orderNumber = v.pipe(v.string(), v.trim(), v.nonEmpty('Please enter your order number.'), v.maxLength(40, 'That order number is too long.'))
const trackingDetails = v.object({ email, orderNumber })
const verification = v.object({
	email,
	orderNumber,
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the six-digit code from your email.'))
})

type LookupResponse = { order_id?: string }
type BackendError = { body?: { code?: string }; message?: string }

function errorCode(error: unknown) {
	return (error as BackendError)?.body?.code
}

function clientAddress() {
	try {
		return getRequestEvent().getClientAddress()
	} catch {
		return 'unknown'
	}
}

export type StartTrackingResult =
	| { ok: true; email: string; orderNumber: string }
	| { ok: false; code: 'email_has_no_orders' | 'order_not_owned' | 'rate_limited' | 'send_failed' }

/** Verify the order with Medusa, retain only a code hash locally, then ask Medusa's SMTP hook to deliver it. */
export const startGuestOrderTracking = form(trackingDetails, async (data): Promise<StartTrackingResult> => {
	const ctx = getMedusaContext()
	const normalizedEmail = normalizeTrackingEmail(data.email)
	const normalizedOrderNumber = normalizeOrderNumber(data.orderNumber)
	let orderId: string
	try {
		const result = await storeFetch<LookupResponse>(ctx, '/store/guest-order-tracking/lookup', {
			method: 'POST',
			body: { email: normalizedEmail, order_number: normalizedOrderNumber }
		})
		orderId = result.order_id ?? ''
		if (!orderId) return { ok: false, code: 'send_failed' }
	} catch (error) {
		const code = errorCode(error)
		if (code === 'email_has_no_orders' || code === 'order_not_owned') return { ok: false, code }
		return { ok: false, code: 'send_failed' }
	}

	const challenge = createTrackingChallenge({
		email: normalizedEmail,
		orderNumber: normalizedOrderNumber,
		orderId,
		ip: clientAddress(),
		ttlSeconds: GUEST_ORDER_TRACKING_OTP_TTL_SECONDS
	})
	if (!challenge.ok) return challenge

	try {
		await storeFetch(ctx, '/store/guest-order-tracking/send-code', {
			method: 'POST',
			body: { email: normalizedEmail, order_number: normalizedOrderNumber, code: challenge.code }
		})
		return { ok: true, email: normalizedEmail, orderNumber: normalizedOrderNumber }
	} catch {
		discardTrackingChallenge(normalizedEmail, normalizedOrderNumber)
		return { ok: false, code: 'send_failed' }
	}
})

export type VerifyTrackingResult = { ok: true } | { ok: false; code: 'invalid_or_expired' }

export const verifyGuestOrderTracking = form(verification, async (data): Promise<VerifyTrackingResult> => {
	const result = verifyTrackingChallenge({ ...data, ttlSeconds: GUEST_ORDER_TRACKING_OTP_TTL_SECONDS })
	if (!result.ok) return result
	const event = getRequestEvent()
	event.cookies.set(GUEST_ORDER_SESSION_COOKIE, result.token, {
		path: '/',
		maxAge: GUEST_ORDER_TRACKING_OTP_TTL_SECONDS,
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:'
	})
	event.locals.guestOrderId = result.orderId
	return { ok: true }
})
