<script lang="ts">
	import { t, l } from '$lib/i18n';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface BreadcrumbItem {
		label: string;
		href: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		separator?: 'slash' | 'line' | 'chevron';
	}

	let { items, separator = 'slash' }: Props = $props();
</script>

<nav aria-label={t('Breadcrumb')} class="pb-6 mb-10" style="padding-bottom: 24px; margin-bottom: 40px">
	<ol class="flex items-center gap-3">
		{#each items as item, index (item.href)}
			{@const isLast = index === items.length - 1}
			<li class="flex items-center gap-3">
				{#if isLast}
					<span class="text-xs tracking-widest uppercase text-gray-400 font-medium">
						{item.label}
					</span>
				{:else}
					<a
						href={l(item.href)}
						class="text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors duration-200"
					>
						{item.label}
					</a>
					{#if separator === 'chevron'}
						<ChevronRight class="w-3 h-3 text-gray-400" />
					{:else if separator === 'line'}
						<span class="w-[10px] h-[1px] bg-gray-400"></span>
					{:else}
						<span class="text-gray-400">/</span>
					{/if}
				{/if}
			</li>
		{/each}
	</ol>
</nav>
