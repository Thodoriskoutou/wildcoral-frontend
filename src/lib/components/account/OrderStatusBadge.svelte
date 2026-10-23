<script lang="ts">
	import type { OrderView } from '$lib/medusa/order-tracking';

	let { order }: { order: Pick<OrderView, 'phase' | 'statusLabel'> } = $props();

	const tone = {
		processing: 'border-amber-300 bg-amber-50 text-amber-900',
		shipped: 'border-sky-300 bg-sky-50 text-sky-900',
		delivered: 'border-green-300 bg-green-50 text-green-900',
		canceled: 'border-red-300 bg-red-50 text-red-900'
	} as const;
</script>

<span class="inline-block whitespace-nowrap border px-3 py-1 text-[11px] uppercase tracking-[0.15em] {tone[order.phase]}">
	{order.statusLabel}
</span>
