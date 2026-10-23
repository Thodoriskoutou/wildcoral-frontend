<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { Metadata } from '#lib/components/ui/seo/index.js';
	import { page } from '$app/state';
	import { getProductsQuery } from '#lib/medusa/catalog.remote.js';
	import { toCatalogProduct, formatPrice, previewMedia, PRODUCT_FIELDS, type CatalogProduct } from '#lib/medusa/catalog.js';
	import { safe } from '#lib/medusa/safe.js';
	import ProductMedia from '#lib/components/ProductMedia.svelte';

	let searchTerm = $derived(page.url.searchParams.get('q') || '');
	let hoveredProductColors = $state<{ [key: string]: number }>({});
	let chosenColors = $state<{ [key: string]: number }>({});

	// Server-side search: Medusa matches the term against product titles and descriptions.
	// The "Curated for You" fallback shows the newest products when nothing matches.
	const results = $derived(
		await safe(async () => {
			const q = searchTerm.trim();
			const [found, curated] = await Promise.all([
				getProductsQuery({ q: q || undefined, limit: 50, fields: PRODUCT_FIELDS }),
				getProductsQuery({ limit: 4, order: '-created_at', fields: PRODUCT_FIELDS })
			]);
			return {
				found: found.products.map(toCatalogProduct),
				curated: curated.products.map(toCatalogProduct)
			};
		})
	);

	let searchResults = $derived(results.data?.found ?? []);
	const topSelling = $derived(results.data?.curated ?? []);

	// Hover previews a color on a card, a click keeps it; the product page then opens on that color.
	function getActiveColorIndex(product: CatalogProduct) {
		return hoveredProductColors[product.id] ?? chosenColors[product.id] ?? 0;
	}

	function productHref(product: CatalogProduct, colorIndex: number) {
		const color = product.colors[colorIndex]?.name;
		return '/product/' + product.handle + (color && product.colors.length > 1 ? '?color=' + encodeURIComponent(color) : '');
	}
</script>

<Metadata config={{ title: searchTerm ? t('Search: {term}', { term: searchTerm }) : t('Search'), noindex: true }} />

