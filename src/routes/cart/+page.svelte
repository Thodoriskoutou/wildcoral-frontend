<script lang="ts">
	import { t, l } from '$lib/i18n';
	import { Metadata } from '$lib/components/ui/seo';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Lock from '@lucide/svelte/icons/lock';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import {
		getCart,
		updateCartItem,
		removeFromCart,
		addPromotion,
		removePromotion,
		updateCart
	} from 'sveltekit-medusa-sdk';
	import { beforeNavigate } from '$app/navigation';
	import { site } from '$lib/site';
	import { formatPrice } from '$lib/medusa/catalog';
	import CouponInput from '$lib/components/CouponInput.svelte';
	import ProductMedia from '$lib/components/ProductMedia.svelte';

	// The live Medusa cart (tied to the visitor's cart cookie). Commands below update this same
	// query in place, so the page re-renders without any manual state.
	const cart = $derived(await getCart());
	const items = $derived(cart?.items ?? []);
	const currency = $derived((cart?.currency_code ?? 'eur').toUpperCase());

	let giftMessage = $state('');
	let showGiftMessage = $state(false);
	let ecoPackaging = $state(false);

	// The gift message and packaging choice are saved on the Medusa cart (as metadata, which the
	// order keeps) so the shop actually sees them. Local state is seeded once from the saved cart.
	let seeded = false;
	$effect(() => {
		if (seeded || !cart) return;
		seeded = true;
		giftMessage = String(cart.metadata?.gift_message ?? '');
		showGiftMessage = giftMessage.length > 0;
		ecoPackaging = cart.metadata?.eco_packaging === true;
	});

	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	async function persistOptions() {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		try {
			await updateCart({ metadata: { gift_message: giftMessage.trim(), eco_packaging: ecoPackaging } });
		} catch {
			/* not critical: the shopper can still check out; the choice just isn't recorded */
		}
	}
	function saveOptions() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(persistOptions, 600);
	}
	// If they head to checkout before the debounce fires, save right away.
	beforeNavigate(() => {
		if (saveTimer) persistOptions();
	});

	const contactHref = '/contact';

	let busy = $state(false);
	let errorMessage = $state('');

	function messageOf(e: unknown) {
		const err = e as { body?: { message?: string }; message?: string };
		return err?.body?.message ?? err?.message ?? t('Something went wrong. Please try again.');
	}

	// A code counts as applied only if Medusa actually attached it to the cart (unknown or
	// ineligible codes are ignored by the backend rather than rejected).
	async function applyCoupon(code: string) {
		try {
			const updated = await addPromotion(code);
			// The promotion commands don't reliably push their result into the cart query on the
			// client, so refresh it explicitly to get the new discount and total on screen.
			await getCart().refresh();
			const ok = updated?.promotions?.some((p) => p.code?.toUpperCase() === code) ?? false;
			return ok ? { ok, message: t('Discount applied') } : { ok, message: t('Invalid coupon code') };
		} catch {
			return { ok: false, message: t('Invalid coupon code') };
		}
	}

	async function removeCoupon(code: string) {
		await removePromotion(code);
		await getCart().refresh();
	}

	async function updateQuantity(itemId: string, newQuantity: number) {
		if (newQuantity < 1 || busy) return;
		busy = true;
		errorMessage = '';
		try {
			await updateCartItem({ item_id: itemId, quantity: newQuantity });
		} catch (e) {
			errorMessage = messageOf(e);
		} finally {
			busy = false;
		}
	}

	async function removeItem(itemId: string) {
		if (busy) return;
		busy = true;
		errorMessage = '';
		try {
			await removeFromCart(itemId);
		} catch (e) {
			errorMessage = messageOf(e);
		} finally {
			busy = false;
		}
	}
</script>

<Metadata config={{ title: t('Your Selection'), noindex: true }} />

