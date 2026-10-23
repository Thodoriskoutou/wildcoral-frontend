<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { untrack } from 'svelte';
	import Tag from '@lucide/svelte/icons/tag';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	interface Props {
		onApply?: (code: string) => void;
		/**
		 * Live mode: validate the code against the real cart (e.g. Medusa's addPromotion). When omitted
		 * the component falls back to the wireframe's built-in demo codes.
		 */
		apply?: (code: string) => Promise<{ ok: boolean; message?: string }>;
		/** Live mode: called when the visitor removes the applied code. */
		remove?: (code: string) => Promise<void>;
		/** A code already on the cart (shown as applied on first render). */
		initialCode?: string | null;
		class?: string;
	}

	let { onApply, apply, remove, initialCode = null, class: className = '' }: Props = $props();

	type CouponState = 'idle' | 'success' | 'error';

	let code = $state('');
	let couponState = $state<CouponState>('idle');
	let message = $state('');
	// `initialCode` seeds the applied state once; after that this component owns it.
	const seededCode = untrack(() => initialCode);
	let appliedCode = $state<string | null>(seededCode);
	let working = $state(false);
	if (seededCode) {
		couponState = 'success';
		message = t('{code} applied - Discount applied', { code: seededCode });
	}

	const validCodes = ['SUMMER20', 'FIRST10', 'VIP15'];

	async function handleApply() {
		if (!code.trim() || working) return;

		if (apply) {
			const entered = code.trim().toUpperCase();
			working = true;
			try {
				const result = await apply(entered);
				if (result.ok) {
					couponState = 'success';
					message = t('{code} applied - {message}', { code: entered, message: result.message ?? t('Discount applied') });
					appliedCode = entered;
					onApply?.(entered);
				} else {
					couponState = 'error';
					message = result.message ?? t('Invalid coupon code');
					setTimeout(() => {
						couponState = 'idle';
						message = '';
					}, 3000);
				}
			} finally {
				working = false;
			}
			return;
		}

		if (validCodes.includes(code.toUpperCase())) {
			couponState = 'success';
			message = `${code.toUpperCase()} applied - 20% off`;
			appliedCode = code.toUpperCase();
			onApply?.(code.toUpperCase());
		} else {
			couponState = 'error';
			message = t('Invalid coupon code');
			setTimeout(() => {
				couponState = 'idle';
				message = '';
			}, 3000);
		}
	}

	async function handleRemove() {
		if (remove && appliedCode) {
			working = true;
			try {
				await remove(appliedCode);
			} finally {
				working = false;
			}
		}
		code = '';
		couponState = 'idle';
		message = '';
		appliedCode = null;
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleApply();
		}
	}
</script>

{#if couponState === 'success' && appliedCode}
	<div class="border-2 border-green-500 bg-green-50 p-4 {className}">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="bg-green-500 text-white p-2">
					<Check class="w-4 h-4" />
				</div>
				<div>
					<p class="text-sm font-medium text-green-900">{t('Coupon Applied')}</p>
					<p class="text-xs text-green-700 tracking-wider uppercase mt-0.5">
						{appliedCode} - {message.split(' - ')[1]}
					</p>
				</div>
			</div>
			<button
				onclick={handleRemove}
				class="text-green-700 hover:text-green-900 transition-colors"
				aria-label={t('Remove coupon')}
			>
				<X class="w-5 h-5" />
			</button>
		</div>
	</div>
{:else}
	<div class={className}>
		<div class="flex items-center gap-3">
			<div class="relative flex-1">
				<Tag class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
				<input
					type="text"
					bind:value={code}
					onkeypress={handleKeyPress}
					placeholder={t('Enter coupon code')}
					class="w-full border-2 pl-10 pr-4 py-3 text-sm tracking-wide uppercase outline-none transition-colors {couponState ===
					'error'
						? 'border-red-500 focus:border-red-600'
						: 'border-gray-300 focus:border-gray-900'}"
				/>
			</div>
			<button
				onclick={handleApply}
				disabled={!code.trim() || working}
				class="px-6 py-3 bg-gray-900 text-white text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
			>
				{t('Apply')}
			</button>
		</div>

		{#if couponState === 'error' && message}
			<div class="flex items-center gap-2 text-red-600 text-xs mt-2">
				<CircleAlert class="w-3 h-3" />
				<span>{message}</span>
			</div>
		{/if}

		{#if couponState === 'idle' && !apply}
			<p class="text-xs text-gray-500 mt-2">{t('Valid codes: SUMMER20, FIRST10, VIP15')}</p>
		{/if}
	</div>
{/if}
