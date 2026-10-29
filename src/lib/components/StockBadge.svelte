<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Check from '@lucide/svelte/icons/check';

	export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';

	interface Props {
		status: StockStatus;
		quantity?: number;
		variant?: 'default' | 'compact';
		class?: string;
	}

	let { status, quantity, variant = 'default', class: className = '' }: Props = $props();

	const config = $derived(
		{
			'in-stock': {
				label: t('In Stock'),
				hasIcon: 'check' as const,
				bgColor: 'bg-green-100',
				textColor: 'text-green-800',
				borderColor: 'border-green-200'
			},
			'low-stock': {
				label: quantity ? t('Only {quantity} left', { quantity }) : t('Low Stock'),
				hasIcon: 'alert' as const,
				bgColor: 'bg-amber-100',
				textColor: 'text-amber-800',
				borderColor: 'border-amber-200'
			},
			'out-of-stock': {
				label: t('Out of Stock'),
				hasIcon: 'alert' as const,
				bgColor: 'bg-red-100',
				textColor: 'text-red-800',
				borderColor: 'border-red-200'
			},
			'pre-order': {
				label: t('Pre-Order'),
				hasIcon: null,
				bgColor: 'bg-blue-100',
				textColor: 'text-blue-800',
				borderColor: 'border-blue-200'
			}
		}[status]
	);
</script>

{#if variant === 'compact'}
	<span
		class="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase {config.textColor} {className}"
	>
		{#if config.hasIcon === 'check'}
			<Check class="w-3 h-3" />
		{:else if config.hasIcon === 'alert'}
			<CircleAlert class="w-3 h-3" />
		{/if}
		{config.label}
	</span>
{:else}
	<div
		class="inline-flex items-center gap-2 px-3 py-1.5 border {config.bgColor} {config.textColor} {config.borderColor} {className}"
	>
		{#if config.hasIcon === 'check'}
			<Check class="w-3 h-3" />
		{:else if config.hasIcon === 'alert'}
			<CircleAlert class="w-3 h-3" />
		{/if}
		<span class="text-xs tracking-wider uppercase font-medium">
			{config.label}
		</span>
	</div>
{/if}
