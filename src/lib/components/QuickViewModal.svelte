<script lang="ts">
	import { t, l } from '$lib/i18n';
	import X from '@lucide/svelte/icons/x';

	interface QuickViewProduct {
		id?: string;
		name: string;
		price: string;
		description: string;
		images: string[];
		colors: Array<{
			name: string;
			hex: string;
			texture?: string;
		}>;
		sizes: string[];
	}

	interface Props {
		product: QuickViewProduct | null;
		isOpen: boolean;
		onClose: () => void;
	}

	let { product, isOpen, onClose }: Props = $props();

	let selectedColor = $state(0);
	let selectedSize = $state('');

	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	});

	$effect(() => {
		if (product) {
			selectedColor = 0;
			selectedSize = '';
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleAddToSelection() {
		console.log('Added to cart:', {
			product: product?.name,
			color: product?.colors[selectedColor]?.name,
			size: selectedSize
		});
		onClose();
	}
</script>

{#if isOpen && product}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center backdrop-atelier"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="relative w-full h-full md:w-[80vw] md:h-[80vh] bg-surface-white flex flex-col md:flex-row overflow-hidden md:shadow-luxury-lg"
		>
			<button
				onclick={onClose}
				class="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 flex items-center justify-center bg-white md:bg-transparent rounded-full md:rounded-none text-gray-900 hover:text-gray-600 transition-colors shadow-md md:shadow-none"
				aria-label={t('Close quick view')}
			>
				<X class="w-5 h-5" strokeWidth={1} />
			</button>

			<div class="md:hidden w-full">
				<div
					class="flex space-x-3 px-4 py-6 overflow-x-auto scrollbar-hide"
					style="scroll-snap-type: x mandatory"
				>
					{#each product.images as image, index (index)}
						<div
							class="flex-shrink-0 w-[70vw] bg-white border border-gray-200"
							style="aspect-ratio: 3/4; scroll-snap-align: center"
						>
							<img
								src={image}
								alt={`${product.name} - View ${index + 1}`}
								class="w-full h-full object-cover"
							/>
						</div>
					{/each}
				</div>
			</div>

			<div class="hidden md:block md:w-[60%] h-full overflow-y-auto scrollbar-hide bg-gray-50">
				<div class="p-8 space-y-4">
					{#each product.images as image, index (index)}
						<div class="relative w-full bg-white" style="aspect-ratio: 4/5">
							<img
								src={image}
								alt={`${product.name} - View ${index + 1}`}
								class="w-full h-full object-cover"
							/>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex-1 md:w-[40%] h-full overflow-y-auto p-6 md:p-12 flex flex-col bg-surface-white">
				<div class="space-y-6">
					<h2 class="text-2xl md:text-3xl font-serif text-gray-900">
						{product.name}
					</h2>

					<p class="text-base md:text-lg text-gray-900">{product.price}</p>

					<p class="text-sm md:text-base leading-relaxed text-gray-700">
						{product.description}
					</p>

					<div class="pt-4">
						<label class="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
							{t('Color — {name}', { name: product.colors[selectedColor]?.name })}
						</label>
						<div class="flex gap-3">
							{#each product.colors as color, index (color.name)}
								<button
									onclick={() => (selectedColor = index)}
									class="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all {selectedColor ===
									index
										? 'border-gray-900 scale-110'
										: 'border-gray-200 hover:border-gray-400'}"
									style="background-color: {color.hex}; {color.texture
										? `background-image: url(${color.texture}); background-size: cover;`
										: ''}"
									aria-label={color.name}
									title={color.name}
								></button>
							{/each}
						</div>
					</div>

					<div class="pt-4">
						<label class="text-xs tracking-widest uppercase text-gray-500 mb-4 block">
							{t('Size')}{selectedSize ? ` — ${selectedSize}` : ''}
						</label>
						<div class="grid grid-cols-4 gap-2">
							{#each product.sizes as size (size)}
								<button
									onclick={() => (selectedSize = size)}
									class="py-3 px-4 text-xs tracking-wider uppercase border transition-all {selectedSize ===
									size
										? 'border-gray-900 bg-gray-900 text-white'
										: 'border-gray-300 bg-white text-gray-900 hover:border-gray-900'}"
								>
									{size}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-3 pt-6">
						<button
							onclick={handleAddToSelection}
							disabled={!selectedSize}
							class="w-full py-4 px-8 btn-primary-cta text-sm tracking-[0.2em] uppercase font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:opacity-100"
						>
							{t('Add to Selection')}
						</button>

						{#if product.id}
							<a
								href={l(`/product/${product.id}`)}
								class="w-full py-4 px-8 block text-center border-2 border-gray-900 text-gray-900 text-sm tracking-[0.2em] uppercase font-medium hover:bg-gray-900 hover:text-white transition-all"
								onclick={onClose}
							>
								{t('View Full Details')}
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
