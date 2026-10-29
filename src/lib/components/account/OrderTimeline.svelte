<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	// The five-step progress line on an order: placed → paid → prepared → shipped → delivered.
	// A row on wide screens, a column on phones.
	import Check from '@lucide/svelte/icons/check';
	import type { OrderStep } from '#lib/medusa/order-tracking.js';

	let { steps }: { steps: OrderStep[] } = $props();
</script>

<ol class="grid grid-cols-1 md:grid-cols-5" aria-label={t('Order progress')}>
	{#each steps as step, i (step.label)}
		{@const last = i === steps.length - 1}
		{@const lineDone = step.done && !!steps[i + 1]?.done}
		<li class="relative flex items-start gap-4 pb-8 md:block md:pb-0 md:text-center" aria-current={step.current ? 'step' : undefined}>
			{#if !last}
				<!-- Line to the next step: down on phones, across on wide screens. -->
				<span
					aria-hidden="true"
					class="absolute left-[11px] top-6 bottom-0 w-px md:left-1/2 md:top-[11px] md:bottom-auto md:h-px md:w-full {lineDone
						? 'bg-gray-900'
						: 'bg-gray-200'}"
				></span>
			{/if}
			<span
				aria-hidden="true"
				class="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 md:mx-auto {step.done
					? 'border-gray-900 bg-gray-900 text-white'
					: 'border-gray-300 bg-white'} {step.current ? 'ring-4 ring-gray-900/10' : ''}"
			>
				{#if step.done}<Check class="size-3.5" strokeWidth={3} />{/if}
			</span>
			<div class="md:mt-4">
				<p class="text-sm {step.done || step.current ? 'text-gray-900' : 'text-gray-400'} {step.current ? 'font-medium' : ''}">{step.label}</p>
				{#if step.detail}<p class="mt-1 text-xs text-gray-500">{step.detail}</p>{/if}
			</div>
		</li>
	{/each}
</ol>
