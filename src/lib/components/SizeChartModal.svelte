<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	// The size guide pop-up reuses the customer-care measurements and table.
	import X from '@lucide/svelte/icons/x';
	import SizeGuideContent from '#lib/components/SizeGuideContent.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const contactHref = '/contact?topic=sizing';

	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center backdrop-atelier"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div class="relative w-full max-w-3xl max-h-[85vh] bg-surface-white overflow-y-auto mx-4 shadow-luxury-lg">
			<button
				onclick={onClose}
				class="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center text-gray-900 hover:text-gray-600 transition-colors"
				aria-label={t('Close size chart')}
			>
				<X class="w-5 h-5" strokeWidth={1} />
			</button>

			<div class="p-8 md:p-12">
				<div class="mb-8">
					<h2 class="text-3xl md:text-4xl font-serif mb-4">{t('Size Guide')}</h2>
					<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
						{t('For the best fit, measure yourself and compare with the chart.')}
					</p>
				</div>

				<div class="mb-12">
					<SizeGuideContent />
				</div>

				<div class="border-t border-gray-200 pt-8 text-sm text-gray-600">
					<p>
						{t('Between sizes, or not sure which to choose?')}
						<a href={l(contactHref)} class="underline hover:opacity-70 transition-opacity">{t('Write to us')}</a> {t('and we\'ll help.')}
					</p>
				</div>

				<div class="mt-8 flex justify-end">
					<button onclick={onClose} class="btn-primary-cta px-8 py-3 text-sm tracking-[0.2em] uppercase">
						{t('Got It')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
