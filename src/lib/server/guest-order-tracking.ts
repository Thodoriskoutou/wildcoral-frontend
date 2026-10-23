import { createHash, randomBytes, randomInt } from 'node:crypto'

const MAX_ENTRIES = 500
const MAX_CODE_SENDS = 3
const MAX_ATTEMPTS = 5

type Challenge = {
	orderId: string
	expiresAt: number
	codeHash: string
	attempts: number
}

type GuestSession = { orderId: string; expiresAt: number }
type SendWindow = { count: number; expiresAt: number }

const challenges = new Map<string, Challenge>()
const challengeIndex = new Map<string, string>()
const sessions = new Map<string, GuestSession>()
const sends = new Map<string, SendWindow>()

export const GUEST_ORDER_SESSION_COOKIE = 'guest_order_tracking'

export function normalizeTrackingEmail(email: string) {
	return email.trim().toLowerCase()
}

export function normalizeOrderNumber(number: string) {
	return number.trim().replace(/^#/, '')
}

function challengeKey(email: string, orderId: string) {
	return `${email}:${orderId}`
}

function indexKey(email: string, orderNumber: string) {
	return `${email}:${orderNumber}`
}

function hashCode(key: string, code: string) {
	return createHash('sha256').update(`${key}:${code}`).digest('hex')
}

function trim<T>(map: Map<string, T>) {
	while (map.size > MAX_ENTRIES) map.delete(map.keys().next().value!)
}

function cleanExpired(now = Date.now()) {
	for (const [key, challenge] of challenges) {
		if (challenge.expiresAt > now) continue
		challenges.delete(key)
		for (const [index, challengeKey] of challengeIndex) if (challengeKey === key) challengeIndex.delete(index)
	}
	for (const [token, session] of sessions) if (session.expiresAt <= now) sessions.delete(token)
	for (const [key, window] of sends) if (window.expiresAt <= now) sends.delete(key)
}

/** Generates a code but only stores its hash. The caller passes the short-lived plaintext to Medusa for delivery. */
export function createTrackingChallenge(input: {
	email: string
	orderNumber: string
	orderId: string
	ip: string
	ttlSeconds: number
}): { ok: true; code: string } | { ok: false; code: 'rate_limited' } {
	const now = Date.now()
	cleanExpired(now)
	const email = normalizeTrackingEmail(input.email)
	const orderNumber = normalizeOrderNumber(input.orderNumber)
	const sendKey = `${email}:${input.ip}`
	const window = sends.get(sendKey) ?? { count: 0, expiresAt: now + input.ttlSeconds * 1000 }
	window.count++
	sends.set(sendKey, window)
	if (window.count > MAX_CODE_SENDS) return { ok: false, code: 'rate_limited' }

	const key = challengeKey(email, input.orderId)
	const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
	challenges.set(key, { orderId: input.orderId, expiresAt: now + input.ttlSeconds * 1000, codeHash: hashCode(key, code), attempts: 0 })
	challengeIndex.set(indexKey(email, orderNumber), key)
	trim(challenges)
	trim(challengeIndex)
	trim(sends)
	return { ok: true, code }
}

/** Remove a challenge when Medusa could not deliver its code. */
export function discardTrackingChallenge(email: string, orderNumber: string) {
	const index = indexKey(normalizeTrackingEmail(email), normalizeOrderNumber(orderNumber))
	const key = challengeIndex.get(index)
	if (key) challenges.delete(key)
	challengeIndex.delete(index)
}

export function verifyTrackingChallenge(input: { email: string; orderNumber: string; code: string; ttlSeconds: number }):
	| { ok: true; token: string; orderId: string }
	| { ok: false; code: 'invalid_or_expired' } {
	cleanExpired()
	const index = indexKey(normalizeTrackingEmail(input.email), normalizeOrderNumber(input.orderNumber))
	const key = challengeIndex.get(index)
	const challenge = key ? challenges.get(key) : undefined
	if (!key || !challenge || challenge.attempts >= MAX_ATTEMPTS || hashCode(key, input.code) !== challenge.codeHash) {
		if (challenge) {
			challenge.attempts++
			if (challenge.attempts >= MAX_ATTEMPTS) discardTrackingChallenge(input.email, input.orderNumber)
		}
		return { ok: false, code: 'invalid_or_expired' }
	}

	discardTrackingChallenge(input.email, input.orderNumber)
	const token = randomBytes(32).toString('base64url')
	sessions.set(token, { orderId: challenge.orderId, expiresAt: Date.now() + input.ttlSeconds * 1000 })
	trim(sessions)
	return { ok: true, token, orderId: challenge.orderId }
}

/** Resolve a request cookie into the order that this process authenticated. */
export function getGuestTrackingOrder(token: string | undefined): string | null {
	cleanExpired()
	if (!token) return null
	return sessions.get(token)?.orderId ?? null
}
