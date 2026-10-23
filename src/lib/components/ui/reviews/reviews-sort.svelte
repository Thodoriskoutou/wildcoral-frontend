<script lang="ts">
	import { t } from '$lib/i18n';
	import { cn } from '$lib/utils.js'
	import { getReviewsContext } from './reviews-ctx.svelte.js'
	const ctx = getReviewsContext()
	let { class: className = '' }: { class?: string } = $props()
	const options = [
		{ value: '-created_at', label: t('Newest') },
		{ value: 'created_at', label: t('Oldest') },
		{ value: '-rating', label: t('Highest rated') },
		{ value: 'rating', label: t('Lowest rated') }
	]
</script>

{#if ctx.count > 0}
	<label class={cn('inline-flex items-center gap-2 text-sm', className)}>
		<span>{t('Sort by:')}</span>
		<select
			class="border-input bg-background rounded-md border px-2 py-1"
			value={ctx.order}
			onchange={e => ctx.setOrder((e.currentTarget as HTMLSelectElement).value)}
		>
			{#each options as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
		</select>
	</label>
{/if}
