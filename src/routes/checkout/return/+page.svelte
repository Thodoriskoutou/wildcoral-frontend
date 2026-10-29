<script lang="ts">
	import { t } from '#lib/i18n/index.js'
	// Stripe redirects here after payment. `Return` reads the redirect result, completes
	// the cart, and then navigates on. It is standalone — not inside Checkout.Root.
	//
	// Checkout derives this route's absolute URL from SITE_URL.
	import { STRIPE_KEY } from '$app/env/public'
	import { Return } from '#lib/components/ui/checkout/index.js'
	import { Metadata } from '#lib/components/ui/seo/index.js'
	import { rememberOrder } from '#lib/medusa/order-summary.js'
</script>

<Metadata config={{ title: t('Order confirmation'), noindex: true }} />

<section class="min-h-[60vh] bg-white px-4 py-24">
	<Return publishableKey={STRIPE_KEY} redirectTo="/success" oncomplete={rememberOrder} />
</section>
