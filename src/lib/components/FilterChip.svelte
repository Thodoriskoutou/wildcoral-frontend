<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	import X from '@lucide/svelte/icons/x';

	interface Props {
		label: string;
		onRemove: () => void;
	}

	let { label, onRemove }: Props = $props();
</script>

<div class="inline-flex items-center gap-2 pb-1 border-b border-gray-900 group">
	<span class="text-xs tracking-wider uppercase text-gray-900">
		{label}
	</span>
	<button
		onclick={onRemove}
		class="w-4 h-4 flex items-center justify-center text-gray-900 hover:text-gray-600 transition-colors"
		aria-label={t('Remove {label} filter', { label })}
	>
		<X class="w-3 h-3" strokeWidth={2} />
	</button>
</div>
