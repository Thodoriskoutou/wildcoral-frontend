<script lang="ts">
	import { t, l } from '$lib/i18n';
	// Account: the Wild Coral account pages, on the customer's real Medusa data.
	//
	// Signed out → the split sign-in / register screen (the registry's auth forms, styled to the
	// design). Signed in → welcome, orders (each opens its tracking page), profile and saved
	// addresses. The customer is read with `getCustomer()`; the auth forms refresh that query on
	// success, so the page swaps views on its own.
	import { getCustomer, updateCustomer, getAddresses, deleteAddress, getProductQuery } from 'sveltekit-medusa-sdk';
	import * as Auth from '$lib/components/ui/auth';
	import { logout } from 'sveltekit-medusa-sdk/auth';
	import { Metadata } from '$lib/components/ui/seo';
	import { getMyOrders } from '$lib/medusa/tracking.remote';
	import { getSavedProductIds } from '$lib/medusa/wishlist.remote';
	import { wishlist } from '$lib/medusa/wishlist-state.svelte';
	import { toCatalogProduct, formatPrice, PRODUCT_FIELDS } from '$lib/medusa/catalog';
	import ProductMedia from '$lib/components/ProductMedia.svelte';
	import { safe } from '$lib/medusa/safe';
	import { photos } from '$lib/site';
	import { dev } from '$app/env';
	import OrderCard from '$lib/components/account/OrderCard.svelte';

	// Wireframe styling for the registry's form parts.
	const labelClass = 'text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700';
	const inputClass =
		'w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors';
	const submitClass =
		'w-full bg-gray-900 text-white py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all';

	type Mode = 'login' | 'register' | 'forgot';
	let mode = $state<Mode>('login');
	let forgotSent = $state(false);

	// The wishlist plugin stores product ids; the products themselves are read from the catalog.
	async function loadSavedProducts() {
		const { productIds } = await getSavedProductIds();
		const products = await Promise.all(
			productIds.slice(0, 24).map((id) => getProductQuery({ id, fields: PRODUCT_FIELDS }).catch(() => null))
		);
		return products.filter((p) => !!p).map(toCatalogProduct);
	}

	async function removeSaved(productId: string) {
		if ((await wishlist.set(productId, false)) === 'removed') removedIds = [...removedIds, productId];
	}

	// One request round: the customer first, then (only if signed in) orders and addresses in
	// parallel. Orders/addresses fail independently, so a hiccup there doesn't hide the account.
	const account = $derived(
		await safe(async () => {
			const customer = await getCustomer();
			if (!customer) return { customer: null, orders: null, addresses: null, saved: null };
			const [orders, addresses, saved] = await Promise.all([
				safe(() => getMyOrders()),
				safe(() => getAddresses()),
				safe(loadSavedProducts)
			]);
			return { customer, orders, addresses, saved };
		})
	);
	const customer = $derived(account.data?.customer ?? null);
	const ordersResult = $derived(account.data?.orders ?? { data: null, error: null });
	const addressesResult = $derived(account.data?.addresses ?? { data: null, error: null });
	const savedResult = $derived(account.data?.saved ?? { data: null, error: null });
	// Products the customer removed here disappear at once, before the list is fetched again.
	let removedIds = $state<string[]>([]);
	const savedProducts = $derived((savedResult.data ?? []).filter((p) => !removedIds.includes(p.id)));
	const orders = $derived(ordersResult.data ?? []);
	const addresses = $derived(addressesResult.data ?? []);
	const openOrders = $derived(orders.filter((o) => o.phase === 'processing' || o.phase === 'shipped').length);

	const displayName = $derived(
		[customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || customer?.email?.split('@')[0] || ''
	);

	// Sign-up: Medusa's register call takes only an email and password, so the name typed here is
	// saved to the new customer right after the account is created (see `onregistered`). These two
	// inputs have no `name`, so they are not sent along with the form itself.
	let signUpFirst = $state('');
	let signUpLast = $state('');
	async function saveNameAfterSignUp() {
		const first_name = signUpFirst.trim();
		const last_name = signUpLast.trim();
		if (first_name || last_name) await updateCustomer({ first_name, last_name });
	}

	// Profile editing
	let editing = $state(false);
	let saving = $state(false);
	let profileMessage = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let phone = $state('');

	function startEditing() {
		firstName = customer?.first_name ?? '';
		lastName = customer?.last_name ?? '';
		phone = customer?.phone ?? '';
		profileMessage = '';
		editing = true;
	}

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (saving) return;
		saving = true;
		profileMessage = '';
		try {
			await updateCustomer({ first_name: firstName, last_name: lastName, phone });
			await getCustomer().refresh();
			editing = false;
		} catch {
			profileMessage = t('Could not save your details. Please try again.');
		} finally {
			saving = false;
		}
	}

	async function removeAddress(id: string) {
		try {
			await deleteAddress(id);
			await getAddresses().refresh();
		} catch {
			/* leave the list as is */
		}
	}

	let signingOut = $state(false);
	async function signOut() {
		if (signingOut) return;
		signingOut = true;
		try {
			await logout();
			await getCustomer().refresh();
			void wishlist.load(true);
			mode = 'login';
		} finally {
			signingOut = false;
		}
	}
