<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js'
	import { getReviewsContext } from './reviews-ctx.svelte.js'
	let { class: className = '' }: { class?: string } = $props()
	const ctx = getReviewsContext()
</script>

{#if ctx.count > 0}<span class={cn('text-muted-foreground text-sm', className)}>{t('{count} review|{count} reviews', { count: ctx.count })}</span>{/if}
