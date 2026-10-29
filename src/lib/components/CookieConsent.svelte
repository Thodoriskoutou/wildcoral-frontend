<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import Cookie from '@lucide/svelte/icons/cookie';
	import X from '@lucide/svelte/icons/x';
	import { site } from '#lib/site.js';

	// Only link the policy pages that exist (set their URLs in src/lib/site.ts).
	const legalLinks = [
		[t('Privacy Policy'), site.legal.privacy],
		[t('Cookie Policy'), site.legal.cookies],
		[t('Terms of Service'), site.legal.terms]
	].filter(([, url]) => url);

	let isVisible = $state(false);
	let showDetails = $state(false);

	$effect(() => {
		const hasConsented = localStorage.getItem('cookie-consent');
		if (!hasConsented) {
			const timer = setTimeout(() => (isVisible = true), 1000);
			return () => clearTimeout(timer);
		}
	});

	function handleAcceptAll() {
		localStorage.setItem('cookie-consent', 'all');
		isVisible = false;
	}

	function handleAcceptEssential() {
		localStorage.setItem('cookie-consent', 'essential');
		isVisible = false;
	}

	function handleReject() {
		localStorage.setItem('cookie-consent', 'rejected');
		isVisible = false;
	}
</script>

{#if isVisible}
	<div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] animate-fade-in"></div>

	<div class="fixed bottom-0 left-0 right-0 z-[80] animate-slide-up">
		<div class="max-w-7xl mx-auto p-4 md:p-6">
			<div class="bg-white border-2 border-gray-900 shadow-luxury-lg">
				<div class="p-6 md:p-8">
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center gap-3">
							<div class="bg-gray-900 text-white p-2">
								<Cookie class="w-5 h-5" />
							</div>
							<h3 class="text-lg font-serif">{t('Privacy & Cookies')}</h3>
						</div>
						<button
							onclick={handleReject}
							class="text-gray-400 hover:text-gray-900 transition-colors"
							aria-label={t('Close')}
						>
							<X class="w-5 h-5" />
						</button>
					</div>

					{#if !showDetails}
						<div>
							<p class="text-sm text-gray-600 mb-6 leading-relaxed">
								{t('We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.')}
								<button
									onclick={() => (showDetails = true)}
									class="underline hover:opacity-70 transition-opacity"
								>
									{t('Learn more')}
								</button>
							</p>

							<div class="flex flex-col md:flex-row gap-3">
								<button
									onclick={handleAcceptAll}
									class="flex-1 bg-gray-900 text-white py-3 px-6 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all"
								>
									{t('Accept All')}
								</button>
								<button
									onclick={handleAcceptEssential}
									class="flex-1 border-2 border-gray-900 text-gray-900 py-3 px-6 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
								>
									{t('Essential Only')}
								</button>
								<button
									onclick={() => (showDetails = true)}
									class="text-sm underline hover:opacity-70 transition-opacity md:ml-4"
								>
									{t('Customize')}
								</button>
							</div>
						</div>
					{:else}
						<div>
							<p class="text-sm text-gray-600 mb-6">{t('Choose which cookies you\'d like to enable:')}</p>

							<div class="space-y-4 mb-6">
								<label
									class="flex items-start gap-3 p-4 border border-gray-200 cursor-not-allowed opacity-60"
								>
									<input type="checkbox" checked disabled class="mt-0.5 w-4 h-4" />
									<div class="flex-1">
										<p class="text-sm font-medium mb-1">{t('Essential Cookies (Required)')}</p>
										<p class="text-xs text-gray-500">
											{t('Necessary for the website to function properly. Cannot be disabled.')}
										</p>
									</div>
								</label>

								<label
									class="flex items-start gap-3 p-4 border border-gray-200 cursor-pointer hover:border-gray-900 transition-colors"
								>
									<input type="checkbox" checked class="mt-0.5 w-4 h-4 accent-gray-900" />
									<div class="flex-1">
										<p class="text-sm font-medium mb-1">{t('Analytics Cookies')}</p>
										<p class="text-xs text-gray-500">
											{t('Help us understand how visitors interact with our website to improve user experience.')}
										</p>
									</div>
								</label>

								<label
									class="flex items-start gap-3 p-4 border border-gray-200 cursor-pointer hover:border-gray-900 transition-colors"
								>
									<input type="checkbox" checked class="mt-0.5 w-4 h-4 accent-gray-900" />
									<div class="flex-1">
										<p class="text-sm font-medium mb-1">{t('Marketing Cookies')}</p>
										<p class="text-xs text-gray-500">
											{t('Used to track visitors across websites to display relevant advertisements.')}
										</p>
									</div>
								</label>
							</div>

							<div class="flex flex-col md:flex-row gap-3">
								<button
									onclick={handleAcceptAll}
									class="flex-1 bg-gray-900 text-white py-3 px-6 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all"
								>
									{t('Save Preferences')}
								</button>
								<button
									onclick={() => (showDetails = false)}
									class="text-sm underline hover:opacity-70 transition-opacity md:ml-4"
								>
									{t('Back')}
								</button>
							</div>
						</div>
					{/if}
				</div>

				{#if legalLinks.length > 0}
					<div class="px-6 md:px-8 py-4 border-t border-gray-200 bg-gray-50">
						<div class="flex flex-wrap gap-4 text-xs text-gray-600">
							{#each legalLinks as [label, url] (label)}
								<a href={l(url)} class="underline hover:text-gray-900 transition-colors">{label}</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
