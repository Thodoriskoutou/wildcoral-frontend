<script lang="ts">
	import { formatLocale } from '#lib/i18n/index.js'
	import { cn } from '#lib/utils.js'
	import { getReviewItemContextOptional } from './reviews-item-ctx.svelte.js'
	import { formatReviewDate } from './review-logic.js'
	let { class: className = '', locale = formatLocale() }: { class?: string; locale?: string } = $props()
	const r = $derived(getReviewItemContextOptional()?.review)
	const text = $derived(r ? formatReviewDate(r.created_at, locale) : '')
</script>

{#if text}<time class={cn('text-sm text-muted-foreground', className)}>{text}</time>{/if}
