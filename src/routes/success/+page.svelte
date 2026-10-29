<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { onMount } from 'svelte';
	import { Metadata } from '#lib/components/ui/seo/index.js';
	import Check from '@lucide/svelte/icons/check';
	import Package from '@lucide/svelte/icons/package';
	import Lock from '@lucide/svelte/icons/lock';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import InstagramIcon from '#lib/components/icons/InstagramIcon.svelte';
	import { formatPrice } from '#lib/medusa/catalog.js';
	import { site, photos } from '#lib/site.js';
	import { recallOrder, type OrderSummary } from '#lib/medusa/order-summary.js';

	// The order that was just placed, handed over by checkout (see order-summary.ts). It is read
	// after mount because sessionStorage doesn't exist on the server; a direct visit to /success
	// simply shows the generic thank-you.
	let order = $state<OrderSummary | null>(null);
	onMount(() => {
		order = recallOrder();
	});
</script>

<Metadata config={{ title: t('Order confirmed'), noindex: true }} />

<div class="bg-white min-h-screen">
	<div class="max-w-4xl mx-auto px-8 py-24">
		<div class="text-center mb-16">
			<div class="w-24 h-24 border-4 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-8">
				<Check class="w-12 h-12" />
			</div>

			<h1 class="text-4xl md:text-5xl font-serif mb-6 leading-tight">{t('The Muse has spoken.')}</h1>
			<p class="text-xl text-gray-700 mb-4">{t('Your order is confirmed and is being prepared.')}</p>
			{#if order}
				<p class="text-sm text-gray-500">{t('Order #{id}', { id: order.displayId ?? order.id })}</p>
				{#if order.email}
					<p class="text-sm text-gray-500 mt-1">{t('A confirmation is on its way to {email}', { email: order.email })}</p>
				{/if}
			{/if}
		</div>

		<div class="border-2 border-gray-200 p-8 mb-12">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
				<div>
					<p class="text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">{t('Order Total')}</p>
					<p class="text-2xl font-serif">{order ? formatPrice(order.total, order.currency) : '—'}</p>
				</div>

				<div>
					<p class="text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">{t('Delivery')}</p>
					<p class="text-lg">{order?.shippingMethod ?? t('Confirmed by email')}</p>
				</div>

				<div>
					<p class="text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">{t('Tracking')}</p>
					<p class="text-sm text-gray-600">{t('Sent to your email')}</p>
				</div>
			</div>
		</div>

		{#if order && order.items.length > 0}
			<div class="border-2 border-gray-200 mb-12 divide-y divide-gray-200">
				{#each order.items as item, i (i)}
					<div class="flex items-center justify-between gap-6 p-6">
						<div>
							<p class="tracking-wide">{item.title}</p>
							{#if item.variant && item.variant !== 'Default variant'}
								<p class="text-sm text-gray-500 mt-1">{item.variant}</p>
							{/if}
						</div>
						<div class="text-right text-sm">
							<p class="text-gray-500">{t('Qty {quantity}', { quantity: item.quantity })}</p>
							{#if item.unitPrice !== null}
								<p>{formatPrice(item.unitPrice * item.quantity, order.currency)}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mb-12">
			<div class="aspect-[4/5] md:aspect-video relative overflow-hidden border border-gray-300 bg-gray-900">
				<img
					src={photos.orderConfirmed}
					alt={t('A Wild Coral bikini in the summer sun')}
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover object-[50%_58%]"
				/>
			</div>
		</div>

		<div class="mb-12">
			<h2 class="text-2xl font-serif text-center mb-8">{t('What Happens Next')}</h2>

			<div class="space-y-6">
				<div class="flex gap-6">
					<div class="w-12 h-12 border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
						<span class="text-sm font-medium">1</span>
					</div>
					<div>
						<h3 class="text-sm tracking-[0.2em] uppercase mb-2">{t('Order Confirmation')}</h3>
						<p class="text-sm text-gray-600 leading-relaxed">
							{t('You\'ll receive a confirmation email with your order details within the next few minutes.')}
						</p>
					</div>
				</div>

				<div class="flex gap-6">
					<div class="w-12 h-12 border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
						<span class="text-sm font-medium">2</span>
					</div>
					<div>
						<h3 class="text-sm tracking-[0.2em] uppercase mb-2">{t('Preparation')}</h3>
						<p class="text-sm text-gray-600 leading-relaxed">
							{t('Your piece is checked and carefully packed before it leaves us.')}
						</p>
					</div>
				</div>

				<div class="flex gap-6">
					<div class="w-12 h-12 border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
						<span class="text-sm font-medium">3</span>
					</div>
					<div>
						<h3 class="text-sm tracking-[0.2em] uppercase mb-2">{t('Shipping')}</h3>
						<p class="text-sm text-gray-600 leading-relaxed">
							{t('Your order ships with {method}. You\'ll receive tracking information by email as soon as it\'s dispatched.', { method: order?.shippingMethod ?? t('the delivery method you chose') })}
						</p>
					</div>
				</div>

				<div class="flex gap-6">
					<div class="w-12 h-12 border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
						<span class="text-sm font-medium">4</span>
					</div>
					<div>
						<h3 class="text-sm tracking-[0.2em] uppercase mb-2">{t('Arrival')}</h3>
						<p class="text-sm text-gray-600 leading-relaxed">
							{t('We\'ll send you a notification when it\'s out for delivery.')}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="border-t-2 border-gray-900 pt-12 text-center">
			<InstagramIcon class="w-8 h-8 mx-auto mb-4 text-gray-700" />
			<h2 class="text-2xl font-serif mb-4">{t('Share Your Moment')}</h2>
			<p class="text-lg text-gray-700 mb-6 leading-relaxed">{t('Tag us in your sun-drenched moments')}</p>
			<p class="text-xl tracking-wider mb-8">{site.hashtag}</p>

			{#if site.social.instagram}
				<div class="flex justify-center space-x-4">
					<a
						href={l(site.social.instagram)}
						target="_blank"
						rel="noopener noreferrer"
						class="border-2 border-gray-900 px-6 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
					>
						{site.instagramHandle ? t('Follow {handle}', { handle: site.instagramHandle }) : t('Follow us on Instagram')}
					</a>
				</div>
			{/if}
		</div>

		<div class="text-center mt-16 pt-16 border-t border-gray-200">
			<h3 class="text-xl font-serif mb-6">{t('Continue Your Collection')}</h3>
			<p class="text-sm text-gray-600 mb-8">
				{t('Discover complementary pieces to complete your resort wardrobe')}
			</p>
			<div class="flex justify-center space-x-4">
				<a
					href={l('/shop')}
					class="border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
				>
					{t('Shop All')}
				</a>
				<a
					href={l('/')}
					class="border-2 border-gray-300 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:border-gray-900 transition-all"
				>
					{t('Return Home')}
				</a>
			</div>
		</div>
	</div>

	<div class="border-t border-gray-200 bg-gray-50 py-16">
		<div class="max-w-7xl mx-auto px-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
				<div class="space-y-3">
					<div class="w-12 h-12 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<Package class="w-5 h-5" />
					</div>
					<h3 class="text-xs tracking-[0.2em] uppercase">{t('Carefully Packed')}</h3>
					<p class="text-xs text-gray-600 leading-relaxed">
						{t('Every order is checked and packed with care')}
					</p>
				</div>

				<div class="space-y-3">
					<div class="w-12 h-12 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<Lock class="w-5 h-5" />
					</div>
					<h3 class="text-xs tracking-[0.2em] uppercase">{t('Secure Payment')}</h3>
					<p class="text-xs text-gray-600 leading-relaxed">
						{t('Your payment is processed securely')}
					</p>
				</div>

				<div class="space-y-3">
					<div class="w-12 h-12 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<MessageCircle class="w-5 h-5" />
					</div>
					<h3 class="text-xs tracking-[0.2em] uppercase">{t('Here to Help')}</h3>
					<p class="text-xs text-gray-600 leading-relaxed">
						{t('Questions about your order?')}
						<a href={l('/contact?topic=order')} class="underline hover:opacity-70">{t('Get in touch')}</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