{#if searchResults.length === 0}
	<div class="bg-white min-h-screen">
		<div class="border-b border-gray-200 py-16">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
				<h1 class="text-5xl md:text-6xl font-serif mb-4">{t('No results for \'{searchTerm}\'', { searchTerm })}</h1>
				<p class="text-lg text-gray-600">{t('Try adjusting your search or browse our curated selection')}</p>
			</div>
		</div>

		<div class="h-32"></div>

		<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
			<h2 class="text-3xl font-serif mb-12">{t('Curated for You')}</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each topSelling as product (product.id)}
					<a href={l(`/product/${product.handle}`)} class="group">
						<div class="aspect-[3/4] bg-gray-100 border border-gray-200 mb-4 relative overflow-hidden">
							<ProductMedia src={product.media[0]} poster={product.images[0]} alt={product.name} />
							<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
						</div>

						<div class="space-y-2">
							<h3 class="text-sm tracking-wide group-hover:opacity-70 transition-opacity">
								{product.name}
							</h3>
							<div class="flex items-center space-x-2">
								{#each product.colors.slice(0, 3) as color, idx (idx)}
									<div
										class="w-4 h-4 border border-gray-300 rounded-full"
										style="background-color: {color.hex}"
										title={color.name}
									></div>
								{/each}
							</div>
							<p class="text-sm">{formatPrice(product.price, product.currency)}</p>
						</div>
					</a>
				{/each}
			</div>

			<div class="text-center mt-16">
				<a
					href={l('/shop')}
					class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
				>
					{t('View Full Collection')}
				</a>
			</div>
		</section>
	</div>
{:else}
	<div class="bg-white min-h-screen">
		<div class="border-b border-gray-200 py-16">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
				<h1 class="text-5xl md:text-6xl font-serif mb-4">{t('Results for \'{searchTerm}\'', { searchTerm })}</h1>
				<p class="text-lg text-gray-600">{t('{count} item found|{count} items found', { count: searchResults.length })}</p>
			</div>
		</div>

		<div class="h-32"></div>

		<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
			<div class="space-y-16">
				{#each searchResults as product, index (product.id)}
					{@const patternIndex = index % 4}
					{@const activeColorIndex = getActiveColorIndex(product)}

					{#if patternIndex === 0}
						<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
							<a
								href={l(productHref(product, activeColorIndex))}
								class="lg:col-span-3 aspect-[3/4] bg-gray-100 border border-gray-200 relative group overflow-hidden"
							>
								<ProductMedia src={previewMedia(product, activeColorIndex)} poster={product.images[0]} alt={product.name} />
								<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</a>

							<div class="lg:col-span-2 flex flex-col justify-center space-y-6">
								<div>
									<a
										href={l(productHref(product, activeColorIndex))}
										class="text-2xl md:text-3xl tracking-wide hover:opacity-70 transition-opacity"
									>
										{product.name}
									</a>
									<p class="text-sm text-gray-500 mt-2">{product.category}</p>
								</div>

								<p class="text-xl">{formatPrice(product.price, product.currency)}</p>

								<div>
									<p class="text-xs tracking-[0.2em] uppercase mb-3 text-gray-600">{t('Available Colors')}</p>
									<div class="flex space-x-3">
										{#each product.colors as color, colorIdx (colorIdx)}
											<button
												onmouseenter={() =>
													(hoveredProductColors = {
														...hoveredProductColors,
														[product.id]: colorIdx
													})}
												onmouseleave={() => {
													const updated = { ...hoveredProductColors };
													delete updated[product.id];
													hoveredProductColors = updated;
												}}
												class="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 {activeColorIndex ===
												colorIdx
													? 'border-gray-900 ring-2 ring-gray-300'
													: 'border-gray-300'}"
												style="background-color: {color.hex}"
												onclick={() => (chosenColors = { ...chosenColors, [product.id]: colorIdx })}
										title={color.name}
											></button>
										{/each}
									</div>
								</div>

								<p class="text-sm text-gray-600 leading-relaxed">{product.description}</p>

								<a
									href={l(productHref(product, activeColorIndex))}
									class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase text-center hover:bg-gray-900 hover:text-white transition-all w-fit"
								>
									{t('View Details')}
								</a>
							</div>
						</div>
					{:else if patternIndex === 1}
						{@const nextProduct = searchResults[index + 1]}
						{#if nextProduct}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
								{#each [product, nextProduct] as prod (prod.id)}
									{@const prodActiveColorIndex = getActiveColorIndex(prod)}
									<div>
										<a
											href={l(productHref(prod, prodActiveColorIndex))}
											class="block aspect-[3/4] bg-gray-100 border border-gray-200 mb-4 relative group overflow-hidden"
										>
											<ProductMedia src={previewMedia(prod, prodActiveColorIndex)} poster={prod.images[0]} alt={prod.name} />
											<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
										</a>

										<div class="space-y-3">
											<a
												href={l(productHref(prod, prodActiveColorIndex))}
												class="text-lg tracking-wide hover:opacity-70 transition-opacity block"
											>
												{prod.name}
											</a>

											<div class="flex space-x-2">
												{#each prod.colors as color, colorIdx (colorIdx)}
													<button
														onmouseenter={() =>
															(hoveredProductColors = {
																...hoveredProductColors,
																[prod.id]: colorIdx
															})}
														onmouseleave={() => {
															const updated = { ...hoveredProductColors };
															delete updated[prod.id];
															hoveredProductColors = updated;
														}}
														class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 {prodActiveColorIndex ===
														colorIdx
															? 'border-gray-900'
															: 'border-gray-300'}"
														style="background-color: {color.hex}"
														onclick={() => (chosenColors = { ...chosenColors, [prod.id]: colorIdx })}
										title={color.name}
													></button>
												{/each}
											</div>

											<p class="text-sm">{formatPrice(prod.price, prod.currency)}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{:else if patternIndex === 3}
						<div class="max-w-2xl mx-auto">
							<a
								href={l(productHref(product, activeColorIndex))}
								class="block aspect-[3/4] bg-gray-100 border border-gray-200 mb-4 relative group overflow-hidden"
							>
								<ProductMedia src={previewMedia(product, activeColorIndex)} poster={product.images[0]} alt={product.name} />
								<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</a>

							<div class="text-center space-y-3">
								<a
									href={l(productHref(product, activeColorIndex))}
									class="text-xl tracking-wide hover:opacity-70 transition-opacity block"
								>
									{product.name}
								</a>

								<div class="flex space-x-2 justify-center">
									{#each product.colors as color, colorIdx (colorIdx)}
										<button
											onmouseenter={() =>
												(hoveredProductColors = { ...hoveredProductColors, [product.id]: colorIdx })}
											onmouseleave={() => {
												const updated = { ...hoveredProductColors };
												delete updated[product.id];
												hoveredProductColors = updated;
											}}
											class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 {activeColorIndex ===
											colorIdx
												? 'border-gray-900'
												: 'border-gray-300'}"
											style="background-color: {color.hex}"
											onclick={() => (chosenColors = { ...chosenColors, [product.id]: colorIdx })}
										title={color.name}
										></button>
									{/each}
								</div>

								<p class="text-sm">{formatPrice(product.price, product.currency)}</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</section>
	</div>
{/if}