</script>

<Metadata config={{ title: t('Account'), noindex: true }} />

{#if !customer}
	<div class="min-h-screen bg-white">
		<div class="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
			<div class="relative bg-gray-900 min-h-[50vh] lg:min-h-screen">
				<img src={photos.account} alt="" class="absolute inset-0 h-full w-full object-cover object-[50%_25%]" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
					<div class="text-white max-w-md">
						<h2 class="text-3xl font-serif mb-4 leading-tight">{t('Your Personal Sanctuary')}</h2>
						<p class="text-sm leading-relaxed opacity-90">
							{t('Track your orders and keep your details — all in one place.')}
						</p>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-center p-8 lg:p-16">
				<div class="w-full max-w-md">
					<!-- No usable customer: signed out, an expired session, or Medusa unreachable. Signing in
					     again recovers the first two; the dev note explains the third. -->
					{#if dev && account.error}
						<p class="text-xs text-gray-400 mb-8">{t('Dev note: {error}', { error: account.error })}</p>
					{/if}
					{#if mode === 'login'}
						<h1 class="text-4xl font-serif mb-2">{t('Welcome Back')}</h1>
						<p class="text-sm text-gray-600 mb-12">{t('Sign in to your account')}</p>

						<Auth.LoginForm class="space-y-6">
							<Auth.Field name="email">
								<Auth.Label class={labelClass}>{t('Email Address')}</Auth.Label>
								<Auth.Input type="email" autocomplete="email" class={inputClass} />
								<Auth.Error />
							</Auth.Field>
							<Auth.Field name="password">
								<Auth.Label class={labelClass}>{t('Password')}</Auth.Label>
								<Auth.Input type="password" autocomplete="current-password" class={inputClass} />
								<Auth.Error />
							</Auth.Field>
							<Auth.Error />
							<div class="flex justify-end text-sm">
								<button
									type="button"
									onclick={() => {
										forgotSent = false;
										mode = 'forgot';
									}}
									class="underline hover:opacity-70 transition-opacity"
								>
									{t('Forgot password?')}
								</button>
							</div>
							<Auth.Submit class={submitClass}>{t('Sign In')}</Auth.Submit>
						</Auth.LoginForm>

						<div class="mt-8 pt-8 border-t border-gray-200 text-center">
							<p class="text-sm text-gray-600 mb-4">{t('New here? Create an account to track your orders.')}</p>
							<button onclick={() => (mode = 'register')} class="text-sm underline hover:opacity-70 transition-opacity">
								{t('Create an Account')}
							</button>
						</div>
					{:else if mode === 'register'}
						<h1 class="text-4xl font-serif mb-2">{t('Join the Muse List')}</h1>
						<p class="text-sm text-gray-600 mb-12">{t('Create your account')}</p>

						<Auth.RegisterForm class="space-y-6" onregistered={saveNameAfterSignUp}>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<label for="signup-first" class={labelClass}>{t('First Name')}</label>
									<input id="signup-first" class={inputClass} bind:value={signUpFirst} autocomplete="given-name" />
								</div>
								<div>
									<label for="signup-last" class={labelClass}>{t('Last Name')}</label>
									<input id="signup-last" class={inputClass} bind:value={signUpLast} autocomplete="family-name" />
								</div>
							</div>
							<Auth.Field name="email">
								<Auth.Label class={labelClass}>{t('Email Address')}</Auth.Label>
								<Auth.Input type="email" autocomplete="email" class={inputClass} />
								<Auth.Error />
							</Auth.Field>
							<Auth.Field name="password">
								<Auth.Label class={labelClass}>{t('Password')}</Auth.Label>
								<Auth.Input type="password" autocomplete="new-password" minlength={8} class={inputClass} />
								<p class="mt-2 text-xs text-gray-500">{t('At least 8 characters.')}</p>
								<Auth.Error />
							</Auth.Field>
							<Auth.Error />
							<Auth.Submit class={submitClass}>{t('Create Account')}</Auth.Submit>
						</Auth.RegisterForm>

						<div class="mt-8 pt-8 border-t border-gray-200 text-center">
							<p class="text-sm text-gray-600 mb-4">{t('Already have an account?')}</p>
							<button onclick={() => (mode = 'login')} class="text-sm underline hover:opacity-70 transition-opacity">
								{t('Sign In')}
							</button>
						</div>
					{:else}
						<h1 class="text-4xl font-serif mb-2">{t('Reset Password')}</h1>
						<p class="text-sm text-gray-600 mb-12">{t('We\'ll email you a link to choose a new one')}</p>

						{#if forgotSent}
							<p class="text-sm text-gray-700 leading-relaxed">
								{t('If an account exists for that email, we\'ve sent a link to reset your password.')}
							</p>
						{:else}
							<Auth.ForgotForm class="space-y-6" onsuccess={() => (forgotSent = true)}>
								<Auth.Field name="email">
									<Auth.Label class={labelClass}>{t('Email Address')}</Auth.Label>
									<Auth.Input type="email" autocomplete="email" class={inputClass} />
									<Auth.Error />
								</Auth.Field>
								<Auth.Error />
								<Auth.Submit class={submitClass}>{t('Send Reset Link')}</Auth.Submit>
							</Auth.ForgotForm>
						{/if}

						<div class="mt-8 pt-8 border-t border-gray-200 text-center">
							<button onclick={() => (mode = 'login')} class="text-sm underline hover:opacity-70 transition-opacity">
								{t('Back to Sign In')}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="bg-white min-h-screen">
		<div class="border-b border-gray-200 py-16">
			<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
				<h1 class="text-5xl md:text-6xl font-serif mb-4">{t('Welcome back, {displayName}', { displayName })}</h1>
				<p class="text-lg text-gray-600">{t('Your personal sanctuary')}</p>
			</div>
		</div>

		<div class="h-32"></div>

		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 pb-32">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
				<a href={l('/shop')} class="border-2 border-gray-200 p-8 hover:border-gray-900 transition-colors group">
					<h3 class="text-lg font-serif mb-2 group-hover:opacity-70 transition-opacity">{t('Continue Shopping')}</h3>
					<p class="text-sm text-gray-600">{t('Explore new arrivals')}</p>
				</a>

				<a href="#orders" class="border-2 border-gray-200 p-8 hover:border-gray-900 transition-colors group text-left">
					<h3 class="text-lg font-serif mb-2 group-hover:opacity-70 transition-opacity">{t('Track Your Orders')}</h3>
					<p class="text-sm text-gray-600">
						{#if openOrders}
							{t('{count} order on the way|{count} orders on the way', { count: openOrders })}
						{:else}
							{t('View your order history')}
						{/if}
					</p>
				</a>

				<a href="#wishlist" class="border-2 border-gray-200 p-8 hover:border-gray-900 transition-colors group text-left">
					<h3 class="text-lg font-serif mb-2 group-hover:opacity-70 transition-opacity">{t('Wishlist')}</h3>
					<p class="text-sm text-gray-600">
						{savedProducts.length ? t('{count} saved piece|{count} saved pieces', { count: savedProducts.length }) : t('Pieces you love, saved for later')}
					</p>
				</a>

				<a href={l('/customer-care')} class="border-2 border-gray-200 p-8 hover:border-gray-900 transition-colors group text-left">
					<h3 class="text-lg font-serif mb-2 group-hover:opacity-70 transition-opacity">{t('Customer Care')}</h3>
					<p class="text-sm text-gray-600">{t('Sizing, shipping and returns')}</p>
				</a>
			</div>

			<div id="orders" class="mb-24 scroll-mt-32">
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-3xl font-serif">{t('Orders')}</h2>
				</div>

				{#if ordersResult.error}
					<p class="text-sm text-gray-600">{dev ? ordersResult.error : t('Your orders could not be loaded right now.')}</p>
				{:else if orders.length === 0}
					<div class="border-2 border-gray-200 p-12 text-center">
						<p class="text-gray-600 mb-6">{t('You haven\'t placed an order yet.')}</p>
						<a
							href={l('/shop')}
							class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
						>
							{t('Explore Collection')}
						</a>
					</div>
				{:else}
					<div class="space-y-6">
						{#each orders as order (order.id)}
							<OrderCard {order} />
						{/each}
					</div>
				{/if}
			</div>

			<div id="wishlist" class="mb-24 scroll-mt-32">
				<h2 class="text-3xl font-serif mb-8">{t('Wishlist')}</h2>

				{#if savedResult.error}
					<p class="text-sm text-gray-600">{dev ? savedResult.error : t('Your wishlist could not be loaded right now.')}</p>
				{:else if savedProducts.length === 0}
					<div class="border-2 border-gray-200 p-12 text-center">
						<p class="text-gray-600 mb-6">{t('Nothing saved yet. Tap “Save for Later” on a piece you love.')}</p>
						<a
							href={l('/shop')}
							class="inline-block border-2 border-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all"
						>
							{t('Explore Collection')}
						</a>
					</div>
				{:else}
					<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
						{#each savedProducts as product (product.id)}
							<div class="group">
								<a href={l(`/product/${product.handle}`)} class="block">
									<div class="relative aspect-[4/5] bg-gray-100 border border-gray-200 mb-3 overflow-hidden">
										<ProductMedia src={product.media[0]} poster={product.images[0]} alt={product.name} />
									</div>
									<p class="text-sm group-hover:opacity-70 transition-opacity">{product.name}</p>
									<p class="text-sm text-gray-600">{formatPrice(product.price, product.currency)}</p>
								</a>
								<button
									onclick={() => removeSaved(product.id)}
									disabled={wishlist.busy === product.id}
									class="mt-2 text-xs underline text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
								>
									{t('Remove')}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="border-t border-gray-200 pt-16">
				<h2 class="text-3xl font-serif mb-8">{t('Account Settings')}</h2>

				<div class="space-y-4">
					<div class="border-2 border-gray-200 p-6">
						{#if !editing}
							<div class="flex items-center justify-between">
								<div class="text-left">
									<h3 class="text-sm font-medium mb-1">{t('Personal Information')}</h3>
									<p class="text-sm text-gray-600">{customer.email}</p>
									{#if customer.first_name || customer.last_name || customer.phone}
										<p class="text-sm text-gray-600">
											{[displayName, customer.phone].filter(Boolean).join(' · ')}
										</p>
									{/if}
								</div>
								<button onclick={startEditing} class="text-sm underline hover:opacity-70 transition-opacity">{t('Edit')}</button>
							</div>
						{:else}
							<form onsubmit={saveProfile} class="space-y-4">
								<h3 class="text-sm font-medium">{t('Personal Information')}</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="acct-first" class={labelClass}>{t('First Name')}</label>
										<input id="acct-first" class={inputClass} bind:value={firstName} autocomplete="given-name" />
									</div>
									<div>
										<label for="acct-last" class={labelClass}>{t('Last Name')}</label>
										<input id="acct-last" class={inputClass} bind:value={lastName} autocomplete="family-name" />
									</div>
								</div>
								<div>
									<label for="acct-phone" class={labelClass}>{t('Phone')}</label>
									<input id="acct-phone" type="tel" class={inputClass} bind:value={phone} autocomplete="tel" />
								</div>
								{#if profileMessage}
									<p role="alert" class="text-sm text-red-700">{profileMessage}</p>
								{/if}
								<div class="flex gap-4">
									<button
										type="submit"
										disabled={saving}
										class="bg-gray-900 text-white px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all disabled:opacity-50"
									>
										{saving ? t('Saving…') : t('Save')}
									</button>
									<button type="button" onclick={() => (editing = false)} class="text-sm underline hover:opacity-70 transition-opacity">
										{t('Cancel')}
									</button>
								</div>
							</form>
						{/if}
					</div>

					<div class="border-2 border-gray-200 p-6">
						<h3 class="text-sm font-medium mb-1">{t('Shipping Addresses')}</h3>
						{#if addresses.length === 0}
							<p class="text-sm text-gray-600">{t('No saved addresses yet.')}</p>
						{:else}
							<ul class="mt-4 divide-y divide-gray-200">
								{#each addresses as address (address.id)}
									<li class="flex items-start justify-between gap-6 py-4 text-sm text-gray-700">
										<div class="leading-relaxed">
											<p>{[address.first_name, address.last_name].filter(Boolean).join(' ')}</p>
											<p>{[address.address_1, address.address_2].filter(Boolean).join(', ')}</p>
											<p>
												{[address.postal_code, address.city, address.province].filter(Boolean).join(' ')}
												{address.country_code?.toUpperCase()}
											</p>
										</div>
										<button
											onclick={() => removeAddress(address.id)}
											class="text-xs underline text-gray-500 hover:text-gray-900 transition-colors"
										>
											{t('Remove')}
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<button
					onclick={signOut}
					disabled={signingOut}
					class="mt-8 text-sm underline text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
				>
					{t('Sign Out')}
				</button>
			</div>
		</div>
	</div>
{/if}
