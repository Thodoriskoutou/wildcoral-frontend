<script lang="ts">
	import { l } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js'
	import { getCartContext, getCartLineContext, getCartSheetContextOptional } from './ctx.svelte.js'
	let { class: className = '' }: { class?: string } = $props()
	const ctx = getCartContext()
	const { item } = getCartLineContext()
	const sheet = getCartSheetContextOptional()
</script>

<a {@attach sheet?.closeOnClick ?? false} href={l(ctx.lineHref(item))} data-cart-title class={cn('min-w-0 text-sm', className)}>
	<div class="font-medium">{item.product_title}</div>
	{#if item.variant_title}<p class="text-muted-foreground mt-1">{item.variant_title}</p>{/if}
</a>
