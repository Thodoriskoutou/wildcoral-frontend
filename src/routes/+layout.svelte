<script lang="ts">
	import { t, l, getLocale, localizePath, pathOf, locales, localeNames, localeShort, type Locale } from '$lib/i18n';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getCart, getProductCategoriesQuery } from 'sveltekit-medusa-sdk';
	import type { ContentItem } from 'medusa-js-sdk';
	import { listJournalItems } from '$lib/medusa/journal';
	import { SITE_NAME, SITE_URL } from '$app/env/public';
	import { MetaProvider } from '$lib/components/ui/seo';
	import * as Auth from '$lib/components/ui/auth';
	import { site } from '$lib/site';
	import SocialIcon, { type SocialNetwork } from '$lib/components/icons/SocialIcon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ScrollProgressBar from '$lib/components/ScrollProgressBar.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Search from '@lucide/svelte/icons/search';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import User from '@lucide/svelte/icons/user';

	let { children } = $props();

	// Owner settings from src/lib/site.ts: empty values simply hide the matching link.
	const contactHref = '/contact';
	// Social icons: a URL makes a link, '' shows the icon dimmed until the link is added, and a
	// network that isn't in site.social isn't shown (see src/lib/site.ts).
	const socialNetworks = Object.entries(site.social) as [SocialNetwork, string][];
	const networkLabel = (network: string) => network.charAt(0).toUpperCase() + network.slice(1);

	// Header badge: read without awaiting so the header never blocks rendering (or fails) if Medusa
	// is unreachable. `addToCart` and the other cart commands update this same query in place.
	const cartQuery = getCart();
	const cartCount = $derived(cartQuery.current?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0);

	// Menu + footer "Shop" links come from the categories managed in the Medusa admin (top level
	// only, in the admin's rank order). Also read without awaiting, for the same reason as the cart.
	const categoriesQuery = getProductCategoriesQuery({ limit: 50, fields: 'id,name,handle,rank,parent_category_id' });
	const shopCategories = $derived(
		(categoriesQuery.current?.product_categories ?? [])
			.filter((c) => !c.parent_category_id)
			.slice()
			.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
	);

	// The three newest Journal posts for the menu and footer, in the visitor's language. Loaded after the
	// page appears, so a missing collection or an unreachable Medusa just leaves the "All Stories" link on its own.
	let storyItems = $state<ContentItem[]>([]);
	$effect(() => {
		listJournalItems(12).then(
			(items) => (storyItems = items),
			() => {}
		);
	});
	const latestStories = $derived(
		storyItems
			.slice()
			.sort((a, b) => Date.parse(b.published_at ?? b.created_at) - Date.parse(a.published_at ?? a.created_at))
			.slice(0, 3)
	);

	let scrolled = $state(false);
	let scrollOpacity = $state(0);
	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');

	let isHomePage = $derived(pathOf(page.url.pathname) === '/');

	// The same page in the other language. `?lang=` also remembers the choice (see src/hooks.server.ts),
	// and `data-sveltekit-reload` below reloads the page so everything is fetched in that language.
	const currentLocale = $derived(getLocale());
	function switchHref(code: Locale) {
		const query = new URLSearchParams(page.url.search);
		query.set('lang', code);
		return `${localizePath(pathOf(page.url.pathname), code)}?${query}${page.url.hash}`;
	}

	$effect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			scrolled = scrollY > 50;
			scrollOpacity = Math.min(scrollY / 200, 1);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(l(`/search?q=${encodeURIComponent(searchQuery)}`));
			searchOpen = false;
			searchQuery = '';
		}
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
		if (!menuOpen) searchOpen = false;
	}

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (!searchOpen) menuOpen = false;
	}

	let headerLight = $derived(isHomePage && !menuOpen && scrollOpacity < 0.5);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#snippet languageSwitch(extraClass = '')}
	<nav aria-label={t('Language')} class="flex items-center gap-2 text-xs tracking-[0.2em] uppercase {extraClass}">
		{#each locales as code, i (code)}
			{#if i > 0}<span aria-hidden="true" class="opacity-40">/</span>{/if}
			<a
				href={switchHref(code)}
				hreflang={code}
				lang={code}
				title={localeNames[code]}
				data-sveltekit-reload
				aria-current={code === currentLocale ? 'true' : undefined}
				class={code === currentLocale ? 'font-semibold underline underline-offset-4' : 'hover:opacity-70 transition-opacity'}
			>
				{localeShort[code]}
			</a>
		{/each}
	</nav>
{/snippet}

<MetaProvider site={{ siteName: SITE_NAME, siteUrl: SITE_URL, titleTemplate: `%s | ${SITE_NAME}` }}>
<div class="min-h-screen bg-white flex flex-col">
	<ScrollProgressBar />

	<header
		class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {menuOpen
			? 'bg-white border-b-2 border-gray-900'
			: scrolled && isHomePage
				? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50'
				: isHomePage
					? 'bg-transparent'
					: 'bg-white border-b-2 border-gray-900'}"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="hidden md:flex items-center justify-between py-6">
				<button
					onclick={toggleMenu}
					class="p-2 hover:opacity-70 transition-all duration-300 {headerLight
						? 'text-white'
						: 'text-gray-900'}"
				>
					{#if menuOpen}
						<X class="w-5 h-5" />
					{:else}
						<Menu class="w-5 h-5" />
					{/if}
					<span class="sr-only">{t('Menu')}</span>
				</button>

				<a href={l('/')} class="absolute left-1/2 transform -translate-x-1/2">
					<Logo variant={headerLight ? 'reverse' : 'normal'} width={240} />
				</a>

				<div
					class="flex items-center space-x-6 transition-all duration-300 {headerLight
						? 'text-white'
						: 'text-gray-900'}"
				>
					{@render languageSwitch()}
					<button onclick={toggleSearch} class="hover:opacity-70 transition-opacity">
						<Search class="w-5 h-5" />
						<span class="sr-only">{t('Search')}</span>
					</button>
					<a href={l('/account')} class="hover:opacity-70 transition-opacity">
						<User class="w-5 h-5" />
						<span class="sr-only">{t('Account')}</span>
					</a>
					<a href={l('/cart')} class="relative hover:opacity-70 transition-opacity">
						<ShoppingBag class="w-5 h-5" />
						{#if cartCount > 0}
							<span
								class="absolute -top-1 -right-1 bg-gray-900 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
							>
								{cartCount}
							</span>
						{/if}
						<span class="sr-only">{t('Cart')}</span>
					</a>
				</div>
			</div>

			<div class="md:hidden flex items-center justify-between py-4">
				<button
					onclick={toggleMenu}
					class="p-2 hover:opacity-70 transition-all duration-300 {headerLight
						? 'text-white'
						: 'text-gray-900'}"
				>
					{#if menuOpen}
						<X class="w-5 h-5" />
					{:else}
						<Menu class="w-5 h-5" />
					{/if}
					<span class="sr-only">{t('Menu')}</span>
				</button>

				<a href={l('/')} class="flex-1 flex justify-center">
					<Logo variant={headerLight ? 'reverse' : 'normal'} width={160} />
				</a>

				<a
					href={l('/cart')}
					class="relative p-2 hover:opacity-70 transition-all duration-300 {headerLight
						? 'text-white'
						: 'text-gray-900'}"
				>
					<ShoppingBag class="w-5 h-5" />
					{#if cartCount > 0}
						<span
							class="absolute top-0 right-0 bg-gray-900 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
						>
							{cartCount}
						</span>
					{/if}
					<span class="sr-only">{t('Cart')}</span>
				</a>
			</div>
		</div>

		{#if searchOpen}
			<div class="border-t border-gray-200 bg-white">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<form onsubmit={handleSearch} class="max-w-2xl mx-auto">
						<div class="flex items-center border-b-2 border-gray-900 pb-2">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder={t('Search for swimwear, styles, or stories...')}
								class="flex-grow bg-transparent text-lg outline-none px-2"
								autofocus
							/>
							<button
								type="submit"
								class="text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
							>
								{t('Search')}
							</button>
						</div>
						<p class="text-xs text-gray-400 mt-4">
							{t('Try searching: "bikini", "one piece", "white", or "resort"')}
						</p>
					</form>
				</div>
			</div>
		{/if}
	</header>

	{#if menuOpen}
		<div class="fixed inset-0 z-40 bg-white pt-16 md:pt-20 overflow-y-auto">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24">
				{@render languageSwitch('md:hidden mb-8 text-gray-900')}
				<div class="grid grid-cols-1 md:grid-cols-4 gap-12">
					<div>
						<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Shop')}</h3>
						<ul class="space-y-4">
							<li>
								<a
									href={l('/shop')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('All Swimwear')}
								</a>
							</li>
							{#each shopCategories as cat (cat.id)}
								<li>
									<a
										href={l(`/shop?category=${cat.handle}`)}
										class="text-lg hover:opacity-70 transition-opacity"
										onclick={() => (menuOpen = false)}
									>
										{cat.name}
									</a>
								</li>
							{/each}
						</ul>
					</div>

					<div>
						<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Journal')}</h3>
						<ul class="space-y-4">
							<li>
								<a
									href={l('/journal')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('All Stories')}
								</a>
							</li>
							{#each latestStories as story (story.id)}
								<li>
									<a
										href={l(`/journal/${story.slug}`)}
										class="text-lg hover:opacity-70 transition-opacity"
										onclick={() => (menuOpen = false)}
									>
										{story.title}
									</a>
								</li>
							{/each}
						</ul>
					</div>

					<div>
						<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Customer Care')}</h3>
						<ul class="space-y-4">
							<li>
								<a
									href={l('/customer-care')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('Size Guide')}
								</a>
							</li>
							<li>
								<a
									href={l('/customer-care')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('Shipping & Returns')}
								</a>
							</li>
							<li>
								<a href={l(contactHref)} class="text-lg hover:opacity-70 transition-opacity" onclick={() => (menuOpen = false)}>{t('Contact Us')}</a>
							</li>
							<li>
								<a href={l('/account#orders')} class="text-lg hover:opacity-70 transition-opacity" onclick={() => (menuOpen = false)}>{t('Track Order')}</a>
							</li>
						</ul>
					</div>

					<div>
						<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Account')}</h3>
						<ul class="space-y-4">
							<li>
								<a
									href={l('/account')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('My Account')}
								</a>
							</li>
							<li>
								<a
									href={l('/account')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('Recent Orders')}
								</a>
							</li>
							<li>
								<a
									href={l('/account')}
									class="text-lg hover:opacity-70 transition-opacity"
									onclick={() => (menuOpen = false)}
								>
									{t('Saved for Later')}
								</a>
							</li>
							<li>
								<a href="?auth=login" class="text-lg hover:opacity-70 transition-opacity" onclick={() => (menuOpen = false)}>{t('Sign In / Register')}</a>
							</li>
						</ul>
					</div>
				</div>

				<div class="mt-16 pt-16 border-t border-gray-200">
					<div class="max-w-2xl">
						<h3 class="text-3xl font-serif mb-4">{t('Discover the Journal')}</h3>
						<p class="text-gray-600 mb-6">
							{t('Stories of slow summer, craftsmanship, and the philosophy behind timeless design.')}
						</p>
						<a
							href={l('/journal')}
							class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
							onclick={() => (menuOpen = false)}
						>
							{t('Read Now')}
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<main class={isHomePage ? '' : 'pt-20'}>
		{@render children()}
	</main>

	<footer class="bg-white border-t border-gray-200 mt-auto">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="flex justify-center mb-12">
				<Logo variant="normal" width={240} />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
				<div>
					<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Shop')}</h3>
					<ul class="space-y-3 text-sm text-gray-600">
						<li><a href={l('/shop')} class="hover:text-gray-900 transition-colors">{t('All Swimwear')}</a></li>
						{#each shopCategories as cat (cat.id)}
							<li>
								<a href={l(`/shop?category=${cat.handle}`)} class="hover:text-gray-900 transition-colors">
									{cat.name}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Journal')}</h3>
					<ul class="space-y-3 text-sm text-gray-600">
						<li><a href={l('/journal')} class="hover:text-gray-900 transition-colors">{t('All Stories')}</a></li>
						{#each latestStories as story (story.id)}
							<li>
								<a href={l(`/journal/${story.slug}`)} class="hover:text-gray-900 transition-colors">{story.title}</a>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Support')}</h3>
					<ul class="space-y-3 text-sm text-gray-600">
						<li>
							<a href={l('/customer-care')} class="hover:text-gray-900 transition-colors">{t('Size Guide')}</a>
						</li>
						<li>
							<a href={l('/customer-care')} class="hover:text-gray-900 transition-colors">
								{t('Shipping & Returns')}
							</a>
						</li>
						<li><a href={l(contactHref)} class="hover:text-gray-900 transition-colors">{t('Contact Us')}</a></li>
						<li>
							<a href={l('/account')} class="hover:text-gray-900 transition-colors">{t('My Account')}</a>
						</li>
					</ul>
				</div>

				<div>
					<h3 class="text-xs tracking-[0.2em] uppercase mb-6 text-gray-900">{t('Follow Us')}</h3>
					<div class="flex items-center gap-5">
						{#each socialNetworks as [network, url] (network)}
							{#if url}
								<a
									href={l(url)}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={networkLabel(network)}
									class="text-gray-700 hover:text-gray-900 hover:opacity-70 transition-all"
								>
									<SocialIcon name={network} class="w-6 h-6" />
								</a>
							{:else}
								<span class="text-gray-300" title={networkLabel(network)}>
									<SocialIcon name={network} class="w-6 h-6" />
								</span>
							{/if}
						{/each}
					</div>
					{#if site.instagramHandle}
						<p class="text-xs text-gray-400 mt-3">{site.instagramHandle}</p>
					{/if}
				</div>
			</div>

			<div
				class="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500"
			>
				<p>{t('© {year} {name}. All rights reserved.', { year: new Date().getFullYear(), name: site.name.toUpperCase() })}</p>
				{@render languageSwitch('mt-4 md:mt-0')}
			</div>
		</div>
	</footer>

	<CookieConsent />
</div>

<!-- Opens on ?auth=login|register|forgot|reset. Mount once, here. -->
<Auth.Dialog />
</MetaProvider>
