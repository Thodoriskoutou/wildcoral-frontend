<script lang="ts">
	import type { RemoteForm } from '@sveltejs/kit'
	import type { StoreOrder } from '@medusajs/types'
	// sveltekit-medusa-sdk@2.18.0 ships this generic address form as `braintreeCheckoutForm` (it is not
	// Braintree-specific); newer registry code refers to it as `checkoutForm`.
	import { braintreeCheckoutForm as checkoutForm } from 'sveltekit-medusa-sdk'
	import Root from './checkout.svelte'
	import Body from './checkout-braintree-body.svelte'

	interface Props {
		form?: RemoteForm<any, any>
		googlePlacesApiKey?: string
		restrictToCurrentRegion?: boolean
		navigate?: (url: string) => void | Promise<void>
		redirectTo?: string | ((order: StoreOrder) => string)
		oncomplete?: (order: StoreOrder) => void
		onerror?: (err: unknown) => void
		class?: string
	}
	let { form = checkoutForm as unknown as RemoteForm<any, any>, googlePlacesApiKey, restrictToCurrentRegion, ...rest }: Props = $props()
</script>

<form {...form}>
	<Root {form} {...rest}>
		<Body {form} {googlePlacesApiKey} {restrictToCurrentRegion} />
	</Root>
</form>
