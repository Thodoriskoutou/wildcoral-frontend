<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	// Category listing.
	//
	// `Products.Root` filters by category *id*, not handle, so the category is resolved
	// from the URL slug first. Same shape as /collection/[slug].
	import { page } from '$app/state'
	import { getProductCategoryQuery } from '#lib/medusa/catalog.remote.js'
	import * as Products from '#lib/components/ui/products/index.js'
	import { Metadata } from '#lib/components/ui/seo/index.js'

	// The Query variant (not the cached prerender one): the category's name depends on the visitor's language
	const category = $derived(await getProductCategoryQuery({ slug: page.params.slug }))
</script>

<svelte:boundary>
	{#snippet pending()}
		<div class="mx-auto max-w-6xl px-4 py-12 text-muted-foreground">{t('Loading…')}</div>
	{/snippet}

	{#snippet failed(error)}
		<div class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-2xl font-semibold">{t('Category unavailable')}</h1>
			<p class="mt-2 text-muted-foreground">{error instanceof Error ? error.message : t('Please try again.')}</p>
		</div>
	{/snippet}

	{#if !category}
		<div class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-2xl font-semibold">{t('Category not found')}</h1>
			<a href={l('/')} class="mt-2 inline-block underline">{t('Back to home')}</a>
		</div>
	{:else}
		<Metadata config={{ title: category.name, description: category.description ?? undefined }} />

		<section class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-3xl font-semibold tracking-tight">{category.name}</h1>
			{#if category.description}
				<p class="mt-2 text-muted-foreground">{category.description}</p>
			{/if}

			<div class="mt-8">
				<Products.Root categoryId={category.id} pageSize={12} href={p => `/product/${p.handle}`}>
					{#snippet children({ count })}
						{#if count === 0}
							<p class="text-muted-foreground">{t('No products in this category yet.')}</p>
						{:else}
							<Products.Grid />
							<div class="mt-8">
								<Products.Pagination />
							</div>
						{/if}
					{/snippet}
				</Products.Root>
			</div>
		</section>
	{/if}
</svelte:boundary>
