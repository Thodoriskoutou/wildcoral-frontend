<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		items: Snippet[];
		class?: string;
	}

	let { items, class: className = '' }: Props = $props();
</script>

<div class="space-y-16 {className}">
	{#each items as item, index (index)}
		{@const position = index % 3}
		{#if position === 0}
			<div class="max-w-[800px] mx-auto">
				{@render item()}
			</div>
		{:else if position === 1}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				{@render item()}
				{#if items[index + 1]}
					{@render items[index + 1]()}
				{/if}
			</div>
		{/if}
	{/each}
</div>
