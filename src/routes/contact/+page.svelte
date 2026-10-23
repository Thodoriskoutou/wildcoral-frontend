<script lang="ts">
	import { t, l, localized } from '#lib/i18n/index.js';
	// Contact: Medusa validates and delivers this form through its configured SMTP Notification Module.
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Clock from '@lucide/svelte/icons/clock';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { page } from '$app/state';
	import { getCustomer } from 'sveltekit-medusa-sdk/customer';
	import { Metadata } from '#lib/components/ui/seo/index.js';
	import SocialIcon, { type SocialNetwork } from '#lib/components/icons/SocialIcon.svelte';
	import { site } from '#lib/site.js';
	import { TOPICS, isTopic } from '#lib/contact.js';
	import { sendContactMessage } from '#lib/contact.remote.js';
	import { safe } from '#lib/medusa/safe.js';

	const labelClass = 'text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700';
	const inputClass =
		'w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors aria-invalid:border-red-600';

	// A signed-in customer doesn't have to type their name and email again.
	const customer = $derived((await safe(() => getCustomer())).data ?? null);

	const fields = sendContactMessage.fields;
	let sent = $state(false);
	let failure = $state('');

	const FAILURES = {
		rate_limited: t('You’ve sent a few messages already. Please wait a few minutes and try again.'),
		send_failed: t('Your message couldn’t be sent. Please try again, or email us directly.'),
		network: t('Could not reach the server. Please check your connection and try again.')
	} as const;

	const enhanced = sendContactMessage.enhance(async ({ submit }) => {
		failure = '';
		try {
			await submit();
		} catch {
			failure = FAILURES.network;
			return;
		}
		const result = sendContactMessage.result;
		if (result?.ok) sent = true;
		else if (result) failure = FAILURES[result.code];
	});

	// Links elsewhere on the site open this page ready to fill in: /contact?topic=order&order=1041
	// or /contact?topic=sizing&product=Sequin%20Ring%20Bikini
	let prefilled = false;
	$effect(() => {
		if (prefilled) return;
		prefilled = true;
		const q = page.url.searchParams;
		const topic = q.get('topic');
		const product = q.get('product');
		fields.set({
			topic: isTopic(topic) ? topic : 'other',
			order: q.get('order') ?? '',
			message: product ? t('About the {product}: ', { product }) : ''
		});
	});
	$effect(() => {
		if (!customer) return;
		const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
		if (!fields.name.value() && name) fields.name.set(name);
		if (!fields.email.value() && customer.email) fields.email.set(customer.email);
	});

	const socials = Object.entries(site.social).filter(([, url]) => !!url) as [SocialNetwork, string][];
	const hasDetails = $derived(!!(site.contactEmail || site.phone || site.address || site.supportHours));
</script>

<Metadata config={{ title: t('Contact'), description: t('Get in touch with {name}.', { name: site.name }) }} />

