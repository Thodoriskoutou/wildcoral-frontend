<script lang="ts">
	import { t } from '$lib/i18n';
	import { cn } from '$lib/utils.js'
	import { getPageNavContext } from './page-nav-ctx.svelte.js'

	let { class: className = '' }: { class?: string } = $props()
	const ctx = getPageNavContext()
</script>

<span data-page-nav-info class={cn('text-muted-foreground px-2 text-sm', className)}>{t('Page {page} of {pageCount}', { page: ctx.page + 1, pageCount: ctx.pageCount })}</span>
