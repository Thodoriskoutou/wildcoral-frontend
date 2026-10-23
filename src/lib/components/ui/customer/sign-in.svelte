<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js'
	import { buttonVariants, type ButtonSize, type ButtonVariant } from '#lib/components/ui/button/index.js'
	import type { Snippet } from 'svelte'

	let {
		href = '?auth=login',
		class: className = '',
		variant = 'default',
		size = 'default',
		children
	}: { href?: string; class?: string; variant?: ButtonVariant; size?: ButtonSize; children?: Snippet } = $props()
</script>

{#if children}
	<a href={l(href)} data-customer-sign-in class={cn('inline-flex items-center', className)}>
		{@render children()}
	</a>
{:else}
	<a href={l(href)} data-customer-sign-in class={cn(buttonVariants({ variant, size }), className)}>{t('Sign In')}</a>
{/if}
