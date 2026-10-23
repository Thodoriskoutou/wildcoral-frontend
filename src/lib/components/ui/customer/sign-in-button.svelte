<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js'
	import { buttonVariants } from '#lib/components/ui/button/index.js'
	import type { Snippet } from 'svelte'

	let { href = '?auth=login', class: className = '', children }: { href?: string; class?: string; children?: Snippet } = $props()
</script>

<a href={l(href)} class={cn(buttonVariants({ variant: 'default' }), className)}>
	{#if children}{@render children()}{:else}{t('Sign in')}{/if}
</a>
