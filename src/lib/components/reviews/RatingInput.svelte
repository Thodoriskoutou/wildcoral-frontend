<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	// Pick 1–5 stars. Arrow keys move the choice, like any radio group.
	import Star from '@lucide/svelte/icons/star';

	let { value = $bindable(0), label = t('Your rating') }: { value?: number; label?: string } = $props();

	let hover = $state(0);
	const shown = $derived(hover || value);
	const names = [t('Poor'), t('Fair'), t('Good'), t('Very good'), t('Excellent')];

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === 'ArrowUp') value = Math.min(5, (value || 0) + 1);
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') value = Math.max(1, (value || 2) - 1);
		else return;
		e.preventDefault();
	}
</script>

<div role="radiogroup" aria-label={label} class="flex items-center gap-1" {onkeydown} tabindex="-1">
	{#each [1, 2, 3, 4, 5] as n (n)}
		<button
			type="button"
			role="radio"
			aria-checked={value === n}
			aria-label={`${t('{count} star|{count} stars', { count: n })}, ${names[n - 1]}`}
			tabindex={value === n || (value === 0 && n === 1) ? 0 : -1}
			class="p-1 text-gray-900 transition-transform hover:scale-110"
			onclick={() => (value = n)}
			onmouseenter={() => (hover = n)}
			onmouseleave={() => (hover = 0)}
			onfocus={() => (hover = 0)}
		>
			<Star class="size-7 {n <= shown ? 'fill-current' : 'fill-none text-gray-300'}" />
		</button>
	{/each}
	<span class="ml-2 text-sm text-gray-600" aria-live="polite">{shown ? names[shown - 1] : ''}</span>
</div>
