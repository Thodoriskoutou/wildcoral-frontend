<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js'
	import { getReviewsContext } from './reviews-ctx.svelte.js'
	import type { Snippet } from 'svelte'
	let { class: className = '', children }: { class?: string; children: Snippet } = $props()
	const ctx = getReviewsContext()
</script>

{#if ctx.filteredCount > ctx.pageSize}
	<nav class={cn('flex items-center justify-center gap-4', className)} data-pagination aria-label={t('Reviews pages')}>
		{@render children()}
	</nav>
{/if}
