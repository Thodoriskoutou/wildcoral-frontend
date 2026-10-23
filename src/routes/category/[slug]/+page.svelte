<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { page } from '$app/state'
	import { getProductCategoryQuery } from '#lib/medusa/catalog.remote.js'
	import CatalogPage from '#lib/components/CatalogPage.svelte'

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
		<CatalogPage categoryHandle={category.handle} />
	{/if}
</svelte:boundary>