<div class="bg-white min-h-screen">
	<div class="border-b border-gray-200 py-16 mt-16 md:mt-20">
		<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
			<h1 class="text-5xl md:text-6xl font-serif mb-4">{t('Contact')}</h1>
			<p class="text-lg text-gray-600">{t('Questions about sizing, an order or a piece? Write to us.')}</p>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-16 md:py-24">
		<div class="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24">
			<!-- The message -->
			<section aria-labelledby="message-heading">
				<h2 id="message-heading" class="text-3xl font-serif mb-8">{t('Send a message')}</h2>

				{#if sent}
					<div class="border-2 border-gray-200 p-8 md:p-12" role="status">
						<CircleCheck class="size-8 mb-4" strokeWidth={1.5} />
						<p class="text-xl font-serif mb-3">{t('Thank you, your message is on its way.')}</p>
						<p class="text-sm text-gray-600 leading-relaxed mb-8">
							{t('We’ll reply to {email}. Please check your spam folder if you don’t hear from us.', { email: fields.email.value() })}
						</p>
						<button
							type="button"
							onclick={() => {
								sent = false;
								fields.message.set('');
							}}
							class="text-sm underline hover:opacity-70 transition-opacity"
						>
							{t('Send another message')}
						</button>
					</div>
				{:else}
					<form {...enhanced} class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="contact-name" class={labelClass}>{t('Name')}</label>
								<input id="contact-name" class={inputClass} autocomplete="name" required maxlength="100" {...fields.name.as('text')} />
								{#each (fields.name.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
							</div>
							<div>
								<label for="contact-email" class={labelClass}>{t('Email')}</label>
								<input id="contact-email" class={inputClass} autocomplete="email" required maxlength="200" {...fields.email.as('email')} />
								{#each (fields.email.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="contact-topic" class={labelClass}>{t('Topic')}</label>
								<select id="contact-topic" class={inputClass} {...fields.topic.as('select')}>
									{#each Object.entries(TOPICS) as [key, label] (key)}
										<option value={key}>{t(label)}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="contact-order" class={labelClass}>{t('Order number')} <span class="normal-case tracking-normal text-gray-500">{t('(optional)')}</span></label>
								<input id="contact-order" class={inputClass} maxlength="40" placeholder="e.g. 1041" {...fields.order.as('text')} />
							</div>
						</div>

						<div>
							<label for="contact-message" class={labelClass}>{t('Message')}</label>
							<textarea
								id="contact-message"
								rows="7"
								required
								minlength="10"
								maxlength="3000"
								class="{inputClass} min-h-40"
								{...fields.message.as('text')}
							></textarea>
							{#each (fields.message.issues() ?? []).slice(0, 1) as issue (issue.message)}<p role="alert" class="mt-2 text-sm text-red-700">{t(issue.message)}</p>{/each}
						</div>

						<!-- Honeypot: invisible to people, tempting to bots. -->
						<div class="absolute -left-[9999px]" aria-hidden="true">
							<label for="contact-website">{t('Leave this empty')}</label>
							<input id="contact-website" tabindex="-1" autocomplete="off" {...fields.website.as('text')} />
						</div>

						{#if failure}
							<p role="alert" class="text-sm text-red-700">{failure}</p>
						{/if}

						<p class="text-xs text-gray-500 leading-relaxed">
							{t('We use your details only to reply to your message.')}
							{#if site.legal.privacy}<a href={l(site.legal.privacy)} class="underline">{t('Privacy policy')}</a>.{/if}
						</p>

						<button
							type="submit"
							disabled={sendContactMessage.pending > 0}
							class="bg-gray-900 text-white px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all disabled:opacity-50"
						>
							{sendContactMessage.pending > 0 ? t('Sending…') : t('Send message')}
						</button>
					</form>
				{/if}
			</section>

			<!-- The details -->
			<aside aria-labelledby="details-heading" class="space-y-10">
				{#if hasDetails}
					<div>
						<h2 id="details-heading" class="text-3xl font-serif mb-8">{t('Details')}</h2>
						<ul class="space-y-5 text-sm text-gray-700">
							{#if site.contactEmail}
								<li class="flex items-start gap-3">
									<Mail class="size-4 mt-0.5 shrink-0" />
									<a href="mailto:{site.contactEmail}" class="underline hover:opacity-70 transition-opacity">{site.contactEmail}</a>
								</li>
							{/if}
							{#if site.phone}
								<li class="flex items-start gap-3">
									<Phone class="size-4 mt-0.5 shrink-0" />
									<a href="tel:{site.phone.replace(/[^+\d]/g, '')}" class="hover:opacity-70 transition-opacity">{site.phone}</a>
								</li>
							{/if}
							{#if site.address}
								<li class="flex items-start gap-3">
									<MapPin class="size-4 mt-0.5 shrink-0" />
									<span>{localized(site.address)}</span>
								</li>
							{/if}
							{#if site.supportHours}
								<li class="flex items-start gap-3">
									<Clock class="size-4 mt-0.5 shrink-0" />
									<span>{localized(site.supportHours)}</span>
								</li>
							{/if}
						</ul>
					</div>
				{/if}

				<div class="border-2 border-gray-200 p-6">
					<h3 class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-5">{t('Quick answers')}</h3>
					<ul class="space-y-3 text-sm">
						<li><a href={l('/customer-care')} class="underline hover:opacity-70 transition-opacity">{t('Size guide, shipping and returns')}</a></li>
						<li><a href={l('/order-track')} class="underline hover:opacity-70 transition-opacity">{t('Track an order')}</a></li>
					</ul>
				</div>

				{#if socials.length}
					<div>
						<h3 class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-5">{t('Follow us')}</h3>
						<div class="flex items-center gap-5">
							{#each socials as [network, url] (network)}
								<a href={l(url)} target="_blank" rel="noopener noreferrer" aria-label={network} class="hover:opacity-70 transition-opacity">
									<SocialIcon name={network} class="size-6" />
								</a>
							{/each}
						</div>
						{#if site.instagramHandle}<p class="mt-3 text-sm text-gray-600">{site.instagramHandle}</p>{/if}
					</div>
				{/if}
			</aside>
		</div>
	</div>
</div>
