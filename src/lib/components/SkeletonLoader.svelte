<script lang="ts">
	interface Props {
		count?: number;
		aspectRatio?: string;
		class?: string;
	}

	let { count = 1, aspectRatio = '4/5', class: className = '' }: Props = $props();
</script>

{#each Array(count) as _, index (index)}
	<div class="space-y-4 {className}">
		<div class="relative overflow-hidden bg-gray-200" style="aspect-ratio: {aspectRatio}">
			<div class="absolute inset-0 shimmer"></div>
		</div>

		<div class="h-3 bg-gray-200 rounded w-3/4 relative overflow-hidden">
			<div class="absolute inset-0 shimmer"></div>
		</div>

		<div class="h-3 bg-gray-200 rounded w-1/4 relative overflow-hidden">
			<div class="absolute inset-0 shimmer"></div>
		</div>
	</div>
{/each}
