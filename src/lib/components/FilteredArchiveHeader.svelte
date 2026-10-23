<script lang="ts">
	import { t } from '$lib/i18n';
	import FilterChip from './FilterChip.svelte';

	interface Filter {
		id: string;
		label: string;
	}

	interface Props {
		title: string;
		activeFilters: Filter[];
		onRemoveFilter: (filterId: string) => void;
		onClearAll?: () => void;
	}

	let { title, activeFilters, onRemoveFilter, onClearAll }: Props = $props();
</script>

<div class="mb-16">
	<h1 class="text-4xl md:text-5xl font-serif mb-8" style="line-height: 1.1">
		{title}
	</h1>

	{#if activeFilters.length > 0}
		<div class="flex items-center gap-4 flex-wrap">
			<span class="text-xs tracking-widest uppercase text-gray-500"> {t('Active Filters:')} </span>

			<div class="flex items-center gap-4 flex-wrap">
				{#each activeFilters as filter (filter.id)}
					<FilterChip label={filter.label} onRemove={() => onRemoveFilter(filter.id)} />
				{/each}
			</div>

			{#if onClearAll && activeFilters.length > 1}
				<button
					onclick={onClearAll}
					class="text-xs tracking-wider uppercase text-gray-500 hover:text-gray-900 transition-colors ml-2"
				>
					{t('Clear All')}
				</button>
			{/if}
		</div>
	{/if}
</div>
