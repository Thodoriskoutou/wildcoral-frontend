<script lang="ts">
	// Renders a product's photo *or video* from Medusa, or a quiet tile with the product's name when
	// the product has no media yet. Place it inside a `relative` container.
	//
	// Videos play like the autoplay clips on fashion sites: muted, looping, inline. They only
	// run while on screen (a grid of clips would otherwise all decode at once), and visitors who
	// ask their device for reduced motion get a still first frame with controls instead.
	import { isVideoUrl } from '$lib/medusa/catalog';

	interface Props {
		src?: string | null;
		alt: string;
		/** Still image shown until the video's first frame is ready. */
		poster?: string | null;
		/** Show the browser's play / sound controls (used on the product page). */
		controls?: boolean;
		class?: string;
	}

	let {
		src = null,
		alt,
		poster = null,
		controls = false,
		class: className = ''
	}: Props = $props();

	const isVideo = $derived(!!src && isVideoUrl(src));
	// `#t=0.001` makes iOS Safari paint the first frame instead of a black box.
	const videoSrc = $derived(src && !src.includes('#') ? `${src}#t=0.001` : src);

	let video = $state<HTMLVideoElement | null>(null);
	let reducedMotion = $state(false);

	$effect(() => {
		const node = video;
		if (!node) return;
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) node.play().catch(() => {});
					else node.pause();
				}
			},
			{ threshold: 0.25 }
		);
		observer.observe(node);
		return () => observer.disconnect();
	});
</script>

{#if src && isVideo}
	<video
		bind:this={video}
		src={videoSrc}
		poster={poster ?? undefined}
		muted
		loop
		playsinline
		preload="metadata"
		controls={controls || reducedMotion}
		aria-label={alt}
		class="absolute inset-0 w-full h-full object-cover {className}"
	></video>
{:else if src}
	<img {src} {alt} loading="lazy" class="absolute inset-0 w-full h-full object-cover {className}" />
{:else}
	<!-- No photo or video yet: a quiet tile with just the name. -->
	<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" title={alt}>
		<p class="text-center px-6 font-serif italic text-gray-400">{alt}</p>
	</div>
{/if}