{#if items.length === 0}
	<div class="min-h-screen bg-white flex items-center justify-center">
		<div class="max-w-2xl mx-auto px-8 text-center py-24">
			<div class="border-2 border-gray-200 p-16">
				<h1 class="text-3xl font-serif mb-6">{t('Your Selection is Empty')}</h1>
				<p class="text-gray-600 mb-8 leading-relaxed">{t('Begin curating your luxury swimwear collection.')}</p>
				<a
					href={l('/shop')}
					class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
				>
					{t('Explore Collection')}
				</a>
			</div>
		</div>
	</div>
{:else}
	<div class="bg-white min-h-screen">
		<div class="border-b border-gray-200 bg-white sticky top-[72px] z-30">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-8">
				<h1 class="text-4xl md:text-5xl font-serif mb-6">{t('Your Selection')}</h1>

				<div class="flex items-center space-x-3 text-sm">
					<span class="font-medium">{t('Selection')}</span>
					<span class="text-gray-400">→</span>
					<span class="text-gray-400">{t('Information')}</span>
					<span class="text-gray-400">→</span>
					<span class="text-gray-400">{t('Payment')}</span>
				</div>
			</div>
		</div>

		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-16">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
				<div class="lg:col-span-2 space-y-8">
					{#if errorMessage}
						<p role="alert" class="text-sm text-red-700">{errorMessage}</p>
					{/if}

					{#each items as item (item.id)}
						<div class="flex gap-6 pb-8 border-b border-gray-200">
							<a
								href={l(`/product/${item.product_handle}`)}
								class="flex-shrink-0 w-40 h-52 bg-gray-100 border border-gray-200 relative overflow-hidden group"
							>
								<ProductMedia src={item.thumbnail} alt={item.product_title ?? item.title} />
								<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</a>

							<div class="flex-grow flex flex-col justify-between">
								<div>
									<a
										href={l(`/product/${item.product_handle}`)}
										class="text-xl tracking-wide hover:opacity-70 transition-opacity block mb-2"
									>
										{item.product_title ?? item.title}
									</a>
									{#if item.variant_title && item.variant_title !== 'Default variant'}
										<p class="text-sm text-gray-600 mb-4">{item.variant_title}</p>
									{/if}
									<p class="text-lg">{formatPrice(item.unit_price, currency)}</p>
								</div>

								<div class="flex items-center justify-between mt-4">
									<div class="flex items-center space-x-6">
										<button
											onclick={() => updateQuantity(item.id, item.quantity - 1)}
											disabled={busy || item.quantity <= 1}
											class="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40"
										>
											<Minus class="w-4 h-4" />
											<span class="sr-only">{t('Decrease quantity')}</span>
										</button>
										<span class="text-sm w-4 text-center">{item.quantity}</span>
										<button
											onclick={() => updateQuantity(item.id, item.quantity + 1)}
											disabled={busy}
											class="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40"
										>
											<Plus class="w-4 h-4" />
											<span class="sr-only">{t('Increase quantity')}</span>
										</button>
									</div>

									<button
										onclick={() => removeItem(item.id)}
										disabled={busy}
										class="text-sm text-gray-500 hover:text-gray-900 transition-colors underline disabled:opacity-40"
									>
										{t('Remove')}
									</button>
								</div>
							</div>
						</div>
					{/each}

					<div class="pt-8 space-y-6">
						<h2 class="text-2xl font-serif mb-6">{t('Personalize Your Order')}</h2>

						<div>
							<button
								onclick={() => (showGiftMessage = !showGiftMessage)}
								class="flex items-center justify-between w-full text-left pb-4 border-b border-gray-200 hover:opacity-70 transition-opacity"
							>
								<span class="text-sm tracking-wide">{t('Add a Gift Message')}</span>
								<span class="text-sm text-gray-500">{showGiftMessage ? '−' : '+'}</span>
							</button>

							{#if showGiftMessage}
								<div class="mt-4">
									<textarea
										bind:value={giftMessage}
										oninput={saveOptions}
										placeholder={t('Your message here...')}
										class="w-full border border-gray-300 p-4 text-sm outline-none focus:border-gray-900 transition-colors resize-none"
										rows="4"
									></textarea>
									<p class="text-xs text-gray-500 mt-2">
										{t('We\'ll include this on a hand-written card with your order')}
									</p>
								</div>
							{/if}
						</div>

						<div class="pb-4 border-b border-gray-200">
							<label class="flex items-start space-x-3 cursor-pointer group">
								<input type="checkbox" bind:checked={ecoPackaging} onchange={saveOptions} class="mt-1 w-5 h-5 accent-gray-900" />
								<div>
									<span class="text-sm tracking-wide block group-hover:opacity-70 transition-opacity">
										{t('Complimentary Eco-Luxury Packaging')}
									</span>
									<p class="text-xs text-gray-600 mt-1">
										{t('100% plastic-free, fully recyclable materials with a reusable linen pouch')}
									</p>
								</div>
							</label>
						</div>

					</div>

					<a href={l('/shop')} class="inline-block text-sm tracking-wide underline hover:opacity-70 transition-opacity mt-8">
						{t('Continue Shopping')}
					</a>
				</div>

				<div class="lg:col-span-1">
					<div class="border-2 border-gray-900 p-8 lg:sticky lg:top-24">
						<h2 class="text-2xl font-serif mb-8">{t('Order Summary')}</h2>

						<div class="space-y-4 mb-8 pb-8 border-b border-gray-200">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">{t('Subtotal')}</span>
								<span>{formatPrice(cart?.subtotal ?? 0, currency)}</span>
							</div>

							{#if (cart?.discount_total ?? 0) > 0}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">{t('Discount')}</span>
									<span class="text-green-700">−{formatPrice(cart?.discount_total ?? 0, currency)}</span>
								</div>
							{/if}

							<div class="flex justify-between text-sm">
								<span class="text-gray-600">{t('Shipping')}</span>
								<span class="text-gray-600">{t('At checkout')}</span>
							</div>

							{#if ecoPackaging}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">{t('Eco-Luxury Packaging')}</span>
									<span class="text-green-700">{t('Complimentary')}</span>
								</div>
							{/if}
						</div>

						<div class="mb-8 pb-8 border-b border-gray-200">
							<CouponInput
								apply={applyCoupon}
								remove={removeCoupon}
								initialCode={cart?.promotions?.[0]?.code ?? null}
							/>
						</div>

						<div class="flex justify-between text-xl mb-8">
							<span class="font-serif">{t('Total')}</span>
							<span class="font-medium">{formatPrice(cart?.total ?? 0, currency)}</span>
						</div>

						<a
							href={l('/checkout')}
							class="w-full bg-gray-900 text-white py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all mb-8 block text-center"
						>
							{t('Proceed to Secure Checkout')}
						</a>

						<div class="pt-8 border-t border-gray-200 space-y-6">
							<div class="flex items-start space-x-3">
								<Lock class="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
								<div>
									<h3 class="text-sm font-medium mb-1">{t('Secure')}</h3>
									<p class="text-xs text-gray-600 leading-relaxed">{t('256-bit SSL encryption. Your data is protected.')}</p>
								</div>
							</div>

							<div class="flex items-start space-x-3">
								<MessageCircle class="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
								<div>
									<h3 class="text-sm font-medium mb-1">{t('Help')}</h3>
									<p class="text-xs text-gray-600 leading-relaxed">{t('Questions about your order? We\'re happy to help.')}</p>
									<a href={l(contactHref)} class="text-xs underline mt-1 inline-block hover:opacity-70 transition-opacity">{t('Contact Us')}</a>
								</div>
							</div>

							<div class="flex items-start space-x-3">
								<RotateCcw class="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
								<div>
									<h3 class="text-sm font-medium mb-1">{t('Returns')}</h3>
									<p class="text-xs text-gray-600 leading-relaxed">{t('Easy 30-day return policy. No questions asked.')}</p>
									<a href={l('/customer-care')} class="text-xs underline mt-1 inline-block hover:opacity-70 transition-opacity">{t('Learn More')}</a>
								</div>
							</div>
						</div>

					</div>
				</div>
			</div>
		</div>

		<div class="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-4">
			<div class="flex items-center justify-between mb-3">
				<span class="text-sm text-gray-600">{t('Total')}</span>
				<span class="text-xl font-medium">{formatPrice(cart?.total ?? 0, currency)}</span>
			</div>
			<a
				href={l('/checkout')}
				class="w-full bg-gray-900 text-white py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all block text-center"
			>
				{t('Proceed to Checkout')}
			</a>
		</div>
	</div>
{/if}
