<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	// Heart / "Save for Later" button, backed by the customer's wishlist in Medusa (the
	// @rsc-labs/medusa-wishlist plugin). Saving needs an account: a signed-out visitor who taps it is
	// taken to the sign-in dialog. All hearts on a page share one state (see wishlist-state.svelte.ts).
	import Heart from '@lucide/svelte/icons/heart';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { wishlist } from '#lib/medusa/wishlist-state.svelte.js';

	interface Props {
		productId: string;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'icon' | 'text';
		class?: string;
	}

	let { productId, size = 'md', variant = 'icon', class: className = '' }: Props = $props();

	const isSaved = $derived(wishlist.has(productId));
	const busy = $derived(wishlist.busy === productId);
	let failed = $state(false);

	// Read the wishlist once the page is in the browser, and again when the sign-in dialog closes
	// (the visitor may just have signed in).
	let previousAuth: string | null = null;
	$effect(() => {
		const auth = page.url.searchParams.get('auth');
		const dialogJustClosed = previousAuth !== null && auth === null;
		previousAuth = auth;
		// `untrack`: only the URL should re-run this, not the wishlist state the load itself changes.
		untrack(() => {
			if (dialogJustClosed || !wishlist.loaded || !wishlist.signedIn) wishlist.load(dialogJustClosed);
		});
	});

	async function handleToggle() {
		failed = false;
		const outcome = await wishlist.toggle(productId);
		if (outcome === 'needs-login') {
			await goto(`${page.url.pathname}?auth=login`, { reset: false });
		} else if (outcome === 'error') {
			failed = true;
			setTimeout(() => (failed = false), 3000);
		}
	}

	const sizes = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};
	const label = $derived(failed ? t("Couldn't save. Try again.") : isSaved ? t('Remove from wishlist') : t('Add to wishlist'));
</script>

{#if variant === 'text'}
	<button
		onclick={handleToggle}
		disabled={busy}
		aria-pressed={isSaved}
		aria-label={label}
		class="flex items-center gap-2 text-sm tracking-wide uppercase transition-colors disabled:opacity-60 {isSaved
			? 'text-red-600'
			: 'text-gray-900 hover:text-red-600'} {className}"
	>
		<Heart class="{sizes[size]} transition-all {isSaved ? 'fill-red-600' : 'fill-none'}" />
		<span>{failed ? t("Couldn't save") : isSaved ? t('Saved') : t('Save for Later')}</span>
	</button>
{:else}
	<button
		onclick={handleToggle}
		disabled={busy}
		aria-pressed={isSaved}
		aria-label={label}
		title={label}
		class="border-2 transition-all disabled:opacity-60 {isSaved
			? 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700'
			: 'border-gray-900 bg-white hover:bg-gray-900 hover:text-white'} {size === 'sm'
			? 'p-2'
			: size === 'lg'
				? 'p-4'
				: 'p-3'} {className}"
	>
		<Heart class="{sizes[size]} transition-all {isSaved ? 'fill-white' : 'fill-none'}" />
	</button>
{/if}
