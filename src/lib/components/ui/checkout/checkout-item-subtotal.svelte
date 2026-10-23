<script lang="ts">
	import { formatLocale } from '$lib/i18n'
	import { cn } from '$lib/utils.js'
	import { getCheckoutLineContext, getCheckoutContextOptional } from './ctx.svelte.js'
	import { formatPrice } from './format-price.js'
	let { class: className = '', locale = formatLocale() }: { class?: string; locale?: string } = $props()
	const { item } = getCheckoutLineContext()
	// Medusa line items carry no currency of their own — fall back to the cart's, not USD.
	const checkout = getCheckoutContextOptional()
	const currencyCode = $derived((item as { currency_code?: string }).currency_code ?? checkout?.cart?.currency_code ?? 'usd')
	const amount = $derived(item.subtotal ?? (item.unit_price != null ? item.unit_price * item.quantity : undefined))
	const formatted = $derived(formatPrice(amount, currencyCode, locale))
</script>

{#if formatted}<p data-checkout-item-subtotal class={cn('text-sm font-medium', className)}>
		{formatted}
	</p>{/if}
