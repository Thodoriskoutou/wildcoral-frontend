<script lang="ts">
	import { t } from '$lib/i18n'
	import type { Snippet } from 'svelte'
	import { register } from 'sveltekit-medusa-sdk/auth'
	import { getCustomer } from 'sveltekit-medusa-sdk/customer'
	import { cn } from '$lib/utils.js'
	import { createAuthForm } from './create-auth-form.svelte.js'
	import { registerMessages } from './auth-messages.js'
	import type { AuthMessages, AuthResult } from './types.js'

	let {
		messages = registerMessages,
		onregistered,
		validate = requirePasswordLength,
		onsuccess,
		onswitch,
		onerror,
		class: className = '',
		children
	}: {
		messages?: AuthMessages
		/** Runs before sending. Return a message to stop and show it, or null to continue. Defaults to requiring a password of at least 8 characters (Medusa itself accepts any length). */
		validate?: (values: Record<string, unknown>) => string | null
		/** Runs once the account exists and is signed in, before the customer query refreshes: the place to save extra details (e.g. the name) so the page never shows the bare account. A failure here is ignored; the account itself is already created. */
		onregistered?: () => void | Promise<void>
		onsuccess?: () => void
		onswitch?: (mode: string) => void
		onerror?: (result: AuthResult) => void
		class?: string
		children: Snippet
	} = $props()

	const MIN_PASSWORD = 8
	function requirePasswordLength(values: Record<string, unknown>) {
		const password = values.password
		return typeof password === 'string' && password.length > 0 && password.length < MIN_PASSWORD
			? t('Your password needs at least {min} characters.', { min: MIN_PASSWORD })
			: null
	}

	const auth = createAuthForm(() => ({
		form: register,
		messages,
		validate,
		onOk: async () => {
			try {
				await onregistered?.()
			} catch {
				// The account is created either way; the customer can add their name later in Account Settings.
			}
			await getCustomer().refresh()
		},
		onsuccess,
		onswitch,
		onerror
	}))
</script>

<form {...auth.enhanced} oninput={auth.clearError} class={cn('flex flex-col gap-4', className)}>
	{@render children()}
</form>
