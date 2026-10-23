<script lang="ts">
	import { t, l, formatDate } from '$lib/i18n';
	// A whole order: status, progress line, tracking numbers, items, totals and delivery details.
	// Used by /account/orders/[id] (real data) and /account/preview (sample data, dev only).
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Gift from '@lucide/svelte/icons/gift';
	import Leaf from '@lucide/svelte/icons/leaf';
	import { site } from '$lib/site';
	import { formatPrice } from '$lib/medusa/catalog';
	import type { OrderView } from '$lib/medusa/order-tracking';
	import ProductMedia from '$lib/components/ProductMedia.svelte';
	import OrderStatusBadge from './OrderStatusBadge.svelte';
	import OrderTimeline from './OrderTimeline.svelte';

	let { order, backHref = '/account#orders' }: { order: OrderView; backHref?: string } = $props();

	const fmtDate = (d: string) => formatDate(d);
	const money = (n: number | null) => formatPrice(n, order.currency);
	// Tracking links come from whoever fulfilled the order in Medusa; only follow real web links.
	const safeUrl = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
	// Opens the contact form on "My order" with this order number filled in.
	const help = $derived({
		href: `/contact?topic=order&order=${encodeURIComponent(order.number.replace('#', ''))}`,
		label: t('Contact us about this order')
	});
</script>

