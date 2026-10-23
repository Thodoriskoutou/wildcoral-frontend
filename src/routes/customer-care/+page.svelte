<script lang="ts">
	import { t, l, localized } from '#lib/i18n/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Mail from '@lucide/svelte/icons/mail';
	import Clock from '@lucide/svelte/icons/clock';
	import { site } from '#lib/site.js';

	const contactHref = site.contactEmail ? `mailto:${site.contactEmail}` : null;

	type Section = 'size-guide' | 'shipping' | 'returns' | 'care';

	let activeSection = $state<Section>('size-guide');
	let openFaq = $state<string | null>(null);

	const sizeRows = [
		{ size: 'XS', us: '0-2', bust: '32-33', waist: '24-25', hip: '34-35' },
		{ size: 'S', us: '4-6', bust: '34-35', waist: '26-27', hip: '36-37' },
		{ size: 'M', us: '8-10', bust: '36-37', waist: '28-29', hip: '38-39' },
		{ size: 'L', us: '12-14', bust: '38-40', waist: '30-32', hip: '40-42' },
		{ size: 'XL', us: '16-18', bust: '42-44', waist: '34-36', hip: '44-46' }
	];
</script>

<div class="bg-white min-h-screen">
	<div class="border-b border-gray-200 py-16">
		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
			<h1 class="text-5xl md:text-6xl font-serif mb-4">{t('Customer Care')}</h1>
			<p class="text-lg text-gray-600">{t('Everything you need to know about fit, shipping, and care')}</p>
		</div>
	</div>

	<div class="h-32"></div>

	<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
		<div class="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-12">
			<aside class="lg:sticky lg:top-24 h-fit">
				<nav class="border-2 border-gray-200 p-6">
					<h2 class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-6">{t('Quick Links')}</h2>
					<ul class="space-y-4">
						<li>
							<button
								onclick={() => (activeSection = 'size-guide')}
								class="text-left text-sm tracking-wide transition-colors w-full {activeSection ===
								'size-guide'
									? 'text-gray-900 font-medium border-l-2 border-gray-900 pl-4'
									: 'text-gray-600 hover:text-gray-900 pl-4'}"
							>
								{t('Size Guide')}
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeSection = 'shipping')}
								class="text-left text-sm tracking-wide transition-colors w-full {activeSection ===
								'shipping'
									? 'text-gray-900 font-medium border-l-2 border-gray-900 pl-4'
									: 'text-gray-600 hover:text-gray-900 pl-4'}"
							>
								{t('Shipping')}
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeSection = 'returns')}
								class="text-left text-sm tracking-wide transition-colors w-full {activeSection ===
								'returns'
									? 'text-gray-900 font-medium border-l-2 border-gray-900 pl-4'
									: 'text-gray-600 hover:text-gray-900 pl-4'}"
							>
								{t('Returns & Exchanges')}
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeSection = 'care')}
								class="text-left text-sm tracking-wide transition-colors w-full {activeSection ===
								'care'
									? 'text-gray-900 font-medium border-l-2 border-gray-900 pl-4'
									: 'text-gray-600 hover:text-gray-900 pl-4'}"
							>
								{t('Product Care')}
							</button>
						</li>
					</ul>

					<div class="mt-12 pt-12 border-t border-gray-200">
						<p class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">{t('Need Help?')}</p>
					{#if site.supportHours}
						<p class="text-sm text-gray-600 mb-4 flex items-start gap-2">
							<Clock class="w-4 h-4 mt-0.5 shrink-0" />
							<span>{localized(site.supportHours)}</span>
						</p>
					{/if}
					{#if contactHref}
						<a href={l(contactHref)} class="text-sm underline hover:opacity-70 transition-opacity inline-flex items-center gap-2">
							<Mail class="w-4 h-4" />
							{site.contactEmail}
						</a>
					{:else}
						<p class="text-sm text-gray-600">{t('Our team is happy to help with sizing, orders and returns.')}</p>
					{/if}
					<a href={l('/contact')} class="mt-4 inline-block text-sm underline hover:opacity-70 transition-opacity">{t('Send us a message')}</a>
					</div>
				</nav>
			</aside>

			<div class="space-y-16">
				{#if activeSection === 'size-guide'}
					<div>
						<h2 class="text-4xl font-serif mb-8">{t('Size Guide')}</h2>
						<p class="text-base text-gray-700 leading-relaxed mb-12">
							{t('Our pieces are designed to fit true to size. If you\'re between sizes or prefer a more relaxed fit, we recommend sizing up. For personalized sizing advice, contact our styling concierge.')}
						</p>

						<div class="overflow-x-auto mb-12">
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
				{:else if activeSection === 'shipping'}
					<div>
						<h2 class="text-4xl font-serif mb-8">{t('Shipping')}</h2>

						<div class="space-y-6 mb-12">
							<div class="border-2 border-gray-900 p-6">
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-lg font-medium">{t('Express Shipping')}</h3>
									<span class="text-sm text-green-700">{t('Complimentary')}</span>
								</div>
								<p class="text-sm text-gray-600 mb-2">{t('2-3 business days')}</p>
								<p class="text-sm text-gray-600">
									{t('Available for all domestic orders. Includes tracking and signature confirmation.')}
								</p>
							</div>

							<div class="border border-gray-300 p-6">
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-lg font-medium">{t('Standard Shipping')}</h3>
									<span class="text-sm text-green-700">{t('Complimentary')}</span>
								</div>
								<p class="text-sm text-gray-600 mb-2">{t('5-7 business days')}</p>
								<p class="text-sm text-gray-600">{t('Includes tracking. Standard delivery for all domestic orders.')}</p>
							</div>

							<div class="border border-gray-300 p-6">
								<div class="flex items-start justify-between mb-3">
									<h3 class="text-lg font-medium">{t('International Shipping')}</h3>
									<span class="text-sm">{t('Calculated at checkout')}</span>
								</div>
								<p class="text-sm text-gray-600 mb-2">{t('7-14 business days')}</p>
								<p class="text-sm text-gray-600">
									{t('We ship worldwide via DHL Express. Customs duties may apply.')}
								</p>
							</div>
						</div>

						<div class="space-y-4">
							<h3 class="text-2xl font-serif mb-6">{t('Frequently Asked')}</h3>

							<div class="border-2 border-gray-200">
								<button
									onclick={() => (openFaq = openFaq === 'tracking' ? null : 'tracking')}
									class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
								>
									<span class="text-sm tracking-wide">{t('How do I track my order?')}</span>
									<ChevronDown class="w-5 h-5 transition-transform {openFaq === 'tracking' ? 'rotate-180' : ''}" />
								</button>
								{#if openFaq === 'tracking'}
									<div class="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-6">
										{t('You\'ll receive a shipping confirmation email with tracking information within 24-48 hours of your order being dispatched. You can also track your order through your account dashboard.')}
									</div>
								{/if}
							</div>

							<div class="border-2 border-gray-200">
								<button
									onclick={() => (openFaq = openFaq === 'processing' ? null : 'processing')}
									class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
								>
									<span class="text-sm tracking-wide">{t('What is your processing time?')}</span>
									<ChevronDown class="w-5 h-5 transition-transform {openFaq === 'processing' ? 'rotate-180' : ''}" />
								</button>
								{#if openFaq === 'processing'}
									<div class="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-6">
										{t('All orders are hand-prepared and inspected before shipping. Processing typically takes 1-2 business days. Orders placed after 2pm EST will be processed the following business day.')}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if activeSection === 'returns'}
					<div>
						<h2 class="text-4xl font-serif mb-8">{t('Returns & Exchanges')}</h2>
						<p class="text-base text-gray-700 leading-relaxed mb-12">
							{t('We want you to love your purchase. If something isn\'t quite right, we offer a 30-day return policy on all unworn, unwashed items with original tags attached.')}
						</p>

						<div class="space-y-8">
							<div>
								<h3 class="text-xl font-serif mb-4">{t('How to Return')}</h3>
								<ol class="space-y-4">
									<li class="flex gap-4">
										<span class="w-8 h-8 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 text-sm">1</span>
										<div>
											<p class="text-sm font-medium mb-1">{t('Initiate Your Return')}</p>
											<p class="text-sm text-gray-600">
												{t('Log into your account and select "Return Item" from your order history')}
											</p>
										</div>
									</li>
									<li class="flex gap-4">
										<span class="w-8 h-8 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 text-sm">2</span>
										<div>
											<p class="text-sm font-medium mb-1">{t('Pack Your Item')}</p>
											<p class="text-sm text-gray-600">
												{t('Place the item in its original packaging (if possible) with all tags attached')}
											</p>
										</div>
									</li>
									<li class="flex gap-4">
										<span class="w-8 h-8 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 text-sm">3</span>
										<div>
											<p class="text-sm font-medium mb-1">{t('Ship It Back')}</p>
											<p class="text-sm text-gray-600">
												{t('Use the prepaid return label included with your order or download a new one from your account')}
											</p>
										</div>
									</li>
								</ol>
							</div>

							<div class="bg-gray-50 border border-gray-200 p-8">
								<h3 class="text-xs tracking-[0.2em] uppercase mb-4">{t('Important Notes')}</h3>
								<ul class="space-y-2 text-sm text-gray-600">
									<li>{t('• Swimwear must be unworn with hygiene liner intact')}</li>
									<li>{t('• Sale items are final sale unless defective')}</li>
									<li>{t('• Refunds processed within 5-7 business days of receipt')}</li>
									<li>{t('• Original shipping costs are non-refundable')}</li>
								</ul>
							</div>
						</div>
					</div>
				{:else if activeSection === 'care'}
					<div>
						<h2 class="text-4xl font-serif mb-8">{t('Product Care')}</h2>
						<p class="text-base text-gray-700 leading-relaxed mb-12">
							{t('Proper care ensures your pieces maintain their shape, color, and quality for years to come. Follow these guidelines to extend the life of your swimwear.')}
						</p>

						<div class="space-y-12">
							<div>
								<h3 class="text-2xl font-serif mb-6">{t('General Care')}</h3>
								<ul class="space-y-4 text-sm text-gray-700">
									<li class="flex gap-3">
										<span class="text-gray-400">•</span>
										<span>{t('Rinse in cold water immediately after each use')}</span>
									</li>
									<li class="flex gap-3">
										<span class="text-gray-400">•</span>
										<span>{t('Hand wash with a mild, pH-neutral detergent')}</span>
									</li>
									<li class="flex gap-3">
										<span class="text-gray-400">•</span>
										<span>{t('Never wring or twist the fabric')}</span>
									</li>
									<li class="flex gap-3">
										<span class="text-gray-400">•</span>
										<span>{t('Lay flat to dry in shade (avoid direct sunlight)')}</span>
									</li>
									<li class="flex gap-3">
										<span class="text-gray-400">•</span>
										<span>{t('Do not bleach, iron, or dry clean')}</span>
									</li>
								</ul>
							</div>

							<div class="border-t border-gray-200 pt-12">
								<h3 class="text-2xl font-serif mb-6">{t('What to Avoid')}</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div class="bg-gray-50 border border-gray-200 p-6">
										<h4 class="text-sm font-medium mb-3">{t('Sunscreen & Oils')}</h4>
										<p class="text-sm text-gray-600 leading-relaxed">
											{t('Apply sunscreen at least 15 minutes before wearing. Oils can degrade elastic fibers and cause discoloration.')}
										</p>
									</div>

									<div class="bg-gray-50 border border-gray-200 p-6">
										<h4 class="text-sm font-medium mb-3">{t('Chlorine & Hot Tubs')}</h4>
										<p class="text-sm text-gray-600 leading-relaxed">
											{t('Prolonged exposure to chlorinated water can fade colors. Rinse immediately after swimming.')}
										</p>
									</div>

									<div class="bg-gray-50 border border-gray-200 p-6">
										<h4 class="text-sm font-medium mb-3">{t('Rough Surfaces')}</h4>
										<p class="text-sm text-gray-600 leading-relaxed">
											{t('Avoid sitting on rough surfaces like concrete, wood, or stone that can snag delicate fabrics.')}
										</p>
									</div>

									<div class="bg-gray-50 border border-gray-200 p-6">
										<h4 class="text-sm font-medium mb-3">{t('Machine Washing')}</h4>
										<p class="text-sm text-gray-600 leading-relaxed">
											{t('Machine washing can damage elastic and alter the fit. Always hand wash for best results.')}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
