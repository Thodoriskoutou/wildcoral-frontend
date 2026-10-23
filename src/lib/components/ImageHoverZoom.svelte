<script lang="ts">
	interface Props {
		primaryImage: string;
		secondaryImage?: string;
		alt: string;
		class?: string;
		aspectRatio?: string;
	}

	let { primaryImage, secondaryImage, alt, class: className = '', aspectRatio = '4/5' }: Props =
		$props();

	let isHovered = $state(false);

	let displayImage = $derived(isHovered && secondaryImage ? secondaryImage : primaryImage);
</script>

<div
	class="relative overflow-hidden bg-gray-100 {className}"
	style="aspect-ratio: {aspectRatio}"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="img"
	aria-label={alt}
>
	<img
		src={displayImage}
		{alt}
		class="w-full h-full object-cover transition-all duration-700 ease-out {isHovered
			? 'scale-105'
			: 'scale-100'}"
	/>
</div>
