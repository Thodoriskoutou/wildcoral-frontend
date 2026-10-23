<script lang="ts">
	import { t, l, localized } from '$lib/i18n';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';
	import Ruler from '@lucide/svelte/icons/ruler';
	import Truck from '@lucide/svelte/icons/truck';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getProductsQuery, getProductCategoriesQuery } from 'sveltekit-medusa-sdk';
	import { toCatalogProduct, formatPrice, previewMedia, PRODUCT_FIELDS, type CatalogProduct } from '$lib/medusa/catalog';
	import ProductMedia from '$lib/components/ProductMedia.svelte';
	import FilterChip from '$lib/components/FilterChip.svelte';
	import EmptyFilterState from '$lib/components/EmptyFilterState.svelte';
	import {
		applyFilters,
		filterOptions,
		filtersHref,
		parseFilters,
		countWith,
		activeFilterCount,
		cardColorIndex,
		SORTS,
		type Filters,
		type SortKey
	} from '$lib/medusa/filters';
	import { safe } from '$lib/medusa/safe';
	import { site, photos } from '$lib/site';
	import { dev } from '$app/env';
	import { Metadata } from '$lib/components/ui/seo';

	// Live catalog from Medusa. Awaiting inside `$derived` works because
	// `compilerOptions.experimental.async` is enabled in vite.config.ts. There is deliberately no
	// <svelte:boundary pending>: that would make the server render only the loading state.
	const catalog = $derived(
		await safe(async () => {
			const [productsResult, categoriesResult] = await Promise.all([
				getProductsQuery({ limit: 100, fields: PRODUCT_FIELDS }),
				getProductCategoriesQuery({ limit: 100 })
			]);
			const products = productsResult.products.map(toCatalogProduct);
			// Category filter options come from Medusa (in the admin's rank order), limited to
			// categories that actually contain products so a filter never leads to an empty page.
			const categories = categoriesResult.product_categories
				.slice()
				.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
				.filter((c) => products.some((p) => p.category === c.name))
				.map((c) => ({ name: c.name, handle: c.handle, description: c.description ?? '' }));
			return { products, categories };
		})
	);

	const products = $derived(catalog.data?.products ?? []);
	const categories = $derived(['all', ...(catalog.data?.categories ?? []).map((c) => c.name)]);

	// The URL is the source of truth for the selected category (`/shop?category=bikini-tops`), so
	// the menu and footer links, the filter drawer, and the browser's back button all agree.
	const selectedCategory = $derived(
		catalog.data?.categories.find((c) => c.handle === page.url.searchParams.get('category'))?.name ?? 'all'
	);

	// The intro under the heading: the category's own description from Medusa, else the shop-wide line.
	const intro = $derived(
		catalog.data?.categories.find((c) => c.name === selectedCategory)?.description?.trim() || localized(site.shopIntro)
	);
	const contactHref = '/contact';

	// Every filter lives in the URL (see filters.ts), so a filtered view can be shared and the back button works.
	const filters = $derived<Filters>({ category: selectedCategory, ...parseFilters(page.url.searchParams) });
	const options = $derived(filterOptions(products));
	const filteredProducts = $derived(applyFilters(products, filters));
	const filterCount = $derived(activeFilterCount(filters));
	const currency = $derived(products[0]?.currency ?? 'EUR');

	function setFilters(patch: Parameters<typeof filtersHref>[1]) {
		goto(filtersHref(page.url, patch), { replace: true, reset: false });
	}

	function selectCategory(name: string) {
		const handle = catalog.data?.categories.find((c) => c.name === name)?.handle ?? null;
		setFilters({ categoryHandle: handle });
	}

	function clearFilters() {
		setFilters({ categoryHandle: null, sizes: [], colors: [], styles: [], maxPrice: null, inStock: false });
	}

	const toggleValue = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

	// The chosen filters as removable chips under the toolbar.
	const chips = $derived([
		...(filters.category !== 'all' ? [{ key: 'category', label: filters.category, remove: () => selectCategory('all') }] : []),
		...filters.sizes.map((size) => ({ key: `size-${size}`, label: `Size ${size}`, remove: () => setFilters({ sizes: filters.sizes.filter((v) => v !== size) }) })),
		...filters.colors.map((color) => ({ key: `color-${color}`, label: color, remove: () => setFilters({ colors: filters.colors.filter((v) => v !== color) }) })),
		...filters.styles.map((style) => ({ key: `style-${style}`, label: style, remove: () => setFilters({ styles: filters.styles.filter((v) => v !== style) }) })),
		...(filters.maxPrice !== null ? [{ key: 'max', label: `Up to ${formatPrice(filters.maxPrice, currency)}`, remove: () => setFilters({ maxPrice: null }) }] : []),
		...(filters.inStock ? [{ key: 'stock', label: t('In stock'), remove: () => setFilters({ inStock: false }) }] : [])
	]);

	let showFilters = $state(false);
	// While the price slider is being dragged; the URL only changes when it is let go.
	let priceDraft = $state<number | null>(null);
	// Swatches on a card: hover previews a color, a click keeps it. With a color filter on, cards start on that color.
	let hoveredProductColors = $state<{ [key: string]: number }>({});
	let chosenColors = $state<{ [key: string]: number }>({});

	function getActiveColorIndex(product: CatalogProduct) {
		return hoveredProductColors[product.id] ?? chosenColors[product.id] ?? cardColorIndex(product, filters);
	}

	// The product page opens on the color that was showing on the card.
	function productHref(product: CatalogProduct, colorIndex: number) {
		const color = product.colors[colorIndex]?.name;
		return `/product/${product.handle}${color && product.colors.length > 1 ? `?color=${encodeURIComponent(color)}` : ''}`;
	}

	let completeTheLook = $derived(
		products.filter((p) => p.category !== selectedCategory).slice(0, 3)
	);

