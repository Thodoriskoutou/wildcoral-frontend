<script lang="ts" module>
	export type SocialNetwork = 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'youtube';
</script>

<script lang="ts">
	// Outline brand icons in the same style as the rest of the site's icons (Lucide has no brand
	// icons). `name` picks the network; size and colour come from `class` / `currentColor`.
	interface Props {
		name: SocialNetwork;
		class?: string;
	}

	let { name, class: className = '' }: Props = $props();
</script>

<svg
	class={className}
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'instagram'}
		<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
		<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
		<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
	{:else if name === 'facebook'}
		<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
	{:else if name === 'pinterest'}
		<path d="M8 20l4-9" />
		<path d="M10.7 14c.437 1.263 1.43 2 2.55 2 2.071 0 3.75-1.554 3.75-4a5 5 0 1 0-9.7 1.7" />
		<circle cx="12" cy="12" r="9" />
	{:else if name === 'tiktok'}
		<path
			d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z"
		/>
	{:else if name === 'youtube'}
		<path d="M2 8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
		<path d="M10 9l5 3-5 3z" />
	{/if}
</svg>
