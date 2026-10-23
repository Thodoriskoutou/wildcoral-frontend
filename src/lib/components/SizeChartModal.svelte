<script lang="ts">
	import { t, l } from '#lib/i18n/index.js';
	// The size guide pop-up: how to measure, and the shop's own size chart (from `site.sizeChart`).
	// Until a chart is filled in there, no table is shown: customers are asked to write instead of
	// being given numbers nobody confirmed.
	import X from '@lucide/svelte/icons/x';
	import { site } from '#lib/site.js';

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
						{site.sizeChart.length ? t('For the best fit, measure yourself and compare with the chart.') : t('For the best fit, measure yourself. If you are unsure which size to choose, write to us and we will help.')}
					</p>
				</div>

				<div class="mb-12 p-6 bg-gray-50 border border-gray-200">
					<h3 class="text-xs tracking-widest uppercase text-gray-500 mb-4">{t('How to Measure')}</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
						<div>
							<p class="font-medium mb-2">{t('Bust')}</p>
							<p class="text-gray-600">
								{t('Measure around the fullest part of your bust, keeping the tape parallel to the floor')}
							</p>
						</div>
						<div>
							<p class="font-medium mb-2">{t('Waist')}</p>
							<p class="text-gray-600">{t('Measure around your natural waistline, keeping the tape comfortably loose')}</p>
						</div>
						<div>
							<p class="font-medium mb-2">{t('Hips')}</p>
							<p class="text-gray-600">{t('Measure around the fullest part of your hips')}</p>
						</div>
					</div>
				</div>

				{#if site.sizeChart.length}
					<div class="mb-12">
						<h3 class="text-lg font-serif mb-6">{t('Sizes')}</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm border-collapse">
								<thead>
									<tr class="border-b-2 border-gray-900">
										<th class="text-left py-4 px-4 text-xs tracking-widest uppercase text-gray-500 font-medium">{t('Size')}</th>
										<th class="text-left py-4 px-4 text-xs tracking-widest uppercase text-gray-500 font-medium">{t('Bust ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
										<th class="text-left py-4 px-4 text-xs tracking-widest uppercase text-gray-500 font-medium">{t('Waist ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
										<th class="text-left py-4 px-4 text-xs tracking-widest uppercase text-gray-500 font-medium">{t('Hips ({sizeChartUnit})', { sizeChartUnit: site.sizeChartUnit })}</th>
									</tr>
								</thead>
								<tbody>
									{#each site.sizeChart as row, index (row.size)}
										<tr class="border-b border-gray-200 {index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
											<td class="py-4 px-4 font-medium">{row.size}</td>
											<td class="py-4 px-4 text-gray-600">{row.bust}</td>
											<td class="py-4 px-4 text-gray-600">{row.waist}</td>
											<td class="py-4 px-4 text-gray-600">{row.hips}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="mt-4 text-xs text-gray-500">{t('Body measurements in {sizeChartUnit}. Measurements are approximate.', { sizeChartUnit: site.sizeChartUnit })}</p>
					</div>
				{/if}

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
