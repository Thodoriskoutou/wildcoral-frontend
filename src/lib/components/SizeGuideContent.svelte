<script lang="ts">
	import { t } from '#lib/i18n/index.js';

	const sizeRows = [
		{ size: 'XS', us: '0-2', bust: '32-33', waist: '24-25', hip: '34-35' },
		{ size: 'S', us: '4-6', bust: '34-35', waist: '26-27', hip: '36-37' },
		{ size: 'M', us: '8-10', bust: '36-37', waist: '28-29', hip: '38-39' },
		{ size: 'L', us: '12-14', bust: '38-40', waist: '30-32', hip: '40-42' },
		{ size: 'XL', us: '16-18', bust: '42-44', waist: '34-36', hip: '44-46' }
	];
</script>

<div class="space-y-12">
	<div class="overflow-x-auto">
		<table class="w-full border-2 border-gray-200 text-sm">
			<thead class="bg-gray-100">
				<tr>
					<th class="border border-gray-200 px-6 py-4 text-left text-xs tracking-[0.2em] uppercase">{t('Size')}</th>
					<th class="border border-gray-200 px-6 py-4 text-left text-xs tracking-[0.2em] uppercase">{t('US')}</th>
					<th class="border border-gray-200 px-6 py-4 text-left text-xs tracking-[0.2em] uppercase">{t('Bust (in)')}</th>
					<th class="border border-gray-200 px-6 py-4 text-left text-xs tracking-[0.2em] uppercase">{t('Waist (in)')}</th>
					<th class="border border-gray-200 px-6 py-4 text-left text-xs tracking-[0.2em] uppercase">{t('Hip (in)')}</th>
				</tr>
			</thead>
			<tbody>
				{#each sizeRows as row (row.size)}
					<tr class="hover:bg-gray-50">
						<td class="border border-gray-200 px-6 py-4 font-medium">{row.size}</td>
						<td class="border border-gray-200 px-6 py-4">{row.us}</td>
						<td class="border border-gray-200 px-6 py-4">{row.bust}</td>
						<td class="border border-gray-200 px-6 py-4">{row.waist}</td>
						<td class="border border-gray-200 px-6 py-4">{row.hip}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="bg-gray-50 border border-gray-200 p-8">
		<h3 class="text-xl font-serif mb-6">{t('How to Measure')}</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div>
				<h4 class="text-xs tracking-[0.2em] uppercase mb-3">{t('Bust')}</h4>
				<p class="text-sm text-gray-600 leading-relaxed">
					{t('Measure around the fullest part of your bust, keeping the tape parallel to the floor')}
				</p>
			</div>
			<div>
				<h4 class="text-xs tracking-[0.2em] uppercase mb-3">{t('Waist')}</h4>
				<p class="text-sm text-gray-600 leading-relaxed">
					{t('Measure around your natural waistline, the narrowest part of your torso')}
				</p>
			</div>
			<div>
				<h4 class="text-xs tracking-[0.2em] uppercase mb-3">{t('Hip')}</h4>
				<p class="text-sm text-gray-600 leading-relaxed">
					{t('Measure around the fullest part of your hips, approximately 8" below your waist')}
				</p>
			</div>
		</div>
	</div>
</div>