<div class="mx-auto max-w-5xl px-8 md:px-16 lg:px-24 pb-32">
	<a href={l(backHref)} class="mb-10 inline-flex items-center gap-2 text-sm text-gray-600 transition-opacity hover:opacity-70">
		<ArrowLeft class="size-4" /> {t('All orders')}
	</a>

	<div class="mb-12 flex flex-wrap items-start justify-between gap-6">
		<div>
			<h1 class="mb-2 font-serif text-4xl md:text-5xl">{t('Order {number}', { number: order.number })}</h1>
			<p class="text-sm text-gray-600">{[t('Placed on {date}', { date: fmtDate(order.createdAt) }), order.email].filter(Boolean).join(' · ')}</p>
		</div>
		<OrderStatusBadge {order} />
	</div>

	<!-- Progress -->
	<section class="mb-12 border-2 border-gray-200 p-6 md:p-10" aria-labelledby="progress-heading">
		<h2 id="progress-heading" class="mb-8 text-xs uppercase tracking-[0.2em] text-gray-700">{t('Order status')}</h2>
		{#if order.phase === 'canceled'}
			<p class="text-sm leading-relaxed text-gray-700">
				{t('This order was canceled. If you didn\'t expect this, or a payment was taken, please get in touch and we\'ll sort it out.')}
			</p>
		{:else}
			<OrderTimeline steps={order.steps} />
		{/if}
	</section>

	<!-- Tracking -->
	{#if order.phase !== 'canceled'}
		<section class="mb-12 border-2 border-gray-200 p-6 md:p-10" aria-labelledby="tracking-heading">
			<h2 id="tracking-heading" class="mb-6 text-xs uppercase tracking-[0.2em] text-gray-700">{t('Tracking')}</h2>
			{#if order.parcels.some((p) => p.trackingNumber)}
				<ul class="divide-y divide-gray-200">
					{#each order.parcels.filter((p) => p.trackingNumber) as parcel, i (i)}
						{@const url = safeUrl(parcel.trackingUrl)}
						<li class="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
							<div>
								<p class="text-xs uppercase tracking-wider text-gray-500">
									{parcel.carrier ? t('{carrier} tracking number', { carrier: parcel.carrier }) : t('Tracking number')}
								</p>
								<p class="mt-1 font-mono text-sm">{parcel.trackingNumber}</p>
							</div>
							{#if url}
								<a
									href={l(url)}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-2 border-2 border-gray-900 px-6 py-3 text-sm uppercase tracking-[0.15em] transition-all hover:bg-gray-900 hover:text-white"
								>
									{t('Track parcel')} <ExternalLink class="size-4" />
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			{:else if order.phase === 'processing'}
				<p class="text-sm leading-relaxed text-gray-600">
					{t('We\'re getting your order ready. Once it ships, its tracking number appears here.')}
				</p>
			{:else if order.phase === 'shipped'}
				<p class="text-sm leading-relaxed text-gray-600">
					{t('Your order is on its way. Its tracking number will appear here as soon as we have it.')}
				</p>
			{:else}
				<p class="text-sm leading-relaxed text-gray-600">{t('Your order has been delivered. We hope you love it.')}</p>
			{/if}
		</section>
	{/if}

	<!-- Items + totals -->
	<section class="mb-12 border-2 border-gray-200 p-6 md:p-10" aria-labelledby="items-heading">
		<h2 id="items-heading" class="mb-6 text-xs uppercase tracking-[0.2em] text-gray-700">
			{order.itemCount ? t('Items ({count})', { count: order.itemCount }) : t('Items')}
		</h2>
		{#if order.items.length}
			<ul class="divide-y divide-gray-200">
				{#each order.items as item (item.id)}
					<li class="flex gap-6 py-6 first:pt-0">
						<a href={l(item.href)} class="relative block h-32 w-24 shrink-0 overflow-hidden border border-gray-200 bg-gray-100">
							<ProductMedia src={item.thumbnail} alt={item.title} />
						</a>
						<div class="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4">
							<div>
								<a href={l(item.href)} class="transition-opacity hover:opacity-70">{item.title}</a>
								{#if item.variant}<p class="mt-1 text-sm text-gray-600">{item.variant}</p>{/if}
								<p class="mt-1 text-sm text-gray-600">{t('Qty {quantity}', { quantity: item.quantity })}</p>
								{#if item.productId && (order.phase === 'shipped' || order.phase === 'delivered')}
									<a href="{item.href}#reviews" class="mt-3 inline-block text-xs uppercase tracking-wider underline transition-opacity hover:opacity-70">
										{t('Review this piece')}
									</a>
								{/if}
							</div>
							<p class="text-sm">{money(item.total ?? (item.unitPrice !== null ? item.unitPrice * item.quantity : null))}</p>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-gray-600">{t('The items on this order couldn\'t be loaded.')}</p>
		{/if}

		<dl class="mt-6 space-y-3 border-t border-gray-200 pt-6 text-sm">
			{#if order.totals.subtotal !== null}
				<div class="flex justify-between"><dt class="text-gray-600">{t('Subtotal')}</dt><dd>{money(order.totals.subtotal)}</dd></div>
			{/if}
			{#if order.totals.discount}
				<div class="flex justify-between"><dt class="text-gray-600">{t('Discount')}</dt><dd>−{money(order.totals.discount)}</dd></div>
			{/if}
			{#if order.totals.shipping !== null}
				<div class="flex justify-between">
					<dt class="text-gray-600">{order.shippingMethod ? t('Shipping ({method})', { method: order.shippingMethod }) : t('Shipping')}</dt>
					<dd>{order.totals.shipping === 0 ? t('Free') : money(order.totals.shipping)}</dd>
				</div>
			{/if}
			{#if order.totals.tax}
				<div class="flex justify-between"><dt class="text-gray-600">{t('Tax')}</dt><dd>{money(order.totals.tax)}</dd></div>
			{/if}
			<div class="flex justify-between border-t border-gray-200 pt-3 text-base">
				<dt>{t('Total')}</dt><dd>{money(order.totals.total)}</dd>
			</div>
		</dl>
	</section>

	<!-- Delivery + extras -->
	{#if order.address.length || order.giftMessage || order.ecoPackaging}
		<section class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
			{#if order.address.length}
				<div class="border-2 border-gray-200 p-6 md:p-8">
					<h2 class="mb-4 text-xs uppercase tracking-[0.2em] text-gray-700">{t('Delivery address')}</h2>
					<address class="text-sm not-italic leading-relaxed text-gray-700">
						{#each order.address as line (line)}<div>{line}</div>{/each}
					</address>
				</div>
			{/if}
			{#if order.giftMessage || order.ecoPackaging}
				<div class="border-2 border-gray-200 p-6 md:p-8">
					<h2 class="mb-4 text-xs uppercase tracking-[0.2em] text-gray-700">{t('Extras')}</h2>
					<ul class="space-y-3 text-sm text-gray-700">
						{#if order.giftMessage}
							<li class="flex gap-3"><Gift class="mt-0.5 size-4 shrink-0" /><span>“{order.giftMessage}”</span></li>
						{/if}
						{#if order.ecoPackaging}
							<li class="flex gap-3"><Leaf class="mt-0.5 size-4 shrink-0" /><span>{t('Eco-friendly packaging')}</span></li>
						{/if}
					</ul>
				</div>
			{/if}
		</section>
	{/if}

	<p class="text-sm text-gray-600">
		{t('Something not right?')} <a href={l(help.href)} class="underline transition-opacity hover:opacity-70">{help.label}</a>.
	</p>
</div>
