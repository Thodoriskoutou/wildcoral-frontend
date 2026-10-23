<script lang="ts">
	// DEV ONLY (the route 404s in production): the order list and tracking page drawn from sample
	// orders, so the design can be checked without a Medusa customer, order or shipment.
	import { page } from '$app/state';
	import { sampleViews } from '$lib/medusa/order-fixtures';
	import OrderCard from '$lib/components/account/OrderCard.svelte';
	import OrderDetail from '$lib/components/account/OrderDetail.svelte';

	const selected = $derived(sampleViews.find((o) => o.id === page.url.searchParams.get('order')) ?? null);
</script>

<svelte:head><title>Order preview (dev)</title><meta name="robots" content="noindex" /></svelte:head>

<div class="min-h-screen bg-white pt-16 md:pt-24">
	<div class="mx-auto max-w-5xl px-8 md:px-16 lg:px-24">
		<p class="mb-10 border-2 border-dashed border-gray-300 p-4 text-xs leading-relaxed text-gray-600">
			<strong class="font-medium text-gray-900">Development preview.</strong> Sample orders, nothing is read from Medusa. This page is
			not available on the live site.
		</p>
	</div>

	{#if selected}
		<OrderDetail order={selected} backHref="/account/preview" />
	{:else}
		<div class="mx-auto max-w-5xl px-8 pb-32 md:px-16 lg:px-24">
			<h1 class="mb-10 font-serif text-3xl">Orders</h1>
			<div class="space-y-6">
				{#each sampleViews as order (order.id)}
					<OrderCard {order} href={`?order=${order.id}`} />
				{/each}
			</div>
			<a href="/account" class="mt-10 inline-block text-sm underline">Back to the real account page</a>
		</div>
	{/if}
</div>
