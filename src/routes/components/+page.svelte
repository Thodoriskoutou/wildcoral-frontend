<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
	import QuickViewModal from '$lib/components/QuickViewModal.svelte';
	import FilteredArchiveHeader from '$lib/components/FilteredArchiveHeader.svelte';
	import EmptyFilterState from '$lib/components/EmptyFilterState.svelte';
	import ScrollProgressBar from '$lib/components/ScrollProgressBar.svelte';
	import ImageHoverZoom from '$lib/components/ImageHoverZoom.svelte';
	import ProductCardSkeleton from '$lib/components/ProductCardSkeleton.svelte';
	import TextLineSkeleton from '$lib/components/TextLineSkeleton.svelte';

	interface QuickViewProduct {
		id?: string;
		name: string;
		price: string;
		description: string;
		images: string[];
		colors: Array<{ name: string; hex: string; texture?: string }>;
		sizes: string[];
	}

	let quickViewProduct = $state<QuickViewProduct | null>(null);
	let activeFilters = $state([
		{ id: 'bikini', label: 'Bikini' },
		{ id: 'black', label: 'Black' }
	]);
	let showEmptyState = $state(false);

	const mockProduct: QuickViewProduct = {
		id: 'mediterranean-sunset-bikini',
		name: 'Mediterranean Sunset Bikini',
		price: '$198',
		description:
			'Hand-crafted from Italian lycra with UV protection. Designed for the modern muse who values both elegance and comfort.',
		images: [
			'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&h=1000&fit=crop',
			'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=800&h=1000&fit=crop',
			'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=800&h=1000&fit=crop'
		],
		colors: [
			{ name: 'Midnight Black', hex: '#000000' },
			{ name: 'Sunset Coral', hex: '#FF6B6B' },
			{ name: 'Ocean Blue', hex: '#4ECDC4' }
		],
		sizes: ['XS', 'S', 'M', 'L']
	};

	function handleRemoveFilter(id: string) {
		activeFilters = activeFilters.filter((f) => f.id !== id);
	}

	function handleClearAllFilters() {
		activeFilters = [];
	}
</script>

