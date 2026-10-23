import { msg, t } from '$lib/i18n'
import type { AuthMessages } from './types.js'

// Default, overridable error copy. Codes come from the SDK auth remotes' AuthResult.
export const loginMessages: AuthMessages = {
	invalid_credentials: msg('Invalid email or password.'),
	rate_limited: msg('Too many attempts. Please wait a moment and try again.'),
	unsupported: msg('This account needs an extra sign-in step that is not supported yet.'),
	network: msg('Could not reach the server. Please check your connection and try again.'),
	unknown: msg('Something went wrong. Please try again.')
}
export const registerMessages: AuthMessages = {
	email_exists: msg('An account with that email already exists.'),
	unsupported: msg('This sign-up needs an extra step that is not supported yet.'),
	network: msg('Could not reach the server. Please check your connection and try again.'),
	unknown: msg('Something went wrong. Please try again.')
}
export const resetMessages: AuthMessages = {
	network: msg('Could not reach the server. Please check your connection and try again.'),
	unknown: msg('Something went wrong. Please try again.')
}
export function resolveMessage(messages: AuthMessages, code: string | undefined): string {
	return t(messages[code ?? 'unknown'] ?? messages.unknown ?? 'Something went wrong. Please try again.')
}
