<script lang="ts">
	import { t, l } from '$lib/i18n';
	import { Metadata } from '$lib/components/ui/seo';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { getProductsQuery, getProductQuery } from 'sveltekit-medusa-sdk';
	import { toCatalogProduct, formatPrice, PRODUCT_FIELDS } from '$lib/medusa/catalog';
	import { safe } from '$lib/medusa/safe';
	import { site, photos } from '$lib/site';
	import ProductMedia from '$lib/components/ProductMedia.svelte';

	// Newest products first, plus the products the "Shop the Look" markers point at. If Medusa is
	// unreachable the product sections simply don't render, so the editorial parts still load.
	const lookHandles = [...new Set(site.shopTheLook.map((m) => m.handle))];
	const catalog = $derived(
		await safe(async () => {
			const [newest, ...look] = await Promise.all([
				getProductsQuery({ limit: 12, order: '-created_at', fields: PRODUCT_FIELDS }),
				...lookHandles.map((handle) => getProductQuery({ slug: handle, fields: PRODUCT_FIELDS }))
			]);
			return {
				products: newest.products.map(toCatalogProduct),
				look: look.filter((p) => p !== null).map(toCatalogProduct)
			};
		})
	);

	const products = $derived(catalog.data?.products ?? []);
	const featuredProducts = $derived(products.slice(0, 6));
	const newArrivals = $derived(products.slice(0, 4));

	// A marker only shows when its Medusa product exists.
	const markers = $derived(
		site.shopTheLook
			.map((m) => ({ ...m, product: catalog.data?.look.find((p) => p.handle === m.handle) ?? null }))
			.filter((m) => m.product !== null)
	);
	let selectedMarker = $state<number | null>(null);
	const openMarker = $derived(selectedMarker === null ? null : (markers[selectedMarker] ?? null));
</script>

<Metadata config={{ title: t('Home'), description: t('{name} — luxury swimwear.', { name: site.name }) }} />

