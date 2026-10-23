import { msg, t } from '$lib/i18n'
import type { ReviewFormMessages } from './review-form-ctx.svelte.js'

export type { ReviewFormMessages } from './review-form-ctx.svelte.js'

export const reviewMessages: ReviewFormMessages = {
	unauthenticated: msg('Please sign in to write a review.'),
	error: msg('Something went wrong. Please try again.'),
	network: msg('Could not reach the server. Please check your connection and try again.'),
	unknown: msg('Something went wrong. Please try again.')
}

export function resolveReviewMessage(messages: ReviewFormMessages, code: string | undefined): string {
	return t(messages[code ?? 'unknown'] ?? messages.unknown ?? 'Something went wrong. Please try again.')
}