</script>

<Metadata
	config={{
		title: selectedCategory === 'all' ? t('Shop') : selectedCategory,
		description: intro
	}}
/>

<div class="bg-white">
	<!-- 1. Immersive Header (Category Identity) -->
	<section class="h-[40vh] min-h-[400px] border-b border-gray-200 flex items-center mt-16 md:mt-20">
		<div class="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 w-full">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
				<div>
					<h1 class="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-light tracking-tight">
						{selectedCategory === 'all' ? t('All Styles') : selectedCategory}
					</h1>
				</div>

				<div class="lg:border-l lg:border-gray-200 lg:pl-12">
					<p class="text-base md:text-lg leading-relaxed text-gray-700">{intro}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 2. The "Utility Belt" - Sticky: filter button, result count, sort, and the chosen filters -->
	<div class="sticky top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 py-4">
			<div class="grid grid-cols-[auto_1fr_auto] items-center gap-4">
				<button
					onclick={() => (showFilters = !showFilters)}
					aria-expanded={showFilters}
					class="flex items-center space-x-2 whitespace-nowrap text-xs tracking-wider uppercase transition-opacity hover:opacity-70 md:text-sm"
				>
					<SlidersHorizontal class="w-4 h-4" />
					<span>{t('Filter')}{filterCount ? ` (${filterCount})` : ''}</span>
				</button>

				<p class="text-sm text-gray-600 text-center" aria-live="polite">
					{t('Showing')} <span class="font-medium">{filteredProducts.length}</span>
					{filteredProducts.length === 1 ? t('Style') : t('Styles')}
				</p>

				<label class="flex min-w-0 items-center gap-2 text-sm tracking-wider uppercase">
					<span class="hidden md:inline">{t('Sort')}</span>
					<select
						value={filters.sort}
						onchange={(e) => setFilters({ sort: e.currentTarget.value as SortKey })}
						class="w-28 cursor-pointer truncate border-0 bg-transparent py-1 pl-0 pr-6 text-xs tracking-normal uppercase hover:opacity-70 focus:outline-none focus:ring-0 md:w-auto md:pr-8 md:text-sm md:tracking-wider"
					>
						{#each SORTS as option (option.key)}
							<option value={option.key}>{t(option.label)}</option>
						{/each}
					</select>
				</label>
			</div>

			{#if chips.length}
				<div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-100 pt-4">
					{#each chips as chip (chip.key)}
						<FilterChip label={chip.label} onRemove={chip.remove} />
					{/each}
					<button onclick={clearFilters} class="text-xs tracking-wider uppercase text-gray-500 underline transition-colors hover:text-gray-900">
						{t('Clear all')}
					</button>
				</div>
			{/if}
		</div>
	</div>

	{#if showFilters}
		<div class="fixed inset-0 bg-black/30 z-40" onclick={() => (showFilters = false)} role="presentation"></div>

		<div class="fixed top-0 left-0 z-50 flex h-full w-80 max-w-[90vw] flex-col bg-white shadow-2xl" role="dialog" aria-label={t('Filters')}>
			<div class="flex items-center justify-between border-b border-gray-200 px-8 py-6">
				<h2 class="text-xl tracking-wide">{t('Filters')}</h2>
				<button onclick={() => (showFilters = false)} class="hover:opacity-70 transition-opacity" aria-label={t('Close filters')}>
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto px-8 py-8">
				<div class="mb-8">
					<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Category')}</h3>
					<div class="space-y-3">
						{#each categories as cat (cat)}
							{@const n = countWith(products, filters, { category: cat })}
							<label class="group flex cursor-pointer items-center space-x-3 {n === 0 && selectedCategory !== cat ? 'opacity-40' : ''}">
								<input
									type="radio"
									name="category"
									checked={selectedCategory === cat}
									onchange={() => selectCategory(cat)}
									class="w-4 h-4 text-gray-900 accent-gray-900 focus:ring-gray-900"
								/>
								<span class="text-sm group-hover:opacity-70 transition-opacity">{cat === 'all' ? t('All Styles') : cat}</span>
								<span class="ml-auto text-xs text-gray-400">{n}</span>
							</label>
						{/each}
					</div>
				</div>

				{#if options.sizes.length}
					<div class="mb-8">
						<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Size')}</h3>
						<div class="grid grid-cols-5 gap-2">
							{#each options.sizes as size (size)}
								{@const on = filters.sizes.includes(size)}
								{@const n = countWith(products, filters, { sizes: [size] })}
								<button
									type="button"
									aria-pressed={on}
									disabled={n === 0 && !on}
									title="{n} {n === 1 ? 'style' : 'styles'}"
									onclick={() => setFilters({ sizes: toggleValue(filters.sizes, size) })}
									class="border py-2 text-sm transition-all disabled:cursor-not-allowed disabled:text-gray-300 disabled:line-through {on
										? 'border-gray-900 bg-gray-900 text-white'
										: 'border-gray-300 hover:border-gray-900'}"
								>
									{size}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if options.colors.length}
					<div class="mb-8">
						<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Color')}</h3>
						<div class="space-y-3">
							{#each options.colors as color (color.name)}
								{@const on = filters.colors.includes(color.name)}
								{@const n = countWith(products, filters, { colors: [color.name] })}
								<button
									type="button"
									aria-pressed={on}
									disabled={n === 0 && !on}
									onclick={() => setFilters({ colors: toggleValue(filters.colors, color.name) })}
									class="flex w-full items-center gap-3 text-left text-sm transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40 {on
										? 'font-medium'
										: ''}"
								>
									<span
										class="h-6 w-6 shrink-0 rounded-full border-2 {on ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300'}"
										style="background-color: {color.hex}"
									></span>
									<span>{color.name}</span>
									<span class="ml-auto text-xs text-gray-400">{n}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if options.styles.length}
					<div class="mb-8">
						<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Style')}</h3>
						<div class="space-y-3">
							{#each options.styles as style (style)}
								{@const on = filters.styles.includes(style)}
								{@const n = countWith(products, filters, { styles: [style] })}
								<label class="group flex cursor-pointer items-center space-x-3 {n === 0 && !on ? 'opacity-40' : ''}">
									<input
										type="checkbox"
										checked={on}
										disabled={n === 0 && !on}
										onchange={() => setFilters({ styles: toggleValue(filters.styles, style) })}
										class="w-4 h-4 text-gray-900 accent-gray-900 focus:ring-gray-900"
									/>
									<span class="text-sm capitalize group-hover:opacity-70 transition-opacity">{style}</span>
									<span class="ml-auto text-xs text-gray-400">{n}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				{#if options.price}
					<div class="mb-8">
						<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Price')}</h3>
						<label class="block">
							<span class="text-sm">{t('Up to {price}', { price: formatPrice(priceDraft ?? filters.maxPrice ?? options.price.max, currency) })}</span>
							<input
								type="range"
								min={options.price.min}
								max={options.price.max}
								step="1"
								value={priceDraft ?? filters.maxPrice ?? options.price.max}
								oninput={(e) => (priceDraft = Number(e.currentTarget.value))}
								onchange={(e) => {
									const value = Number(e.currentTarget.value);
									priceDraft = null;
									setFilters({ maxPrice: options.price && value >= options.price.max ? null : value });
								}}
								class="mt-3 w-full accent-gray-900"
							/>
						</label>
					</div>
				{/if}

				<div class="mb-8">
					<h3 class="text-xs tracking-[0.2em] uppercase mb-4 text-gray-900">{t('Availability')}</h3>
					<label class="group flex cursor-pointer items-center space-x-3">
						<input
							type="checkbox"
							checked={filters.inStock}
							onchange={(e) => setFilters({ inStock: e.currentTarget.checked })}
							class="w-4 h-4 text-gray-900 accent-gray-900 focus:ring-gray-900"
						/>
						<span class="text-sm group-hover:opacity-70 transition-opacity">{t('In stock only')}</span>
					</label>
				</div>
			</div>

			<div class="space-y-3 border-t border-gray-200 px-8 py-6">
				<button
					onclick={() => (showFilters = false)}
					class="w-full bg-gray-900 py-3 text-sm tracking-[0.2em] uppercase text-white transition-all hover:bg-gray-800"
				>
					{t('Show {count} style|Show {count} styles', { count: filteredProducts.length })}
				</button>
				<button
					onclick={clearFilters}
					disabled={filterCount === 0}
					class="w-full border-2 border-gray-900 py-3 text-sm tracking-[0.2em] uppercase transition-all hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300"
				>
					{t('Clear All Filters')}
				</button>
			</div>
		</div>
	{/if}

	<!-- 3. Asymmetrical "Focus" Grid (1-2-1 Pattern) -->
	<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-16">
		<div class="space-y-16">
			{#if catalog.error}
				<div class="text-center py-24">
					<p class="text-2xl font-serif mb-3">{t('The collection is unavailable')}</p>
					<p class="text-sm text-gray-600">
						{dev ? catalog.error : t('Please try again in a moment.')}
					</p>
				</div>
			{:else if filteredProducts.length === 0 && filterCount > 0}
				<EmptyFilterState message={t('No pieces match your selection')} onClear={clearFilters} />
			{:else if filteredProducts.length === 0}
				<div class="text-center py-24">
					<p class="text-2xl font-serif mb-3">{t('New pieces are on their way')}</p>
					<p class="text-sm text-gray-600">{t('Our collection is being prepared — please check back soon.')}</p>
				</div>
			{/if}
			{#each filteredProducts as product, index (product.id)}
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
												(hoveredProductColors = { ...hoveredProductColors, [product.id]: colorIdx })}
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
					{@const nextProduct = filteredProducts[index + 1]}
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

			<!-- 4. In-grid editorial break (after the 3rd product): a photo and one line -->
			{#if filteredProducts.length > 3}
				<div class="my-16 py-24 bg-gray-50 border-y border-gray-200">
					<div class="max-w-4xl mx-auto text-center px-8">
						<div class="relative aspect-[16/9] border border-gray-200 bg-gray-100 mb-8 overflow-hidden">
							<img
								src={photos.editorial}
								alt=""
								loading="lazy"
								class="absolute inset-0 h-full w-full object-cover object-[50%_72%]"
							/>
						</div>
						<p class="text-xl italic font-serif text-gray-700 leading-relaxed">{t('Made for long days by the water.')}</p>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- 5. Complete the Look (Cross-Sell) -->
	{#if completeTheLook.length > 0}
		<section class="border-t border-gray-200 bg-gray-50 py-24">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
				<div class="mb-12">
					<h2 class="text-3xl md:text-4xl tracking-wide mb-2">{t('Complete the Look')}</h2>
					<p class="text-sm text-gray-500">{t('Curated essentials to complement your style')}</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					{#each completeTheLook as product (product.id)}
						<a href={l(`/product/${product.handle}`)} class="group">
							<div class="aspect-[3/4] bg-white border border-gray-200 mb-4 relative overflow-hidden">
								<ProductMedia src={product.media[0]} poster={product.images[0]} alt={product.name} />
								<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</div>

							<div class="space-y-2">
								<h3 class="text-sm tracking-wide group-hover:opacity-70 transition-opacity">
									{product.name}
								</h3>
								<p class="text-sm text-gray-500">{product.category}</p>
								<p class="text-sm">{formatPrice(product.price, product.currency)}</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- 6. Help strip: size guide, delivery, contact -->
	<section class="border-t-2 border-gray-900 bg-white py-16">
		<div class="max-w-5xl mx-auto px-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
				<div class="space-y-4">
					<div class="w-16 h-16 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<Ruler class="w-7 h-7" strokeWidth={1.5} />
					</div>
					<h3 class="text-sm tracking-[0.2em] uppercase">{t('Find Your Size')}</h3>
					<p class="text-sm text-gray-600 leading-relaxed">
						{t('Not sure what fits? The size guide shows how to measure and which size to choose.')}
					</p>
					<a href={l('/customer-care')} class="inline-block text-xs tracking-wider uppercase underline hover:opacity-70 transition-opacity">
						{t('Size Guide')}
					</a>
				</div>

				<div class="space-y-4">
					<div class="w-16 h-16 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<Truck class="w-7 h-7" strokeWidth={1.5} />
					</div>
					<h3 class="text-sm tracking-[0.2em] uppercase">{t('Delivery')}</h3>
					<p class="text-sm text-gray-600 leading-relaxed">{localized(site.deliveryNote)}</p>
					<a href={l('/customer-care')} class="inline-block text-xs tracking-wider uppercase underline hover:opacity-70 transition-opacity">
						{t('Shipping & Returns')}
					</a>
				</div>

				<div class="space-y-4">
					<div class="w-16 h-16 border-2 border-gray-900 mx-auto flex items-center justify-center">
						<MessageCircle class="w-7 h-7" strokeWidth={1.5} />
					</div>
					<h3 class="text-sm tracking-[0.2em] uppercase">{t('Need Help?')}</h3>
					<p class="text-sm text-gray-600 leading-relaxed">
						{t('Questions about fit or your order? Write to us and we\'ll help.')}
					</p>
					<a href={l(contactHref)} class="inline-block text-xs tracking-wider uppercase underline hover:opacity-70 transition-opacity">
						{t('Contact Us')}
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
