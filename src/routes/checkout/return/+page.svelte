<script lang="ts">
	import { t } from '$lib/i18n'
	// Stripe redirects here after payment. `Return` reads the redirect result, completes
	// the cart, and then navigates on. It is standalone — not inside Checkout.Root.
	//
	// Point STRIPE_REDIRECT_URL at this route's absolute URL.
	import { STRIPE_KEY } from '$app/env/public'
	import { Return } from '$lib/components/ui/checkout'
	import { Metadata } from '$lib/components/ui/seo'
	import { rememberOrder } from '$lib/medusa/order-summary'
</script>

<Metadata config={{ title: t('Order confirmation'), noindex: true }} />

<section class="min-h-[60vh] bg-white px-4 py-24">
	<Return publishableKey={STRIPE_KEY} redirectTo="/success" oncomplete={rememberOrder} />
</section>
