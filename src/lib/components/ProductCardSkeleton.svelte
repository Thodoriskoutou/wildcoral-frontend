<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 1 }: Props = $props();
</script>

{#each Array(count) as _, index (index)}
	<div class="space-y-3">
		<div class="relative overflow-hidden bg-gray-200" style="aspect-ratio: 4/5">
			<div class="absolute inset-0 shimmer"></div>
		</div>

		<div class="h-3 bg-gray-200 rounded w-4/5 relative overflow-hidden">
			<div class="absolute inset-0 shimmer"></div>
		</div>

		<div class="h-3 bg-gray-200 rounded w-1/4 relative overflow-hidden">
			<div class="absolute inset-0 shimmer"></div>
		</div>
	</div>
{/each}