<div class="bg-white">
	<!-- 1. Hero — full bleed photo -->
	<section class="relative h-screen w-full bg-gray-900 flex items-end overflow-hidden">
		<img
			src={photos.hero}
			alt={t('A Wild Coral swimsuit on a sunset beach')}
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
			style="object-position: 50% 30%"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/35"></div>

		<div class="relative z-10 px-8 md:px-16 lg:px-24 pb-20 md:pb-32">
			<h1 class="text-5xl md:text-7xl lg:text-8xl text-white mb-8 italic font-serif">
				{t('Summer')} <span class="block">{t('Reverie')}</span>
			</h1>
			<p class="text-sm text-white/80 tracking-wider mb-8 max-w-sm">{t('Where form meets the formless')}</p>
			<a
				href={l('/shop')}
				class="inline-block border-2 border-white/80 text-white px-10 py-3 text-sm tracking-[0.2em] uppercase hover:bg-white/10 transition-all backdrop-blur-sm"
			>
				{t('Explore Collection')}
			</a>
		</div>

		<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-xs">
			<div class="flex flex-col items-center">
				<span class="mb-2">{t('SCROLL')}</span>
				<div class="w-px h-12 bg-white/30"></div>
			</div>
		</div>
	</section>

	<!-- 2. Horizontal scroll product showcase -->
	{#if featuredProducts.length > 0}
		<section class="py-32 overflow-hidden bg-white">
			<div class="px-8 md:px-16 lg:px-24 mb-12">
				<h2 class="text-3xl md:text-4xl tracking-wide">{t('Featured Styles')}</h2>
			</div>

			<div class="relative">
				<div
					class="flex space-x-8 px-8 md:px-16 lg:px-24 overflow-x-auto scrollbar-hide"
					style="scroll-snap-type: x mandatory"
				>
					{#each featuredProducts as product, index (product.id)}
						<a
							href={l(`/product/${product.handle}`)}
							class="flex-shrink-0 w-80 group"
							style="scroll-snap-align: start"
						>
							<div class="relative aspect-[3/4] bg-gray-100 border border-gray-200 mb-4 overflow-hidden">
								<ProductMedia
									src={product.media[0]}
									poster={product.images[0]}
									alt={product.name}
								/>
								<div
									class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
								></div>
							</div>

							<div class="space-y-2">
								<h3 class="text-sm tracking-wide">{product.name}</h3>
								<div class="flex items-center space-x-2">
									{#each product.colors.slice(0, 3) as color, idx (idx)}
										<div
											class="w-5 h-5 border border-gray-300 rounded-full"
											style="background-color: {color.hex}"
											title={color.name}
										></div>
									{/each}
									{#if product.colors.length > 3}
										<span class="text-xs text-gray-400">+{product.colors.length - 3}</span>
									{/if}
								</div>
								<p class="text-sm">{formatPrice(product.price, product.currency)}</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- 3. Shop the Look — editorial photo with shoppable markers -->
	<section class="py-32 bg-gray-50">
		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
				<div class="order-2 lg:order-1">
					<h2 class="text-3xl md:text-4xl tracking-wide mb-6">{t('Shop The Look')}</h2>
					{#if markers.length > 0}
						<p class="text-gray-600 leading-relaxed mb-8 max-w-md">
							{t('Tap the + markers to meet the pieces from this look, then add them straight to your selection.')}
						</p>
					{:else}
						<p class="text-gray-600 leading-relaxed mb-8 max-w-md">
							{t('Swimwear made to be worn all summer long — from the first swim of the morning to the last light of the evening.')}
						</p>
					{/if}
					<a
						href={l('/shop')}
						class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
					>
						{t('View All Styles')}
					</a>
				</div>

				<div class="order-1 lg:order-2 relative max-w-md w-full mx-auto lg:mx-0 lg:ml-auto">
					<div class="aspect-[3/4] bg-gray-200 border border-gray-300 relative">
						<img
							src={photos.shopTheLook}
							alt={t('The Wild Coral sequin ring bikini at the beach')}
							loading="lazy"
							class="absolute inset-0 h-full w-full object-cover"
						/>

						{#each markers as marker, i (i)}
							<button
								onclick={() => (selectedMarker = selectedMarker === i ? null : i)}
								style="left: {marker.x}%; top: {marker.y}%"
								class="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-2 border-gray-900 flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
							>
								{#if selectedMarker === i}
									<X class="w-4 h-4" />
								{:else}
									<Plus class="w-4 h-4" />
								{/if}
								<span class="sr-only">{t('Shop {name}', { name: marker.product?.name })}</span>
							</button>
						{/each}

						{#if openMarker?.product}
							<div
								class="absolute z-10 bg-white border-2 border-gray-900 p-4 w-64 shadow-xl transform -translate-y-1/2 {openMarker.x >
								50
									? '-translate-x-full -ml-6'
									: 'ml-6'}"
								style="left: {openMarker.x}%; top: {openMarker.y}%"
							>
								<div class="flex space-x-3">
									<div class="w-20 h-24 bg-gray-100 border border-gray-200 relative overflow-hidden shrink-0">
										<ProductMedia
											src={openMarker.product.media[0]}
											poster={openMarker.product.images[0]}
											alt={openMarker.product.name}
										/>
									</div>
									<div class="flex-grow">
										<h4 class="text-sm mb-1">{openMarker.product.name}</h4>
										<p class="text-sm mb-2">
											{formatPrice(openMarker.product.price, openMarker.product.currency)}
										</p>
										<a
											href={l(`/product/${openMarker.product.handle}`)}
											class="block w-full bg-gray-900 text-white py-2 text-xs tracking-wider text-center hover:bg-gray-800"
										>
											{t('View & Add')}
										</a>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Category tiles (60/40) -->
	<section class="py-0">
		<div class="grid grid-cols-1 lg:grid-cols-5">
			<a
				href={l('/shop?category=one-pieces')}
				class="lg:col-span-3 relative aspect-[4/3] lg:aspect-auto lg:min-h-[600px] bg-gray-100 border border-gray-200 group overflow-hidden"
			>
				<img
					src={photos.onePiece}
					alt={t('The Wild Coral one-piece collection')}
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover object-[50%_35%] transition-transform duration-700 group-hover:scale-105"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
					<div class="text-white">
						<h3 class="text-4xl md:text-5xl italic font-serif mb-4">{t('The One-Piece')}</h3>
						<p class="text-sm tracking-wider opacity-90 mb-6">{t('Sculptural elegance')}</p>
						<span
							class="inline-block border-2 border-white px-8 py-2 text-sm tracking-[0.2em] uppercase group-hover:bg-white group-hover:text-gray-900 transition-all"
						>
							{t('Shop Now')}
						</span>
					</div>
				</div>
			</a>

			<a
				href={l('/shop')}
				class="lg:col-span-2 relative aspect-[4/3] lg:aspect-auto lg:min-h-[600px] bg-gray-200 border border-gray-200 group overflow-hidden"
			>
				<img
					src={photos.bikini}
					alt={t('The Wild Coral bikini collection')}
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover object-[50%_45%] transition-transform duration-700 group-hover:scale-105"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
					<div class="text-white">
						<h3 class="text-3xl md:text-4xl italic font-serif mb-4">{t('The Bikini')}</h3>
						<p class="text-sm tracking-wider opacity-90 mb-6">{t('Timeless silhouettes')}</p>
						<span
							class="inline-block border-2 border-white px-8 py-2 text-sm tracking-[0.2em] uppercase group-hover:bg-white group-hover:text-gray-900 transition-all"
						>
							{t('Shop Now')}
						</span>
					</div>
				</div>
			</a>
		</div>
	</section>

	<!-- 5. Philosophy -->
	<section class="py-48 bg-white">
		<div class="max-w-2xl mx-auto px-8 text-center">
			<div class="mb-16">
				<p class="text-2xl md:text-3xl italic font-serif text-gray-900 leading-relaxed">
					{t('"We believe swimwear should be an extension of your identity—not a costume. Each piece is designed to honor the natural form while celebrating individuality."')}
				</p>
			</div>

			<div class="border border-gray-300 inline-block px-8 py-3">
				<span class="text-xs tracking-[0.3em] uppercase">{site.name}</span>
			</div>
		</div>
	</section>

	<!-- 6. New arrivals -->
	{#if newArrivals.length > 0}
		<section class="py-32 bg-gray-50">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
				<div class="mb-12">
					<h2 class="text-3xl md:text-4xl tracking-wide">{t('New Arrivals')}</h2>
				</div>

				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{#each newArrivals as product, index (product.id)}
						<a href={l(`/product/${product.handle}`)} class="group {index === 0 || index === 3 ? 'row-span-2' : ''}">
							<div
								class="relative bg-gray-100 border border-gray-200 mb-3 overflow-hidden {index === 0 ||
								index === 3
									? 'aspect-[3/4]'
									: 'aspect-square'}"
							>
								<ProductMedia
									src={product.media[0]}
									poster={product.images[0]}
									alt={product.name}
								/>
								<div
									class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
								></div>

								<div class="absolute top-4 left-4 bg-white px-3 py-1 text-xs tracking-wider">{t('NEW')}</div>
							</div>

							<div class="space-y-1">
								<h3 class="text-sm tracking-wide">{product.name}</h3>
								<p class="text-sm">{formatPrice(product.price, product.currency)}</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- 7. As featured in — only real outlets, from src/lib/site.ts -->
	{#if site.press.length > 0}
		<section class="py-16 bg-white border-y border-gray-200 overflow-hidden">
			<div class="mb-8 text-center">
				<p class="text-xs tracking-[0.2em] uppercase text-gray-400">{t('As Featured In')}</p>
			</div>

			<div class="relative">
				<div class="flex space-x-16 animate-marquee whitespace-nowrap">
					{#each [0, 1] as setIndex (setIndex)}
						<div class="flex space-x-16 items-center">
							{#each site.press as outlet (outlet)}
								<div
									class="border-2 border-gray-300 px-8 py-4 h-16 flex items-center justify-center min-w-[120px]"
								>
									<span class="text-sm tracking-wider uppercase">{outlet}</span>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- 8. Muse List — only once a newsletter form action is set in src/lib/site.ts -->
	{#if site.newsletterAction}
		<section class="py-48 bg-white">
			<div class="max-w-xl mx-auto px-8 text-center">
				<h2 class="text-4xl md:text-5xl italic font-serif mb-6">{t('Join the Muse List')}</h2>
				<p class="text-sm text-gray-600 mb-12 leading-relaxed">
					{t('Early access to new collections, exclusive drops, and the occasional love letter from our design studio. No spam, just substance.')}
				</p>

				<!-- The field name may need to match your email provider's (e.g. EMAIL for Mailchimp). -->
				<form method="POST" action={site.newsletterAction} class="max-w-md mx-auto">
					<div class="flex border-b-2 border-gray-900 pb-2 mb-4">
						<input
							type="email"
							name="email"
							required
							placeholder={t('Your email address')}
							class="flex-grow bg-transparent text-sm outline-none px-2"
						/>
						<button type="submit" class="text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
							{t('Subscribe')}
						</button>
					</div>
				</form>

				<div class="mt-12 pt-12 border-t border-gray-200">
					<p class="text-xs text-gray-500">{t('We respect your inbox. Unsubscribe anytime.')}</p>
				</div>
			</div>
		</section>
	{/if}
</div>