<div class="min-h-screen bg-canvas">
	<ScrollProgressBar />

	<div class="max-w-[1400px] mx-auto px-8 py-20">
		<div class="text-center mb-32">
			<div class="mb-8 flex justify-center">
				<Logo variant="normal" width={320} />
			</div>

			<h1 class="text-7xl md:text-8xl font-light font-serif tracking-tight mb-6">The Atelier</h1>
			<p class="text-xl leading-relaxed text-gray-700 max-w-2xl mx-auto">
				A comprehensive showcase of luxury components for high-end e-commerce
			</p>
		</div>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Brand Identity</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Wild Coral Brand System</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					Sophisticated neutrals that let vibrant swimwear photography lead the visual narrative.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
				<div class="bg-canvas p-12 rounded-lg border border-gray-200">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-6">Normal (Black)</p>
					<div class="flex items-center justify-center h-32">
						<Logo variant="normal" width={280} />
					</div>
					<p class="text-sm text-gray-600 mt-6">Use on light backgrounds</p>
				</div>

				<div class="bg-stone-900 p-12 rounded-lg">
					<p class="text-xs tracking-widest uppercase text-gray-400 mb-6">Reverse (White)</p>
					<div class="flex items-center justify-center h-32">
						<Logo variant="reverse" width={280} />
					</div>
					<p class="text-sm text-gray-400 mt-6">Use on dark backgrounds</p>
				</div>
			</div>

			<div class="mb-12">
				<h3 class="text-xl font-serif mb-6">Canvas & Surfaces</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="bg-canvas border border-gray-200 p-8 rounded-lg">
						<div class="w-full h-24 bg-canvas border border-gray-300 rounded mb-4"></div>
						<p class="text-xs tracking-widest uppercase text-gray-500 mb-2">Canvas</p>
						<code class="text-sm font-mono">#FAFAFA</code>
						<p class="text-xs text-gray-600 mt-2">Main background, airy & expansive</p>
					</div>

					<div class="bg-surface-white shadow-card p-8 rounded-lg">
						<div class="w-full h-24 bg-surface-white border border-gray-300 rounded mb-4"></div>
						<p class="text-xs tracking-widest uppercase text-gray-500 mb-2">Surface White</p>
						<code class="text-sm font-mono">#FFFFFF</code>
						<p class="text-xs text-gray-600 mt-2">Interactive elements, subtle lift</p>
					</div>

					<div class="bg-stone-900 p-8 rounded-lg">
						<div class="w-full h-24 bg-stone-900 border border-gray-700 rounded mb-4"></div>
						<p class="text-xs tracking-widest uppercase text-gray-400 mb-2">Stone-900</p>
						<code class="text-sm font-mono text-white">#1C1917</code>
						<p class="text-xs text-gray-400 mt-2">Power color, CTAs, dark sections</p>
					</div>
				</div>
			</div>

			<div class="mb-12">
				<h3 class="text-xl font-serif mb-6">The "Power" CTA</h3>
				<p class="text-sm text-gray-600 mb-6 max-w-2xl">
					The button doesn't change color on hover — it simply drops to 85% opacity. In luxury,
					color changes are "loud"; opacity shifts are "elegant."
				</p>
				<div class="flex flex-wrap gap-4">
					<Button variant="primary" size="lg">Add to Cart</Button>
					<Button variant="primary" size="md">Add to Cart</Button>
					<Button variant="primary" size="sm">Add to Cart</Button>
				</div>

				<div class="mt-8 flex flex-wrap gap-4">
					<Button variant="secondary" size="md">View Details</Button>
					<Button variant="ghost" size="md">Learn More</Button>
				</div>
			</div>

			<div>
				<h3 class="text-xl font-serif mb-6">Luxury Shadow System</h3>
				<p class="text-sm text-gray-600 mb-6 max-w-2xl">
					Never use harsh, saturated shadows. All shadows: Stone-900 at 5-10% opacity with high
					blur radius.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div class="bg-surface-white shadow-card p-8 rounded-lg">
						<p class="text-xs tracking-widest uppercase text-gray-500 mb-2">Card Shadow</p>
						<code class="text-xs font-mono text-gray-600">shadow-card</code>
						<p class="text-xs text-gray-600 mt-4">Subtle elevation for product cards</p>
					</div>

					<div class="bg-surface-white shadow-luxury p-8 rounded-lg">
						<p class="text-xs tracking-widest uppercase text-gray-500 mb-2">Luxury Shadow</p>
						<code class="text-xs font-mono text-gray-600">shadow-luxury</code>
						<p class="text-xs text-gray-600 mt-4">Standard elevated elements</p>
					</div>

					<div class="bg-surface-white shadow-luxury-lg p-8 rounded-lg">
						<p class="text-xs tracking-widest uppercase text-gray-500 mb-2">Luxury Shadow Large</p>
						<code class="text-xs font-mono text-gray-600">shadow-luxury-lg</code>
						<p class="text-xs text-gray-600 mt-4">Modals and major overlays</p>
					</div>
				</div>
			</div>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Component 02</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Quick View Modal</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					80% width/height centered overlay. 60/40 split with scrollable gallery and fixed product
					details.
				</p>
			</div>

			<button
				onclick={() => (quickViewProduct = mockProduct)}
				class="py-4 px-10 bg-gray-900 text-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-gray-800 transition-all duration-200"
			>
				Open Quick View
			</button>

			<QuickViewModal
				product={quickViewProduct}
				isOpen={!!quickViewProduct}
				onClose={() => (quickViewProduct = null)}
			/>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Component 03</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Filtered Archive Header</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					Active filter chips with bottom border. Small "x" to remove individual filters.
				</p>
			</div>

			<div class="bg-gray-50 p-12 rounded-lg">
				<FilteredArchiveHeader
					title="Collection"
					{activeFilters}
					onRemoveFilter={handleRemoveFilter}
					onClearAll={handleClearAllFilters}
				/>

				<div class="mt-8 flex gap-4">
					<button
						onclick={() => (activeFilters = [...activeFilters, { id: 'red', label: 'Red' }])}
						class="text-xs tracking-wider uppercase text-gray-500 hover:text-gray-900 underline"
					>
						Add Filter
					</button>
					<button
						onclick={() => (showEmptyState = !showEmptyState)}
						class="text-xs tracking-wider uppercase text-gray-500 hover:text-gray-900 underline"
					>
						Toggle Empty State
					</button>
				</div>

				{#if showEmptyState}
					<EmptyFilterState
						message="No silhouettes match your current selection"
						exploreAllLink="/shop"
					/>
				{/if}
			</div>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Component 04</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Image Hover Zoom (Soft Zoom)</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					Subtle 1.05x scale with transition to secondary editorial shot on hover.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div>
					<ImageHoverZoom
						primaryImage="https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop"
						secondaryImage="https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=600&h=750&fit=crop"
						alt="Mediterranean Bikini"
						aspectRatio="4/5"
					/>
					<h3 class="text-xs font-medium tracking-[0.2em] uppercase mt-4 mb-2">Mediterranean Bikini</h3>
					<p class="text-sm text-gray-500">$198</p>
				</div>

				<div>
					<ImageHoverZoom
						primaryImage="https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=600&h=750&fit=crop"
						secondaryImage="https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop"
						alt="Sunset One Piece"
						aspectRatio="4/5"
					/>
					<h3 class="text-xs font-medium tracking-[0.2em] uppercase mt-4 mb-2">Sunset One Piece</h3>
					<p class="text-sm text-gray-500">$245</p>
				</div>

				<div>
					<ImageHoverZoom
						primaryImage="https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop"
						alt="Coastal Cover-Up"
						aspectRatio="4/5"
					/>
					<h3 class="text-xs font-medium tracking-[0.2em] uppercase mt-4 mb-2">Coastal Cover-Up</h3>
					<p class="text-sm text-gray-500">$165</p>
				</div>
			</div>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Component 05</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Skeleton Loader (Shimmer)</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					Grayscale shimmer placeholder matching product card aspect ratios (4:5).
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
				<ProductCardSkeleton count={3} />
			</div>

			<div class="bg-gray-50 p-12 rounded-lg">
				<h3 class="text-xl font-serif mb-6">Text Content Loading</h3>
				<TextLineSkeleton lines={5} />
			</div>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Component 06</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">Scroll Progress Bar</h2>
				<p class="text-base leading-relaxed text-gray-600 max-w-2xl">
					Thin 2px line at the top of the screen. Active on this page - scroll to see it in action.
				</p>
			</div>

			<div class="bg-gray-50 p-12 rounded-lg">
				<p class="text-base leading-relaxed text-gray-700">
					The progress bar is visible at the very top of this page. Scroll down to see it fill as
					you navigate through the content.
				</p>
			</div>
		</section>

		<section class="mb-32">
			<div class="mb-8">
				<span class="text-xs tracking-[0.3em] uppercase text-gray-500 block mb-4">Typography System</span>
				<h2 class="text-3xl md:text-4xl font-serif mb-4">The Atelier Type Scale</h2>
			</div>

			<div class="space-y-12">
				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">Hero Display</p>
					<div class="text-7xl md:text-8xl font-light font-serif tracking-tight">The Eternal Summer</div>
				</div>

				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">H1 Page Title</p>
					<h1 class="text-4xl md:text-5xl font-serif" style="line-height: 1.1">Welcome back, Sofia</h1>
				</div>

				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">H2 Section Heading</p>
					<h2 class="text-3xl md:text-4xl font-serif">Recent Orders</h2>
				</div>

				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">Pull Quote</p>
					<blockquote class="text-3xl italic font-serif text-gray-900 leading-relaxed max-w-2xl">
						"Luxury is not about the price tag, but the story woven into every thread."
					</blockquote>
				</div>

				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">Body Large (Intro)</p>
					<p class="text-xl leading-relaxed text-gray-700 max-w-2xl">
						Opening paragraph with larger text for emphasis and elegant readability.
					</p>
				</div>

				<div class="border-b border-gray-200 pb-8">
					<p class="text-xs tracking-widest uppercase text-gray-500 mb-4">Body Standard</p>
					<p class="text-base leading-relaxed text-gray-700 max-w-2xl">
						Standard body content continues here with optimal line height for comfortable reading.
					</p>
				</div>
			</div>
		</section>

		<div class="text-center py-20 border-t border-gray-200">
			<p class="text-sm text-gray-400">The Atelier Component Library • Luxury E-Commerce</p>
		</div>
	</div>
</div>
