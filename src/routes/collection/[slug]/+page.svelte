<script lang="ts">
	import { t, l } from '$lib/i18n';
	// Collection listing — the mirror of /category/[slug].
	import { page } from '$app/state'
	import { getCollectionQuery } from 'sveltekit-medusa-sdk'
	import * as Products from '$lib/components/ui/products'
	import { Metadata } from '$lib/components/ui/seo'

	// The Query variant (not the cached prerender one): the collection's title depends on the visitor's language
	const collection = $derived(await getCollectionQuery({ slug: page.params.slug }))
</script>

<svelte:boundary>
	{#snippet pending()}
		<div class="mx-auto max-w-6xl px-4 py-12 text-muted-foreground">{t('Loading…')}</div>
	{/snippet}

	{#snippet failed(error)}
		<div class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-2xl font-semibold">{t('Collection unavailable')}</h1>
			<p class="mt-2 text-muted-foreground">{error instanceof Error ? error.message : t('Please try again.')}</p>
		</div>
	{/snippet}

	{#if !collection}
		<div class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-2xl font-semibold">{t('Collection not found')}</h1>
			<a href={l('/')} class="mt-2 inline-block underline">{t('Back to home')}</a>
		</div>
	{:else}
		<Metadata config={{ title: collection.title }} />

		<section class="mx-auto max-w-6xl px-4 py-12">
			<h1 class="text-3xl font-semibold tracking-tight">{collection.title}</h1>

			<div class="mt-8">
				<Products.Root collectionId={collection.id} pageSize={12} href={p => `/product/${p.handle}`}>
					{#snippet children({ count })}
						{#if count === 0}
							<p class="text-muted-foreground">{t('No products in this collection yet.')}</p>
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
