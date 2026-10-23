<script lang="ts">
	import { t } from '$lib/i18n';
	import { cn } from '$lib/utils.js'
	import type { Snippet } from 'svelte'
	let { class: className = '', children }: { class?: string; children?: Snippet } = $props()
</script>

<p data-cart-empty class={cn('text-muted-foreground py-6 text-sm', className)}>
	{#if children}{@render children()}{:else}{t('Your cart is empty')}{/if}
</p>
