<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	// Order tracking: one of the signed-in customer's orders, on live Medusa data.
	// `getMyOrder` only returns an order that belongs to the signed-in customer.
	import { page } from '$app/state';
	import { getCustomer } from 'sveltekit-medusa-sdk/customer';
	import { getMyOrder } from '#lib/medusa/tracking.remote.js';
	import { safe } from '#lib/medusa/safe.js';
	import { dev } from '$app/env';
	import { Metadata } from '#lib/components/ui/seo/index.js';
	import OrderDetail from '#lib/components/account/OrderDetail.svelte';

	const result = $derived(
		await safe(async () => {
			const id = page.params.id ?? '';
			const customer = await getCustomer();
			if (!customer) return { signedIn: false as const, order: null };
			return { signedIn: true as const, order: await getMyOrder(id) };
		})
	);
	const order = $derived(result.data?.order ?? null);
</script>

<Metadata config={{ title: order ? t('Order {number}', { number: order.number }) : t('Order'), noindex: true }} />

<div class="min-h-screen bg-white pt-16 md:pt-24">
	{#if order}
		<OrderDetail {order} />
	{:else}
		<div class="mx-auto max-w-xl px-8 pb-32 text-center">
			{#if result.error}
				<h1 class="mb-4 font-serif text-4xl">{t('We couldn\'t load this order')}</h1>
				<p class="mb-10 text-sm leading-relaxed text-gray-600">
					{dev ? result.error : t('Something went wrong on our side. Please try again in a moment.')}
				</p>
				<a href={l('/account#orders')} class="inline-block border-2 border-gray-900 px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all hover:bg-gray-900 hover:text-white">
					{t('Back to your orders')}
				</a>
			{:else if !result.data?.signedIn}
				<h1 class="mb-4 font-serif text-4xl">{t('Sign in to track your order')}</h1>
				<p class="mb-10 text-sm leading-relaxed text-gray-600">{t('Orders are only shown to the account they were placed with.')}</p>
				<a href="?auth=login" class="inline-block bg-gray-900 px-8 py-3 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800">
					{t('Sign in')}
				</a>
			{:else}
				<h1 class="mb-4 font-serif text-4xl">{t('We can\'t find that order')}</h1>
				<p class="mb-10 text-sm leading-relaxed text-gray-600">
					{t('It may belong to a different account. Try signing in with the email you ordered with.')}
				</p>
				<a href={l('/account#orders')} class="inline-block border-2 border-gray-900 px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all hover:bg-gray-900 hover:text-white">
					{t('Back to your orders')}
				</a>
			{/if}
		</div>
	{/if}
</div>
