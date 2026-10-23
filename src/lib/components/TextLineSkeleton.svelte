<script lang="ts">
	interface Props {
		lines?: number;
		class?: string;
	}

	let { lines = 3, class: className = '' }: Props = $props();
</script>

<div class="space-y-3 {className}">
	{#each Array(lines) as _, index (index)}
		<div
			class="h-4 bg-gray-200 rounded relative overflow-hidden"
			style="width: {index === lines - 1 ? '60%' : '100%'}"
		>
			<div class="absolute inset-0 shimmer"></div>
		</div>
	{/each}
</div>
