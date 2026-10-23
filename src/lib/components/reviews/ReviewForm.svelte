<script lang="ts">
	import { t } from '$lib/i18n';
	// Write (or edit) a review of something the signed-in customer bought and received.
	import { untrack } from 'svelte';
	import { submitReview } from '$lib/medusa/reviews.remote';
	import type { ReviewableItem } from '$lib/medusa/reviews';
	import RatingInput from './RatingInput.svelte';

	let { productId, items, onsaved }: { productId: string; items: ReviewableItem[]; onsaved?: () => void | Promise<void> } = $props();

	const labelClass = 'text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700';
	const inputClass =
		'w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors';

	let itemId = $state('');
	let rating = $state(0);
	let content = $state('');
	let submitting = $state(false);
	let error = $state('');
	let done = $state<'live' | 'pending' | null>(null);

	// Pick the first item that hasn't been reviewed yet (else the first one) whenever the list changes.
	$effect(() => {
		if (!items.some((i) => i.itemId === itemId)) itemId = (items.find((i) => !i.existing) ?? items[0])?.itemId ?? '';
	});
	const selected = $derived(items.find((i) => i.itemId === itemId));

	// Switching item loads what was written for it (or a blank form). Only the chosen item re-runs this,
	// not the list: saving refreshes the list, and that must not wipe the "thank you" message.
	$effect(() => {
		const id = itemId;
		untrack(() => {
			const item = items.find((i) => i.itemId === id);
			rating = item?.existing?.rating ?? 0;
			content = item?.existing?.content ?? '';
			error = '';
			done = null;
		});
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || !selected) return;
		if (!rating) return void (error = t('Please choose a star rating.'));
		if (content.trim().length < 10) return void (error = t('Please write at least a sentence.'));
		submitting = true;
		error = '';
		try {
			const result = await submitReview({ productId, orderId: selected.orderId, itemId: selected.itemId, rating, content });
			if (result.ok) {
				done = result.status === 'approved' ? 'live' : 'pending';
				await onsaved?.();
			} else if (result.code === 'signed_out') {
				error = t('Please sign in again to write a review.');
			} else if (result.code === 'not_allowed') {
				error = t('This item can’t be reviewed yet.');
			} else {
				error = t('Your review could not be saved. Please try again.');
			}
		} catch {
			error = t('Your review could not be saved. Please try again.');
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={submit} class="space-y-6 border-2 border-gray-200 p-6 md:p-8" aria-labelledby="review-form-heading">
	<h3 id="review-form-heading" class="text-xl font-serif">{selected?.existing ? t('Edit your review') : t('Write a review')}</h3>

	{#if items.length > 1}
		<div>
			<label for="review-item" class={labelClass}>{t('Which purchase?')}</label>
			<select id="review-item" class={inputClass} bind:value={itemId}>
				{#each items as item (item.itemId)}
					<option value={item.itemId}>
						{item.orderNumber}{item.variant ? ` · ${item.variant}` : ''}{item.existing ? ` (${t('reviewed')})` : ''}
					</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if selected?.existing?.status === 'pending'}
		<p class="text-sm text-gray-600">{t('Your review is waiting for approval. You can still edit it below.')}</p>
	{/if}

	<div>
		<span class={labelClass} id="review-rating-label">{t('Rating')}</span>
		<RatingInput bind:value={rating} label={t('Your rating')} />
	</div>

	<div>
		<label for="review-content" class={labelClass}>{t('Your review')}</label>
		<textarea
			id="review-content"
			class="{inputClass} min-h-32"
			rows="5"
			maxlength="2000"
			placeholder={t('How does it fit? How does it feel? Would you recommend it?')}
			bind:value={content}
		></textarea>
	</div>

	{#if error}
		<p role="alert" class="text-sm text-red-700">{error}</p>
	{/if}
	{#if done}
		<p role="status" class="text-sm text-green-800">
			{done === 'live' ? t('Thank you! Your review is now live.') : t('Thank you! Your review will appear once we have approved it.')}
		</p>
	{/if}

	<button
		type="submit"
		disabled={submitting}
		class="bg-gray-900 px-8 py-3 text-sm uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
	>
		{submitting ? t('Sending…') : selected?.existing ? t('Update review') : t('Submit review')}
	</button>
</form>
