<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { t } from '#lib/i18n/index.js'
	import { Metadata } from '#lib/components/ui/seo/index.js'
	import OrderDetail from '#lib/components/account/OrderDetail.svelte'
	import { startGuestOrderTracking, verifyGuestOrderTracking } from '#lib/medusa/guest-tracking.remote.js'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()
	const labelClass = 'text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700'
	const inputClass = 'w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors aria-invalid:border-red-600'

	let challenge = $state<{ email: string; orderNumber: string } | null>(null)
	let failure = $state('')
	const startFields = startGuestOrderTracking.fields
	const verifyFields = verifyGuestOrderTracking.fields

	const START_FAILURES = {
		email_has_no_orders: t('We can’t find any orders for that email address.'),
		order_not_owned: t('That order number is not associated with this email address.'),
		rate_limited: t('Too many codes were requested. Please wait a few minutes and try again.'),
		send_failed: t('We couldn’t send a code right now. Please try again in a moment.'),
		network: t('Could not reach the server. Please check your connection and try again.')
	} as const
	const VERIFY_FAILURES = {
		invalid_or_expired: t('That code is incorrect or has expired. Request a new one and try again.'),
		network: t('Could not reach the server. Please check your connection and try again.')
	} as const

	const startEnhanced = startGuestOrderTracking.enhance(async ({ submit }) => {
		failure = ''
		try {
			await submit()
		} catch {
			failure = START_FAILURES.network
			return
		}
		const result = startGuestOrderTracking.result
		if (!result) return
		if (!result.ok) {
			failure = START_FAILURES[result.code]
			return
		}
		challenge = { email: result.email, orderNumber: result.orderNumber }
		verifyFields.set({ email: result.email, orderNumber: result.orderNumber, code: '' })
	})

	const verifyEnhanced = verifyGuestOrderTracking.enhance(async ({ submit }) => {
		failure = ''
		try {
			await submit()
		} catch {
			failure = VERIFY_FAILURES.network
			return
		}
		const result = verifyGuestOrderTracking.result
		if (!result?.ok) {
			failure = result ? VERIFY_FAILURES[result.code] : VERIFY_FAILURES.network
			return
		}
		await goto(page.url.pathname, { invalidateAll: true })
	})
</script>

<Metadata config={{ title: t('Track Order'), noindex: true }} />

<div class="min-h-screen bg-white pt-16 md:pt-24">
	{#if data.order}
		<OrderDetail order={data.order} backHref="/order-track" />
	{:else}
		<div class="mx-auto max-w-xl px-8 py-20 md:py-28">
			<h1 class="mb-4 text-center font-serif text-4xl">{t('Track Order')}</h1>
			<p class="mb-10 text-center text-sm leading-relaxed text-gray-600">{t('Enter your order number and the email used at checkout. We’ll send a code to verify it’s yours.')}</p>

			{#if challenge}
				<form {...verifyEnhanced} class="space-y-6">
					<input {...verifyFields.email.as('hidden', challenge.email)} />
					<input {...verifyFields.orderNumber.as('hidden', challenge.orderNumber)} />
					<div>
						<label for="tracking-code" class={labelClass}>{t('Verification code')}</label>
						<input id="tracking-code" class={inputClass} inputmode="numeric" autocomplete="one-time-code" maxlength="6" required {...verifyFields.code.as('text')} />
						{#each (verifyFields.code.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
					</div>
					<p class="text-sm text-gray-600">{t('We sent a six-digit code to {email}.', { email: challenge.email })}</p>
					{#if failure}<p role="alert" class="text-sm text-red-700">{failure}</p>{/if}
					<button type="submit" disabled={verifyGuestOrderTracking.pending > 0} class="w-full bg-gray-900 px-10 py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 disabled:opacity-50">
						{verifyGuestOrderTracking.pending > 0 ? t('Verifying…') : t('View order')}
					</button>
					<button type="button" class="w-full text-sm underline" onclick={() => { challenge = null; failure = '' }}>{t('Use a different order')}</button>
				</form>
			{:else}
				<form {...startEnhanced} class="space-y-6">
					<div>
						<label for="tracking-order-number" class={labelClass}>{t('Order number')}</label>
						<input id="tracking-order-number" class={inputClass} autocomplete="off" maxlength="40" placeholder="e.g. 1041" required {...startFields.orderNumber.as('text')} />
						{#each (startFields.orderNumber.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
					</div>
					<div>
						<label for="tracking-email" class={labelClass}>{t('Email')}</label>
						<input id="tracking-email" class={inputClass} autocomplete="email" required {...startFields.email.as('email')} />
						{#each (startFields.email.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
					</div>
					{#if failure}<p role="alert" class="text-sm text-red-700">{failure}</p>{/if}
					<button type="submit" disabled={startGuestOrderTracking.pending > 0} class="w-full bg-gray-900 px-10 py-4 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 disabled:opacity-50">
						{startGuestOrderTracking.pending > 0 ? t('Sending…') : t('Send verification code')}
					</button>
				</form>
			{/if}
		</div>
	{/if}
</div>
