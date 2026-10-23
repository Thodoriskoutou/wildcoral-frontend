<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	// Read-only stars, filled to a fraction (4.6 fills four and a half-ish stars).
	import Star from '@lucide/svelte/icons/star';

	let { value, size = 'md', class: className = '' }: { value: number; size?: 'sm' | 'md' | 'lg'; class?: string } = $props();

	const px = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' } as const;
	const percent = $derived((Math.max(0, Math.min(5, value)) / 5) * 100);
	const five = [0, 1, 2, 3, 4];
</script>

<span class="relative inline-flex {className}" role="img" aria-label={t('{value} out of 5 stars', { value: value.toFixed(1) })}>
	<span class="flex text-gray-300" aria-hidden="true">
		{#each five as i (i)}<Star class="{px[size]} flex-none fill-current" />{/each}
	</span>
	<span class="absolute inset-y-0 left-0 flex overflow-hidden text-gray-900" style="width: {percent}%" aria-hidden="true">
		{#each five as i (i)}<Star class="{px[size]} flex-none fill-current" />{/each}
	</span>
</span>
