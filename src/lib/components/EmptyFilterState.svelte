<script lang="ts">
	import { t, l } from '$lib/i18n';
	interface Props {
		message?: string;
		exploreAllLink?: string;
		/** When given, the button clears the current filters instead of linking away. */
		onClear?: () => void;
	}

	let {
		message = t('No silhouettes match your current selection'),
		exploreAllLink = '/shop',
		onClear
	}: Props = $props();

	const buttonClass =
		'py-4 px-10 border border-gray-900 text-sm tracking-[0.2em] uppercase font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300';
</script>

<div class="flex flex-col items-center justify-center py-32 px-8 text-center">
	<p class="text-2xl font-serif italic text-gray-600 mb-8 max-w-md">
		{message}
	</p>

	{#if onClear}
		<button onclick={onClear} class={buttonClass}>{t('Clear Filters')}</button>
	{:else}
		<a href={l(exploreAllLink)} class={buttonClass}>{t('Explore All')}</a>
	{/if}
</div>
