<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	import { page } from '$app/state'
</script>

<section class="mx-auto max-w-3xl px-4 py-24 text-center">
	<p class="text-sm font-medium text-muted-foreground">{page.status}</p>
	<h1 class="mt-2 text-3xl font-semibold tracking-tight">
		{page.status === 404 ? t('Page not found') : t('Something went wrong')}
	</h1>
	{#if page.error?.message}
		<p class="mt-3 text-muted-foreground">{page.error.message}</p>
	{/if}
	<a href={l('/')} class="mt-8 inline-block underline">{t('Back to home')}</a>
</section>
