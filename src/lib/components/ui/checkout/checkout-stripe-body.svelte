<script lang="ts">
	import type { RemoteForm } from '$app/server';

	// The Stripe (Elements-mode) checkout body (everything inside <Checkout.Root>). Shared by the
	// CheckoutStripe preset and the CheckoutAuto switcher.
	import Items from './checkout-items.svelte';

	import Image from './checkout-image.svelte';
	import Title from './checkout-title.svelte';
	import ItemSubtotal from './checkout-item-subtotal.svelte';
	import Delivery from './checkout-delivery.svelte';
	import Discount from './checkout-discount.svelte';
	import Summary from './checkout-summary.svelte';
	import Subtotal from './checkout-summary-subtotal.svelte';
	import SummaryDiscount from './checkout-summary-discount.svelte';
	import Shipping from './checkout-summary-shipping.svelte';
	import Tax from './checkout-summary-tax.svelte';
	import Total from './checkout-summary-total.svelte';
	import StripeElements from './checkout-stripe-elements.svelte';
	import StripePayment from './checkout-stripe-payment.svelte';
	import StripeAddress from './checkout-stripe-address.svelte';
	import PlaceOrder from './checkout-place-order.svelte';
	import Confirmation from './checkout-confirmation.svelte';
	import CheckoutError from './checkout-error.svelte';
	import { Root as AddressRoot, Email } from '../address/index.js';

	let {
		form,
		publishableKey,
		providerId,
		returnUrl,
		restrictToCurrentRegion
	}: {
		form: RemoteForm<any, any>
		publishableKey: string
		providerId?: string
		returnUrl: string
		restrictToCurrentRegion?: boolean
	} = $props()
</script>

<StripeElements
	publishableKey={publishableKey}
	providerId={providerId}
>
	<div
		class="mx-auto grid max-w-5xl gap-8 p-4 md:grid-cols-2"
	>
		<div class="space-y-4">
			<AddressRoot
				form={form}
				restrictToCurrentRegion={restrictToCurrentRegion}
			><Email /><StripeAddress /></AddressRoot>
		</div>
		<div class="space-y-6">
			<Items>
				<Image /><Title /><ItemSubtotal />
			</Items>
			<Delivery />
			<Discount />
			<Summary>
				<Subtotal /><SummaryDiscount /><Shipping /><Tax /><Total />
			</Summary>
			<StripePayment returnUrl={returnUrl} />
			<CheckoutError />
			<PlaceOrder />
		</div>
	</div>
</StripeElements>
<Confirmation />
