<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
		import { Metadata } from '#lib/components/ui/seo/index.js';
	import { safe } from '#lib/medusa/safe.js';
	import { toPost, pickFeatured, listJournalItems } from '#lib/medusa/journal.js';
	import { site } from '#lib/site.js';
	import { dev } from '$app/env';

	// Posts come from the Medusa content plugin (collection: site.journalCollection). Only
	// published posts are returned. If the collection doesn't exist yet, or Medusa is unreachable,
	// the page shows its "on their way" state instead of failing.
	const result = $derived(
		await safe(async () => {
			const items = await listJournalItems(50);
			return items.map(toPost).sort((a, b) => b.time - a.time);
		})
	);

	const posts = $derived(result.data ?? []);
	const featured = $derived(pickFeatured(posts));
	const recent = $derived(posts.filter((p) => p.id !== featured?.id));
</script>

<Metadata config={{ title: t('Journal'), description: t('Stories and style notes from {name}.', { name: site.name }) }} />

<div class="bg-white">
	{#if featured}
		<section class="relative h-[60vh] min-h-[500px] bg-gray-900 border-b-2 border-gray-900 overflow-hidden">
			{#if featured.cover}
				<img
					src={featured.cover}
					alt=""
					fetchpriority="high"
					class="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
				/>
			{/if}
			<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20"></div>

			<div class="relative z-10 h-full flex items-end">
				<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-16 w-full">
					<div class="max-w-2xl">
						<span class="text-xs tracking-[0.3em] uppercase text-white/80 mb-4 block">
							{featured.category}
						</span>
						<h1 class="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
							{featured.title}
						</h1>
						{#if featured.excerpt}
							<p class="text-lg text-white/90 mb-8 leading-relaxed">{featured.excerpt}</p>
						{/if}
						<a
							href={l(`/journal/${featured.slug}`)}
							class="inline-block border-2 border-white text-white px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-gray-900 transition-all"
						>
							{t('Read the Story')}
						</a>
					</div>
				</div>
			</div>
		</section>

		<div class="h-32"></div>

		{#if recent.length > 0}
			<section class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
				<div class="mb-16">
					<h2 class="text-4xl md:text-5xl font-serif">{t('Recent Stories')}</h2>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
					{#each recent as post, index (post.id)}
						{@const portrait = index % 3 !== 1}
						<a
							href={l(`/journal/${post.slug}`)}
							class="group {portrait && index % 2 === 0 ? 'md:row-span-2' : ''}"
						>
							<div
								class="bg-gray-100 border border-gray-200 mb-6 relative overflow-hidden {portrait
									? 'aspect-[3/4]'
									: 'aspect-square'}"
							>
								{#if post.cover}
									<img
										src={post.cover}
										alt={post.title}
										loading="lazy"
										class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								{:else}
									<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
										<p class="text-center px-8 font-serif italic text-gray-400">{post.title}</p>
									</div>
								{/if}
								<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</div>

							<div class="space-y-3">
								<span class="text-xs tracking-[0.3em] uppercase text-gray-500">{post.category}</span>
								<h3 class="text-2xl font-serif leading-tight group-hover:opacity-70 transition-opacity">
									{post.title}
								</h3>
								{#if post.excerpt}
									<p class="text-sm text-gray-600 leading-relaxed">{post.excerpt}</p>
								{/if}
								<div class="flex items-center justify-between pt-4">
									<span class="text-xs text-gray-400">{post.date}</span>
									<span class="text-sm underline group-hover:opacity-70 transition-opacity">{t('Read the Story')}</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<section class="min-h-[70vh] flex items-center justify-center px-8">
			<div class="max-w-xl text-center">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4 block">{t('Journal')}</span>
				<h1 class="text-4xl md:text-5xl font-serif mb-6">{t('Stories are on their way')}</h1>
				<p class="text-gray-600 leading-relaxed mb-8">
					{t('Style notes, summer inspiration and the stories behind the collection are coming soon.')}
				</p>
				<a
					href={l('/shop')}
					class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
				>
					{t('Explore the Collection')}
				</a>
				{#if dev && result.error}
					<p class="text-xs text-gray-400 mt-10">
						{t('Dev note: couldn\'t read the "{journalCollection}" collection ({error}). Create it and publish a post — see scripts/seed/README.md.', { journalCollection: site.journalCollection, error: result.error })}
					</p>
				{/if}
			</div>
		</section>
	{/if}

	<!-- The Muse Letter — only once a newsletter form action is set in src/lib/site.ts -->
	{#if site.newsletterAction}
		<section class="border-t-2 border-gray-900 py-32">
			<div class="max-w-2xl mx-auto px-8 text-center">
				<h2 class="text-4xl md:text-5xl font-serif mb-6">{t('The Muse Letter')}</h2>
				<p class="text-lg text-gray-700 mb-12 leading-relaxed">
					{t('Stories, insights, and the occasional love letter from our design studio. Subscribe to receive monthly dispatches.')}
				</p>

				<form method="POST" action={site.newsletterAction} class="max-w-md mx-auto">
					<div class="flex border-b-2 border-gray-900 pb-2 mb-4">
						<input
							type="email"
							name="email"
							required
							placeholder={t('Your email address')}
							class="flex-grow bg-transparent text-sm outline-none px-2"
						/>
						<button type="submit" class="text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
							{t('Subscribe')}
						</button>
					</div>
				</form>
			</div>
		</section>
	{/if}
</div>
