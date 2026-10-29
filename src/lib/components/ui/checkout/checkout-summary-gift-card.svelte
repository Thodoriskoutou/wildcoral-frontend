<script lang="ts">
	import { t, formatLocale } from '#lib/i18n/index.js'
	import { cn } from '#lib/utils.js'
	import { getCheckoutContext } from './ctx.svelte.js'
	import { formatPrice } from './format-price.js'

	let { class: className = '', label = t('Gift card'), locale = formatLocale() }: { class?: string; label?: string; locale?: string } = $props()

	const ctx = getCheckoutContext()
	const amount = $derived(ctx.cart?.gift_card_total)
	const formatted = $derived(formatPrice(amount, ctx.cart?.currency_code ?? 'usd', locale))
</script>

{#if formatted}
	<div data-checkout-summary-gift-card class={cn('flex justify-between', className)}>
		<dt>{label}</dt>
		<dd>{formatted}</dd>
	</div>
{/if}
