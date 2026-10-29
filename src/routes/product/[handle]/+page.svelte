<script lang="ts">
	import { t, l, getLocale } from '#lib/i18n/index.js';
	import { page } from '$app/state';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { addToCart } from 'sveltekit-medusa-sdk/cart';
	import { getProductQuery, getProductsQuery } from '#lib/medusa/catalog.remote.js';
	import {
		toCatalogProduct,
		findVariant,
		isAvailable,
		formatPrice,
		mediaForSelection,
		previewMedia,
		PRODUCT_FIELDS
	} from '#lib/medusa/catalog.js';
	import { safe } from '#lib/medusa/safe.js';
	import { site, photos } from '#lib/site.js';
	import { dev } from '$app/env';
	import ProductMedia from '#lib/components/ProductMedia.svelte';
	import SizeChartModal from '#lib/components/SizeChartModal.svelte';
	import StockBadge from '#lib/components/StockBadge.svelte';
	import WishlistButton from '#lib/components/WishlistButton.svelte';
	import StarRating from '#lib/components/reviews/StarRating.svelte';
	import ProductReviews from '#lib/components/reviews/ProductReviews.svelte';
	import { getProductReviewStats } from '#lib/medusa/reviews.remote.js';
	import { formatAverage, type ReviewStats } from '#lib/medusa/reviews.js';
	import * as ProductParts from '#lib/components/ui/product/index.js';
	import { Metadata } from '#lib/components/ui/seo/index.js';

	// Live product from Medusa, looked up by its handle (`/product/{handle}`). `raw` is the
	// untouched Medusa product, kept for the SEO structured data.
	const result = $derived(
		await safe(async () => {
			const handle = page.params.handle ?? '';
			const [raw, list] = await Promise.all([
				getProductQuery({ slug: handle, fields: PRODUCT_FIELDS }),
				getProductsQuery({ limit: 4, fields: PRODUCT_FIELDS })
			]);
			// Average rating (from the reviews plugin). A hiccup there must not take the product page down.
			const stats = raw ? (await safe(() => getProductReviewStats({ productId: raw.id }))).data : null;
			return {
				raw,
				product: raw ? toCatalogProduct(raw) : null,
				others: list.products.map(toCatalogProduct),
				stats
			};
		})
	);

	let product = $derived(result.data?.product ?? null);
	// The rating loaded with the page, replaced by a fresh one after a review is saved here.
	let freshStats = $state<{ productId: string; value: ReviewStats | null } | null>(null);
	const stats = $derived(
		freshStats && freshStats.productId === product?.id ? freshStats.value : (result.data?.stats ?? null)
	);
	async function refreshStats() {
		if (!product) return;
		const lookup = getProductReviewStats({ productId: product.id });
		await lookup.refresh();
		freshStats = { productId: product.id, value: await lookup };
	}
	let relatedProducts = $derived(
		(result.data?.others ?? []).filter((p) => p.id !== product?.id).slice(0, 2)
	);

	// Text the shop owner writes in Medusa: Products → the product → Metadata (keys: story, coverage, support,
	// best_for, style_note, fit_note, composition, sustainability, care). Sections with nothing written are hidden.
	const metadata = $derived((result.data?.raw?.metadata ?? {}) as Record<string, unknown>);
	// A product's extra texts live in Medusa metadata, which Medusa does not translate: in another language
	// a text is read from `<key>_<language>` (e.g. `care_el`) and falls back to the plain key.
	const meta = (key: string) => {
		const value = metadata[`${key}_${getLocale()}`] || metadata[key];
		return typeof value === 'string' ? value.trim() : '';
	};
	const story = $derived(meta('story'));
	const fitNote = $derived(meta('fit_note'));
	const fitFacts = $derived(
		[
			{ label: t('Coverage'), value: meta('coverage') },
			{ label: t('Support'), value: meta('support') },
			{ label: t('Best For'), value: meta('best_for') },
			{ label: t('Style Note'), value: meta('style_note') }
		].filter((fact) => fact.value)
	);
	const hasSilhouette = $derived(fitFacts.length > 0);
	const materialSections = $derived(
		[
			// "Material" is a standard product field in the Medusa admin (the Attributes box).
			{ key: 'composition', title: t('Composition'), body: meta('composition') || (result.data?.raw?.material ?? '').trim() },
			{ key: 'sustainability', title: t('Sustainability'), body: meta('sustainability') },
			{ key: 'care', title: t('Care Instructions'), body: meta('care') }
		].filter((section) => section.body)
	);
	const detailImage = $derived(product?.images[1] ?? photos.detail);
	// Opens the contact form on "Sizing & fit", mentioning this piece.
	const contactHref = $derived(product ? `/contact?topic=sizing&product=${encodeURIComponent(product.name)}` : '/contact?topic=sizing');

	let selectedColor = $state(0);
	let selectedSize = $state('');
	let quantity = $state(1);
	let activeTab = $state<'silhouette' | 'fit'>('silhouette');
	const fitTab = $derived(hasSilhouette ? activeTab : 'fit');
	let openAccordion = $state<string | null>(null);
	let showCTABar = $state(false);
	let sizeChartOpen = $state(false);

	// Reset the choices when navigating from one product to another (the component is reused).
	$effect(() => {
		void page.params.handle;
		// Opens on the color that was showing on the shop card (/product/handle?color=Gold), else the first.
		const wanted = page.url.searchParams.get('color');
		const index = product?.colors.findIndex((c) => c.name === wanted) ?? -1;
		selectedColor = index > 0 ? index : 0;
		selectedSize = '';
		quantity = 1;
		cartMessage = null;
	});

	$effect(() => {
		const handleScroll = () => {
			showCTABar = window.scrollY > 600;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const activeColor = $derived(product?.colors[selectedColor] ?? null);

	// Gallery: the product's videos and photos from Medusa (videos first), or one quiet tile while it has none.
	// Shown for the choice made below: only the pictures of the chosen color (and, once a size is picked too, of
	// that exact variant), after the product's videos. A product whose variants have no pictures yet shows them all.
	const slides = $derived.by(() => {
		const media = product ? mediaForSelection(product, activeColor?.name, selectedVariant) : [];
		return media.length ? media.map((src) => ({ src })) : [{ src: null }];
	});
	// Changes only when the set of pictures does, so the gallery restarts at its first picture on a color change.
	const galleryKey = $derived(slides.map((s) => s.src ?? '').join('|'));

	// The variant that matches the chosen color + size (size only counts once one is picked).
	const selectedVariant = $derived(
		product
			? findVariant(product, activeColor?.name ?? null, product.sizes.length ? selectedSize || null : null)
			: undefined
	);

	// Cheapest variant price until a full selection narrows it down.
	const displayPrice = $derived(selectedVariant?.price ?? product?.price ?? null);

	// Stock messaging, from real inventory. `maxQuantity` is null when stock isn't tracked.
	const stock = $derived.by(() => {
		if (!product) return { status: 'in-stock' as const, quantity: undefined };
		const scope = product.variants.filter(
			(v) =>
				(!activeColor || v.color === activeColor.name) && (!selectedSize || v.size === selectedSize)
		);
		if (scope.length === 0 || scope.every((v) => !v.inStock))
			return { status: 'out-of-stock' as const, quantity: undefined };
		const left = selectedVariant?.maxQuantity;
		if (left != null && left > 0 && left <= 5) return { status: 'low-stock' as const, quantity: left };
		return { status: 'in-stock' as const, quantity: undefined };
	});

	const quantityOptions = $derived.by(() => {
		const cap = selectedVariant?.maxQuantity;
		const max = cap == null ? 5 : Math.max(1, Math.min(5, cap));
		return Array.from({ length: max }, (_, i) => i + 1);
	});

	$effect(() => {
		if (!quantityOptions.includes(quantity)) quantity = quantityOptions.at(-1) ?? 1;
	});

	let adding = $state(false);
	let cartMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function handleAddToCart() {
		if (!product || adding) return;
		if (product.sizes.length && !selectedSize) {
			cartMessage = { type: 'error', text: t('Please select a size.') };
			return;
		}
		if (!selectedVariant) {
			cartMessage = { type: 'error', text: t('This combination is not available.') };
			return;
		}
		if (!selectedVariant.inStock) {
			cartMessage = { type: 'error', text: t('Sorry, this piece is sold out.') };
			return;
		}
		adding = true;
		cartMessage = null;
		try {
			await addToCart({ variant_id: selectedVariant.id, quantity });
			cartMessage = { type: 'success', text: t('Added to your selection.') };
		} catch (e) {
			const err = e as { body?: { message?: string }; message?: string };
			cartMessage = {
				type: 'error',
				text: err?.body?.message ?? err?.message ?? t('Could not add this piece. Please try again.')
			};
		} finally {
			adding = false;
		}
	}

	function toggleAccordion(section: string) {
		openAccordion = openAccordion === section ? null : section;
	}

</script>

{#if result.error}
	<div class="max-w-7xl mx-auto px-4 py-16 mt-16 md:mt-20 text-center">
		<h1 class="text-2xl mb-4">{t('This piece is unavailable right now')}</h1>
		<p class="text-sm text-gray-600 mb-6">{dev ? result.error : t('Please try again in a moment.')}</p>
		<a href={l('/shop')} class="underline">{t('Return to Shop')}</a>
	</div>
{:else if !product}
	<div class="max-w-7xl mx-auto px-4 py-16 mt-16 md:mt-20 text-center">
		<h1 class="text-2xl mb-4">{t('Product Not Found')}</h1>
		<a href={l('/shop')} class="underline">{t('Return to Shop')}</a>
	</div>
{:else}
	<Metadata
		config={{
			title: product.name,
			description: product.description || undefined,
			image: product.images[0],
			ogType: 'product'
		}}
	/>
	<!-- Structured data (schema.org/Product) for search engines; renders nothing visible. -->
	<ProductParts.Root product={result.data?.raw}>
		<!-- The star rating is added only when real approved reviews exist. -->
		<ProductParts.JsonLd
			override={stats
				? {
						aggregateRating: {
							'@type': 'AggregateRating',
							ratingValue: Math.round(stats.average * 10) / 10,
							reviewCount: stats.count,
							bestRating: 5
						}
					}
				: undefined}
		/>
	</ProductParts.Root>

	<div class="bg-white">
		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-6">
			<a href={l('/shop')} class="inline-flex items-center space-x-2 text-sm hover:opacity-70 transition-opacity">
				<ChevronLeft class="w-4 h-4" />
				<span>{t('Back to Collection')}</span>
			</a>
		</div>

		<!-- 1. The "Power" Hero - Split Screen 60/40 -->
		<section class="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 pb-8 md:pb-16">
			<div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
				<div class="lg:col-span-3">
					<!-- Re-created when the color changes, so the gallery starts again at its first picture. -->
					{#key galleryKey}
					<div class="lg:hidden">
						<div class="relative">
							<div class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
								{#each slides as slide, i (i)}
									<div class="flex-shrink-0 w-[80vw] aspect-[3/4] bg-gray-100 border border-gray-300 relative overflow-hidden snap-center rounded-sm">
										<ProductMedia src={slide.src} poster={product.images[0]} controls alt={product.name} />
									</div>
								{/each}
							</div>

							<div class="flex justify-center gap-1.5 mt-4">
								{#each Array.from({ length: slides.length }, (_, n) => n) as i (i)}
									<div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
								{/each}
							</div>
						</div>
					</div>

					<div class="hidden lg:block space-y-4">
						{#each slides as slide, i (i)}
							<div class="aspect-[3/4] bg-gray-100 border border-gray-300 relative overflow-hidden">
								<ProductMedia src={slide.src} poster={product.images[0]} controls alt={product.name} />
							</div>
						{/each}
					</div>
					{/key}
				</div>

				<div class="lg:col-span-2">
					<div class="lg:sticky lg:top-24 space-y-8">
						<div>
							<div class="flex items-start justify-between mb-4">
								<h1 class="text-4xl md:text-5xl font-serif tracking-tight leading-tight">
									{product.name}
								</h1>
								{#if stock.status !== 'in-stock'}
									<span class="border border-gray-900 px-3 py-1 text-xs tracking-wider whitespace-nowrap ml-4">
										{stock.status === 'out-of-stock' ? t('SOLD OUT') : t('LIMITED')}
									</span>
								{/if}
							</div>
							{#if product.category}
								<p class="text-sm text-gray-500 mb-4">{product.category}</p>
							{/if}

							{#if stats}
								<a href="#reviews" class="mb-4 inline-flex items-center gap-2 transition-opacity hover:opacity-70">
									<StarRating value={stats.average} size="sm" />
									<span class="text-sm text-gray-600">
										{formatAverage(stats.average)} · {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
									</span>
								</a>
							{/if}

							<div class="mb-4">
								<StockBadge status={stock.status} quantity={stock.quantity} />
							</div>

							<p class="text-3xl">{formatPrice(displayPrice, product.currency)}</p>
						</div>

						{#if product.description}
							<p class="text-sm text-gray-700 leading-relaxed">{product.description}</p>
						{/if}

						{#if product.colors.length > 0}
							<div>
								<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">
									{t('Color — {name}', { name: activeColor?.name })}
								</h3>
								<div class="flex space-x-3">
									{#each product.colors as color, idx (idx)}
										<button
											onclick={() => (selectedColor = idx)}
											class="w-12 h-12 rounded-full border-2 transition-all hover:scale-110 {selectedColor ===
											idx
												? 'border-gray-900 ring-2 ring-gray-300'
												: 'border-gray-300'}"
											style="background-color: {color.hex}"
											title={color.name}
										></button>
									{/each}
								</div>
							</div>
						{/if}

						{#if product.sizes.length > 0}
							<div>
								<div class="flex items-center justify-between mb-4">
									<h3 class="text-xs tracking-[0.2em] uppercase text-gray-900">
										{t('Size')}{selectedSize ? ` — ${selectedSize}` : ''}
									</h3>
									<button
										onclick={() => (sizeChartOpen = true)}
										class="text-xs underline hover:opacity-70 transition-opacity"
									>
										{t('Size Guide')}
									</button>
								</div>
								<div class="grid grid-cols-5 gap-2">
									{#each product.sizes as size (size)}
										{@const available = isAvailable(product, activeColor?.name ?? null, size)}
										<button
											onclick={() => (selectedSize = size)}
											title={available ? undefined : t('Sold out in this color')}
											class="py-3 text-sm tracking-wider border-2 transition-all {selectedSize === size
												? 'border-gray-900 bg-gray-900 text-white'
												: 'border-gray-300 hover:border-gray-900'} {available
												? ''
												: 'text-gray-400 line-through'}"
										>
											{size}
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<div>
							<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Quantity')}</h3>
							<select
								bind:value={quantity}
								class="w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none hover:border-gray-900 transition-colors"
							>
								{#each quantityOptions as num (num)}
									<option value={num}>{num}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-3">
							<button
								onclick={handleAddToCart}
								disabled={adding || stock.status === 'out-of-stock'}
								class="w-full bg-gray-900 text-white py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{adding ? t('Adding…') : stock.status === 'out-of-stock' ? t('Sold Out') : t('Secure This Design')}
							</button>
							{#if cartMessage}
								<p
									role={cartMessage.type === 'error' ? 'alert' : 'status'}
									class="text-sm text-center {cartMessage.type === 'error' ? 'text-red-700' : 'text-gray-700'}"
								>
									{cartMessage.text}
									{#if cartMessage.type === 'success'}
										<a href={l('/cart')} class="underline ml-1">{t('View selection')}</a>
									{/if}
								</p>
							{/if}
						</div>

						<div class="flex justify-center">
							<WishlistButton productId={product.id} size="md" variant="text" class="text-xs" />
						</div>

						{#if fitNote}
							<p class="text-xs text-center text-gray-500">{fitNote}</p>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- 2. Detail band: a photo and, when one is written in Medusa (product metadata "story"), the story of the piece -->
		<section class="relative my-16 overflow-hidden bg-gray-900 py-32">
			<img
				src={detailImage}
				alt=""
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover object-[50%_60%] opacity-50"
			/>

			<div class="relative z-10 max-w-3xl mx-auto px-8 text-center text-white">
				<h2 class="text-4xl md:text-5xl font-serif italic leading-tight">{t('In the Details')}</h2>
				{#if story}
					<p class="mt-8 text-xl leading-relaxed whitespace-pre-line">{story}</p>
				{/if}
			</div>
		</section>

		<!-- 3. Fit: what is written about this cut in Medusa (product metadata), and the size chart -->
		<section class="max-w-4xl mx-auto px-8 md:px-16 py-24">
			<h2 class="text-3xl md:text-4xl tracking-wide mb-12 text-center">{t('Perfect Fit Concierge')}</h2>

			{#if hasSilhouette}
				<div class="flex border-b-2 border-gray-200 mb-8">
					<button
						onclick={() => (activeTab = 'silhouette')}
						class="flex-1 pb-4 text-sm tracking-[0.2em] uppercase transition-all {fitTab === 'silhouette'
							? 'border-b-2 border-gray-900 -mb-0.5 font-medium'
							: 'text-gray-500 hover:text-gray-900'}"
					>
						{t('The Silhouette')}
					</button>
					<button
						onclick={() => (activeTab = 'fit')}
						class="flex-1 pb-4 text-sm tracking-[0.2em] uppercase transition-all {fitTab === 'fit'
							? 'border-b-2 border-gray-900 -mb-0.5 font-medium'
							: 'text-gray-500 hover:text-gray-900'}"
					>
						{t('The Fit Guide')}
					</button>
				</div>
			{/if}

			<div class="bg-gray-50 border border-gray-200 p-8">
				{#if fitTab === 'silhouette'}
					<div class="space-y-6">
						<h3 class="text-xl tracking-wide">{t('About This Cut')}</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							{#each fitFacts as fact (fact.label)}
								<div>
									<h4 class="text-xs tracking-[0.2em] uppercase mb-2 text-gray-900">{fact.label}</h4>
									<p class="text-sm text-gray-600">{fact.value}</p>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="space-y-6">
						<h3 class="text-xl tracking-wide">{t('Find Your Perfect Size')}</h3>
						<p class="text-sm text-gray-700 leading-relaxed">
							{fitNote || t('Between sizes, or not sure? Write to us and we’ll help you choose.')}
						</p>

						{#if site.sizeChart.length}
							<div class="overflow-x-auto">
								<table class="w-full text-sm border border-gray-200">
									<thead class="bg-gray-100">
										<tr>
											<th class="border border-gray-200 px-4 py-3 text-left text-xs tracking-[0.2em] uppercase">{t('Size')}</th>
											<th class="border border-gray-200 px-4 py-3 text-left text-xs tracking-[0.2em] uppercase">{t('Bust ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
											<th class="border border-gray-200 px-4 py-3 text-left text-xs tracking-[0.2em] uppercase">{t('Waist ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
											<th class="border border-gray-200 px-4 py-3 text-left text-xs tracking-[0.2em] uppercase">{t('Hips ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
										</tr>
									</thead>
									<tbody>
										{#each site.sizeChart as row (row.size)}
											<tr class="hover:bg-gray-50">
												<td class="border border-gray-200 px-4 py-3 font-medium">{row.size}</td>
												<td class="border border-gray-200 px-4 py-3">{row.bust}</td>
												<td class="border border-gray-200 px-4 py-3">{row.waist}</td>
												<td class="border border-gray-200 px-4 py-3">{row.hips}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}

						<p class="text-sm">
							<a href={l(contactHref)} class="underline hover:opacity-70 transition-opacity">{t('Ask us about sizing')}</a>
						</p>
					</div>
				{/if}
			</div>
		</section>

		{#if materialSections.length}
			<!-- 5. Materials & care: only what has been entered in Medusa for this product -->
			<section class="max-w-4xl mx-auto px-8 md:px-16 py-16 border-t border-gray-200">
				<h2 class="text-3xl md:text-4xl tracking-wide mb-12 text-center">{t('Materials & Care')}</h2>

				<div class="space-y-4">
					{#each materialSections as section (section.key)}
						<div class="border-2 border-gray-200">
							<button
								onclick={() => toggleAccordion(section.key)}
								aria-expanded={openAccordion === section.key}
								class="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
							>
								<span class="text-sm tracking-[0.2em] uppercase">{section.title}</span>
								<ChevronDown class="w-5 h-5 transition-transform {openAccordion === section.key ? 'rotate-180' : ''}" />
							</button>
							{#if openAccordion === section.key}
								<div class="px-6 pb-6 text-sm text-gray-700 leading-relaxed border-t border-gray-200 pt-6 whitespace-pre-line">{section.body}</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Reviews (product-reviews plugin in Medusa) -->
		<ProductReviews productId={product.id} {stats} onchange={refreshStats} />

		<!-- 6. The "Styled With" Upsell -->
		{#if relatedProducts.length > 0}
			<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-24 border-t-2 border-gray-900">
				<h2 class="text-3xl md:text-4xl tracking-wide mb-12 text-center">{t('Styled With')}</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
					{#each relatedProducts as item (item.id)}
						<div class="group">
							<a href={l(`/product/${item.handle}`)} class="block mb-6">
								<div class="aspect-[4/5] bg-gray-100 border border-gray-200 relative overflow-hidden">
									<ProductMedia src={item.media[0]} poster={item.images[0]} alt={item.name} />
									<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
								</div>
							</a>

							<div class="space-y-4">
								<div>
									<a
										href={l(`/product/${item.handle}`)}
										class="text-xl tracking-wide hover:opacity-70 transition-opacity block"
									>
										{item.name}
									</a>
									<p class="text-sm text-gray-500 mt-2">{item.category}</p>
								</div>

								<p class="text-lg">{formatPrice(item.price, item.currency)}</p>

								<a
									href={l(`/product/${item.handle}`)}
									class="inline-block border-2 border-gray-900 px-6 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
								>
									{t('Complete the Look')}
								</a>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<SizeChartModal
			isOpen={sizeChartOpen}
			onClose={() => (sizeChartOpen = false)}
		/>

		<!-- 4. The "Bold Decision" Sticky CTA Bar -->
		{#if showCTABar}
			<div class="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t-2 border-gray-800">
				<div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
					<div class="flex items-center space-x-6">
						<div class="w-16 h-16 bg-gray-800 border border-gray-700 hidden md:block relative overflow-hidden">
							<ProductMedia src={previewMedia(product, selectedColor)} poster={product.images[0]} alt={product.name} class="" />
						</div>
						<div>
							<p class="text-sm tracking-wide">{product.name}</p>
							<p class="text-lg">{formatPrice(displayPrice, product.currency)}</p>
						</div>
					</div>

					<div class="flex items-center space-x-6">
						<div class="hidden md:block text-right">
							{#if cartMessage}
								<p class="text-xs {cartMessage.type === 'error' ? 'text-red-300' : 'text-gray-300'}">{cartMessage.text}</p>
							{:else if stock.status === 'low-stock'}
								<p class="text-xs text-gray-400">{t('Only {quantity} left', { quantity: stock.quantity })}</p>
							{/if}
						</div>
						<button
							onclick={handleAddToCart}
							disabled={adding || stock.status === 'out-of-stock'}
							class="bg-white text-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{adding ? t('Adding…') : stock.status === 'out-of-stock' ? t('Sold Out') : t('Secure This Design')}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
