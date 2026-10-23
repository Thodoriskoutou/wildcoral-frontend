<script lang="ts">
	import { t, l } from '$lib/i18n';
	// Checkout: the Wild Coral page chrome around the registry's region-driven checkout.
	//
	// `CheckoutAuto` owns the whole flow — address form → delivery → payment session → confirm →
	// complete cart → redirect — and picks the payment UI from the cart region's provider (Stripe or
	// Braintree). This page adds the empty / not-configured states around it and sends the shopper
	// to /success when the order is placed.
	//
	// `returnUrl` MUST point at this app's /checkout/return route — Stripe requires it even when
	// confirmation happens without a redirect.
	import { STRIPE_KEY, STRIPE_REDIRECT_URL } from '$app/env/public';

	// The page Stripe sends the customer back to, in the language they are using.
	function returnUrlInThisLanguage(url: string): string {
		try {
			const target = new URL(url);
			target.pathname = l(target.pathname);
			return target.toString();
		} catch {
			return url;
		}
	}
	import { getCart } from 'sveltekit-medusa-sdk';
	import { CheckoutAuto, resolveCheckoutProvider } from '$lib/components/ui/checkout';
	import { Metadata } from '$lib/components/ui/seo';
	import { safe } from '$lib/medusa/safe';
	import { rememberOrder } from '$lib/medusa/order-summary';
	import { dev } from '$app/env';

	const cartResult = $derived(await safe(async () => await getCart()));
	const cart = $derived(cartResult.data);

	const providerIds = $derived(
		((cart?.region?.payment_providers ?? []) as { id: string }[]).map((p) => p.id)
	);
	const provider = $derived(resolveCheckoutProvider(providerIds));
</script>

<Metadata config={{ title: t('Checkout'), noindex: true }} />

<div class="bg-white min-h-screen">
	<div class="border-b border-gray-200 bg-white sticky top-[72px] z-30">
		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-6">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-serif">{t('Secure Checkout')}</h1>
				<a href={l('/cart')} class="text-sm underline hover:opacity-70 transition-opacity">{t('Return to Cart')}</a>
			</div>

			<div class="flex items-center space-x-3 text-sm mt-4">
				<span class="text-gray-400">{t('Selection')}</span>
				<span class="text-gray-400">→</span>
				<span class="font-medium">{t('Information & Payment')}</span>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 py-16">
		{#if cartResult.error}
			<div class="max-w-xl mx-auto text-center py-16">
				<h2 class="text-2xl font-serif mb-4">{t('Checkout is unavailable right now')}</h2>
				<p class="text-sm text-gray-600">{dev ? cartResult.error : t('Please try again in a moment.')}</p>
			</div>
		{:else if !cart || (cart.items?.length ?? 0) === 0}
			<div class="max-w-xl mx-auto text-center py-16 border-2 border-gray-200 p-16">
				<h2 class="text-3xl font-serif mb-6">{t('Your Selection is Empty')}</h2>
				<p class="text-gray-600 mb-8 leading-relaxed">{t('Add a piece to your selection before checking out.')}</p>
				<a
					href={l('/shop')}
					class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
				>
					{t('Explore Collection')}
				</a>
			</div>
		{:else if !provider}
			<div class="max-w-xl mx-auto text-center py-16">
				<h2 class="text-2xl font-serif mb-4">{t('Online payment is being set up')}</h2>
				<p class="text-sm text-gray-600 leading-relaxed">
					{t('We can\'t take payments on the website just yet. Please check back soon.')}
				</p>
				{#if dev}
					<p class="text-xs text-gray-400 mt-6 leading-relaxed">
						{t('Dev note: this region\'s payment providers are')}
						<code>{providerIds.join(', ') || '(none)'}</code>{t('. Checkout supports Stripe (')}<code>pp_stripe_stripe</code>{t(') and Braintree — enable one on the region in the Medusa admin (Settings → Regions → Payment providers).')}
					</p>
				{/if}
			</div>
		{:else if provider.kind === 'stripe' && !STRIPE_KEY}
			<div class="max-w-xl mx-auto text-center py-16">
				<h2 class="text-2xl font-serif mb-4">{t('Online payment is being set up')}</h2>
				<p class="text-sm text-gray-600">{t('We can\'t take payments on the website just yet. Please check back soon.')}</p>
				{#if dev}
					<p class="text-xs text-gray-400 mt-6">
						{t('Dev note: set')} <code>STRIPE_KEY</code> {t('(publishable key) and')} <code>STRIPE_REDIRECT_URL</code> {t('in')}
						<code>.env</code>.
					</p>
				{/if}
			</div>
		{:else}
			<CheckoutAuto
				publishableKey={STRIPE_KEY}
				returnUrl={returnUrlInThisLanguage(STRIPE_REDIRECT_URL)}
				redirectTo="/success"
				oncomplete={rememberOrder}
			/>
		{/if}
	</div>
</div>
