<script lang="ts">
	import { t, l } from '$lib/i18n';
	import { page } from '$app/state';
	import { getProductQuery, getProductsQuery } from 'sveltekit-medusa-sdk';
	import { Metadata } from '$lib/components/ui/seo';
	import { toPost, listJournalItems, readJournalItem } from '$lib/medusa/journal';
	import { toCatalogProduct, formatPrice, PRODUCT_FIELDS } from '$lib/medusa/catalog';
	import { safe } from '$lib/medusa/safe';
	import { site } from '$lib/site';
	import { dev } from '$app/env';
	import ProductMedia from '$lib/components/ProductMedia.svelte';

	// The post (as sanitized HTML, rendered by the content plugin), the other posts for "Continue
	// Reading", and the products for "Shop the Story": the ones the post lists in its `products`
	// field, otherwise the newest three.
	const result = $derived(
		await safe(async () => {
			const itemSlug = page.params.slug ?? '';
			const [item, list] = await Promise.all([
				readJournalItem(itemSlug, 'html'),
				listJournalItems(50)
			]);
			const post = toPost(item.content_item);
			const others = list
				.map(toPost)
				.filter((p) => p.id !== post.id)
				.sort((a, b) => b.time - a.time)
				.slice(0, 2);

			const chosen = post.productHandles.length
				? (await Promise.all(post.productHandles.map((slug) => getProductQuery({ slug, fields: PRODUCT_FIELDS }))))
						.filter((p) => p !== null)
						.map(toCatalogProduct)
				: [];
			const products = chosen.length
				? chosen
				: (await getProductsQuery({ limit: 3, order: '-created_at', fields: PRODUCT_FIELDS })).products.map(toCatalogProduct);

			return { post, others, products };
		})
	);

	const post = $derived(result.data?.post ?? null);
</script>

{#if post}
	<Metadata
		config={{
			title: post.title,
			description: post.excerpt || undefined,
			image: post.cover ?? undefined,
			ogType: 'article'
		}}
	/>

	<div class="bg-white">
		<div class="max-w-4xl mx-auto px-8 pt-8">
			<a href={l('/journal')} class="text-sm text-gray-500 hover:text-gray-900 transition-colors">
				{t('← Back to Journal')}
			</a>
		</div>

		<div class="h-32"></div>

		<article class="max-w-3xl mx-auto px-8">
			<div class="text-center mb-12">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4 block">
					{post.category}
				</span>
				<h1 class="text-5xl md:text-6xl font-serif mb-8 leading-tight">{post.title}</h1>
				<div class="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
					{#if post.author}
						<span>{post.author.name}</span>
						<span>•</span>
					{/if}
					{#if post.date}
						<span>{post.date}</span>
						<span>•</span>
					{/if}
					<span>{t('{readMinutes} min read', { readMinutes: post.readMinutes })}</span>
				</div>
			</div>

			{#if post.cover}
				<div class="aspect-[16/9] bg-gray-100 border border-gray-200 mb-16 relative overflow-hidden">
					<img
						src={post.cover}
						alt={post.title}
						fetchpriority="high"
						class="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
					/>
				</div>
			{/if}

			<!-- The plugin returns sanitized HTML (rendered from the post's Markdown). -->
			<div
				class="prose prose-lg max-w-[750px] mx-auto text-gray-700 prose-headings:font-serif prose-headings:font-normal prose-headings:text-gray-900 prose-a:text-gray-900 prose-blockquote:border-gray-900 prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-gray-900 prose-img:w-full"
			>
				{#if post.bodyHtml}
					{@html post.bodyHtml}
				{:else}
					<p class="whitespace-pre-line">{post.body}</p>
				{/if}
			</div>

			{#if post.tags.length > 0}
				<div class="max-w-[750px] mx-auto mt-16 flex flex-wrap gap-3">
					{#each post.tags as tag (tag)}
						<span class="text-xs tracking-[0.2em] uppercase border border-gray-300 px-3 py-1 text-gray-600">{tag}</span>
					{/each}
				</div>
			{/if}

			<div class="h-32"></div>

			{#if post.author}
				<div class="border-t border-gray-200 pt-12 pb-16">
					<div class="flex gap-6">
						{#if post.author.avatar}
							<img
								src={post.author.avatar}
								alt={post.author.name}
								loading="lazy"
								class="w-24 h-24 rounded-full object-cover flex-shrink-0 border border-gray-200"
							/>
						{/if}
						<div>
							<h3 class="text-lg font-serif mb-2">{post.author.name}</h3>
							{#if post.author.bio}
								<p class="text-sm text-gray-600 leading-relaxed">{t(post.author.bio)}</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</article>

		<div class="h-32"></div>

		{#if (result.data?.products.length ?? 0) > 0}
			<section class="border-t-2 border-gray-900 py-32 bg-gray-50">
				<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
					<div class="text-center mb-16">
						<h2 class="text-4xl md:text-5xl font-serif">{t('Shop the Story')}</h2>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
						{#each result.data?.products ?? [] as product (product.id)}
							<a href={l(`/product/${product.handle}`)} class="group">
								<div class="aspect-[3/4] bg-white border border-gray-200 mb-4 relative overflow-hidden">
									<ProductMedia src={product.media[0]} poster={product.images[0]} alt={product.name} />
									<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
								</div>

								<div class="space-y-2">
									<h3 class="text-lg tracking-wide group-hover:opacity-70 transition-opacity">
										{product.name}
									</h3>
									<div class="flex items-center space-x-2">
										{#each product.colors.slice(0, 3) as color, idx (idx)}
											<div
												class="w-5 h-5 border border-gray-300 rounded-full"
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
				</div>
			</section>
		{/if}

		{#if (result.data?.others.length ?? 0) > 0}
			<div class="h-32"></div>

			<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
				<h2 class="text-3xl font-serif mb-12">{t('Continue Reading')}</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
					{#each result.data?.others ?? [] as other (other.id)}
						<a href={l(`/journal/${other.slug}`)} class="group">
							<div class="aspect-video bg-gray-100 border border-gray-200 mb-4 relative overflow-hidden">
								{#if other.cover}
									<img
										src={other.cover}
										alt={other.title}
										loading="lazy"
										class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								{:else}
									<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
										<p class="text-center px-8 font-serif italic text-gray-400">{other.title}</p>
									</div>
								{/if}
							</div>
							<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-2">
								{other.category}
							</span>
							<h3 class="text-xl font-serif group-hover:opacity-70 transition-opacity">
								{other.title}
							</h3>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</div>
{:else}
	<Metadata config={{ title: t('Story not found'), noindex: true }} />

	<div class="bg-white min-h-[70vh] flex items-center justify-center px-8">
		<div class="max-w-xl text-center">
			<h1 class="text-4xl font-serif mb-6">{t('We couldn\'t find that story')}</h1>
			<p class="text-gray-600 leading-relaxed mb-8">{t('It may have moved or isn\'t published yet.')}</p>
			<a
				href={l('/journal')}
				class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
			>
				{t('Back to the Journal')}
			</a>
			{#if dev && result.error}
				<p class="text-xs text-gray-400 mt-10">{t('Dev note: {error}', { error: result.error })}</p>
			{/if}
		</div>
	</div>
{/if}
