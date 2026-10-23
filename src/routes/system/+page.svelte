<script lang="ts">
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Heart from '@lucide/svelte/icons/heart';
	import Share2 from '@lucide/svelte/icons/share-2';
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';
	import Star from '@lucide/svelte/icons/star';
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Logo from '$lib/components/Logo.svelte';
	import WishlistButton from '$lib/components/WishlistButton.svelte';
	import StockBadge from '$lib/components/StockBadge.svelte';
	import CouponInput from '$lib/components/CouponInput.svelte';

	let selectedTab = $state('colors');

	const tabs = [
		{ id: 'colors', label: 'Colors' },
		{ id: 'typography', label: 'Typography' },
		{ id: 'spacing', label: 'Spacing' },
		{ id: 'buttons', label: 'Buttons' },
		{ id: 'forms', label: 'Forms' },
		{ id: 'badges', label: 'Badges' },
		{ id: 'cards', label: 'Cards' },
		{ id: 'icons', label: 'Icons' },
		{ id: 'ecommerce', label: 'E-Commerce' }
	];

	const neutralScale = [
		{ name: 'Stone 50', hex: '#FAFAF9' },
		{ name: 'Stone 100', hex: '#F5F5F4' },
		{ name: 'Stone 200', hex: '#E7E5E4' },
		{ name: 'Stone 300', hex: '#D6D3D1' },
		{ name: 'Stone 400', hex: '#A8A29E' },
		{ name: 'Stone 700', hex: '#44403C' },
		{ name: 'Stone 800', hex: '#292524' },
		{ name: 'Stone 900', hex: '#1C1917' }
	];

	const spacingScale = [
		{ slug: '20', size: '1.25rem (20px)', use: 'Tight spacing, card padding' },
		{ slug: '30', size: '1.875rem (30px)', use: 'Small gaps' },
		{ slug: '40', size: '2.5rem (40px)', use: 'Default spacing' },
		{ slug: '50', size: '3.125rem (50px)', use: 'Medium spacing' },
		{ slug: '60', size: '3.75rem (60px)', use: 'Section gaps' },
		{ slug: '80', size: '5rem (80px)', use: 'Large section gaps' },
		{ slug: '120', size: '7.5rem (120px)', use: 'Editorial negative space' },
		{ slug: '160', size: '10rem (160px)', use: 'Extreme negative space' },
		{ slug: '200', size: '12.5rem (200px)', use: 'Homepage hero spacing' }
	];

	const iconList = [
		{ name: 'Shopping Bag' },
		{ name: 'Wishlist' },
		{ name: 'Share' },
		{ name: 'Search' },
		{ name: 'Close' },
		{ name: 'Chevron' },
		{ name: 'Star' },
		{ name: 'Check' },
		{ name: 'Alert' }
	];
</script>

<div class="bg-white min-h-screen">
	<header class="border-b-2 border-gray-900 sticky top-0 bg-white z-50">
		<div class="max-w-7xl mx-auto px-8 py-6">
			<h1 class="text-3xl font-serif mb-2">Wild Coral Design System</h1>
			<p class="text-sm text-gray-600">Component Library & theme.json Reference</p>
		</div>
	</header>

	<nav class="border-b border-gray-200 sticky top-[72px] bg-white/95 backdrop-blur-md z-40">
		<div class="max-w-7xl mx-auto px-8">
			<div class="flex gap-8 overflow-x-auto scrollbar-hide">
				{#each tabs as tab (tab.id)}
					<button
						onclick={() => (selectedTab = tab.id)}
						class="py-4 text-sm tracking-wider uppercase border-b-2 transition-colors whitespace-nowrap {selectedTab ===
						tab.id
							? 'border-gray-900 text-gray-900'
							: 'border-transparent text-gray-400 hover:text-gray-900'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-8 py-16">
		{#if selectedTab === 'colors'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Color System</h2>
					<p class="text-gray-600">
						The Wild Coral Brand System - Sophisticated neutral palette allowing vibrant
						photography to lead
					</p>
				</div>

				<div class="mb-16">
					<h3 class="text-2xl font-serif mb-6">Primary Colors</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<div class="h-32 bg-[#FAFAFA] border-2 border-gray-300 mb-3"></div>
							<p class="text-sm font-medium mb-1">Canvas</p>
							<p class="text-xs text-gray-500">#FAFAFA</p>
							<p class="text-xs text-gray-400 mt-1">Page background</p>
						</div>
						<div>
							<div class="h-32 bg-white border-2 border-gray-300 mb-3"></div>
							<p class="text-sm font-medium mb-1">Surface White</p>
							<p class="text-xs text-gray-500">#FFFFFF</p>
							<p class="text-xs text-gray-400 mt-1">Cards, components</p>
						</div>
						<div>
							<div class="h-32 bg-[#1C1917] mb-3"></div>
							<p class="text-sm font-medium mb-1">Stone 900</p>
							<p class="text-xs text-gray-500">#1C1917</p>
							<p class="text-xs text-gray-400 mt-1">Primary CTA, text</p>
						</div>
					</div>
				</div>

				<div class="mb-16">
					<h3 class="text-2xl font-serif mb-6">Neutral Scale</h3>
					<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
						{#each neutralScale as color (color.name)}
							<div>
								<div class="h-20 border border-gray-300 mb-2" style="background-color: {color.hex}"></div>
								<p class="text-xs font-medium">{color.name}</p>
								<p class="text-xs text-gray-500">{color.hex}</p>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<h3 class="text-2xl font-serif mb-6">Accent Colors (Use Sparingly)</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<div class="h-32 bg-[#FF6B6B] mb-3 rounded-sm"></div>
							<p class="text-sm font-medium mb-1">Accent Coral</p>
							<p class="text-xs text-gray-500">#FF6B6B</p>
							<p class="text-xs text-gray-400 mt-1">Brand accent</p>
						</div>
						<div>
							<div class="h-32 bg-[#10B981] mb-3 rounded-sm"></div>
							<p class="text-sm font-medium mb-1">Success Green</p>
							<p class="text-xs text-gray-500">#10B981</p>
							<p class="text-xs text-gray-400 mt-1">Success states</p>
						</div>
						<div>
							<div class="h-32 bg-[#EF4444] mb-3 rounded-sm"></div>
							<p class="text-sm font-medium mb-1">Error Red</p>
							<p class="text-xs text-gray-500">#EF4444</p>
							<p class="text-xs text-gray-400 mt-1">Error states</p>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'typography'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Typography System</h2>
					<p class="text-gray-600">The Atelier - Georgia/Times for editorial, Inter for utility</p>
				</div>

				<div class="mb-16">
					<h3 class="text-2xl font-serif mb-6">Font Families</h3>
					<div class="space-y-6">
						<div class="p-6 border-2 border-gray-200">
							<p class="text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">SERIF (EDITORIAL)</p>
							<p class="text-3xl font-serif italic">Georgia / Times New Roman</p>
							<p class="text-sm text-gray-600 mt-2">
								Used for: Headings, hero text, editorial content, quotes
							</p>
						</div>
						<div class="p-6 border-2 border-gray-200">
							<p class="text-xs tracking-[0.2em] uppercase text-gray-500 mb-2">SANS-SERIF (UTILITY)</p>
							<p class="text-3xl">Inter</p>
							<p class="text-sm text-gray-600 mt-2">
								Used for: Body text, buttons, labels, navigation, UI elements
							</p>
						</div>
					</div>
				</div>

				<div class="mb-16">
					<h3 class="text-2xl font-serif mb-6">Type Scale (Fluid)</h3>
					<div class="space-y-6">
						<div class="border-b border-gray-200 pb-6">
							<p class="text-7xl font-serif italic">Display 7XL</p>
							<p class="text-sm text-gray-500 mt-2">4.5rem (72px) - Homepage hero</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-6xl font-serif italic">Display 6XL</p>
							<p class="text-sm text-gray-500 mt-2">3.75rem (60px) - Page heroes</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-5xl font-serif italic">Heading 5XL</p>
							<p class="text-sm text-gray-500 mt-2">3rem (48px) - Section headings</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-4xl font-serif italic">Heading 4XL</p>
							<p class="text-sm text-gray-500 mt-2">2.25rem (36px) - Card headings</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-3xl font-serif italic">Heading 3XL</p>
							<p class="text-sm text-gray-500 mt-2">1.875rem (30px) - Subsections</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-2xl">Title 2XL</p>
							<p class="text-sm text-gray-500 mt-2">1.5rem (24px) - Product names</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-xl">Title XL</p>
							<p class="text-sm text-gray-500 mt-2">1.25rem (20px) - Small titles</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-lg">Large</p>
							<p class="text-sm text-gray-500 mt-2">1.125rem (18px) - Large body</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-base">Base</p>
							<p class="text-sm text-gray-500 mt-2">1rem (16px) - Body text</p>
						</div>
						<div class="border-b border-gray-200 pb-6">
							<p class="text-sm">Small</p>
							<p class="text-sm text-gray-500 mt-2">0.875rem (14px) - Buttons, labels</p>
						</div>
						<div>
							<p class="text-xs tracking-[0.2em] uppercase">Extra Small</p>
							<p class="text-sm text-gray-500 mt-2">0.75rem (12px) - Captions, fine print</p>
						</div>
					</div>
				</div>

				<div>
					<h3 class="text-2xl font-serif mb-6">Letter Spacing</h3>
					<div class="space-y-4">
						<div class="p-4 border border-gray-200">
							<p class="text-xl tracking-tight">Tight (-0.02em) - Large headings</p>
						</div>
						<div class="p-4 border border-gray-200">
							<p class="text-xl">Normal (0em) - Body text</p>
						</div>
						<div class="p-4 border border-gray-200">
							<p class="text-sm tracking-wide uppercase">Wide (0.2em) - Buttons, labels</p>
						</div>
						<div class="p-4 border border-gray-200">
							<p class="text-xs tracking-wider uppercase">Wider (0.3em) - Small uppercase</p>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'spacing'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Spacing Scale</h2>
					<p class="text-gray-600">8px base unit - Extreme negative space for luxury feel</p>
				</div>

				<div class="space-y-6">
					{#each spacingScale as space (space.slug)}
						<div class="flex items-center gap-6">
							<div class="bg-gray-900 h-8 flex-shrink-0" style="width: {space.slug}px"></div>
							<div>
								<p class="text-sm font-medium">{space.size}</p>
								<p class="text-xs text-gray-500">{space.use}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{:else if selectedTab === 'buttons'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Button System</h2>
					<p class="text-gray-600">Primary CTA-focused design with clear hierarchy</p>
				</div>

				<div class="mb-12">
					<h3 class="text-xl mb-6">Primary (Dark)</h3>
					<div class="flex flex-wrap gap-4">
						<button class="bg-gray-900 text-white px-8 py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all">
							Add to Bag
						</button>
						<button class="bg-gray-900 text-white px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-800 transition-all">
							Medium
						</button>
						<button class="bg-gray-900 text-white px-6 py-2 text-xs tracking-[0.2em] uppercase hover:bg-gray-800 transition-all">
							Small
						</button>
					</div>
				</div>

				<div class="mb-12">
					<h3 class="text-xl mb-6">Secondary (Outline)</h3>
					<div class="flex flex-wrap gap-4">
						<button class="border-2 border-gray-900 text-gray-900 px-8 py-4 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all">
							Shop Now
						</button>
						<button class="border-2 border-gray-900 text-gray-900 px-8 py-3 text-sm tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all">
							View Details
						</button>
						<button class="border-2 border-gray-900 text-gray-900 px-6 py-2 text-xs tracking-[0.2em] uppercase hover:bg-gray-900 hover:text-white transition-all">
							Learn More
						</button>
					</div>
				</div>

				<div class="mb-12">
					<h3 class="text-xl mb-6">Text/Link Buttons</h3>
					<div class="flex flex-wrap gap-6">
						<button class="text-sm tracking-wider uppercase underline hover:opacity-70 transition-opacity">View All</button>
						<button class="text-sm underline hover:opacity-70 transition-opacity">Continue Shopping</button>
						<button class="text-xs tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">Clear Filters</button>
					</div>
				</div>

				<div>
					<h3 class="text-xl mb-6">Icon Buttons</h3>
					<div class="flex flex-wrap gap-4">
						<button class="border-2 border-gray-900 p-3 hover:bg-gray-900 hover:text-white transition-all">
							<Heart class="w-5 h-5" />
						</button>
						<button class="border-2 border-gray-900 p-3 hover:bg-gray-900 hover:text-white transition-all">
							<ShoppingBag class="w-5 h-5" />
						</button>
						<button class="border-2 border-gray-900 p-3 hover:bg-gray-900 hover:text-white transition-all">
							<Share2 class="w-5 h-5" />
						</button>
						<button class="border-2 border-gray-300 p-2 hover:border-gray-900 transition-all">
							<X class="w-4 h-4" />
						</button>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'forms'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Form Elements</h2>
					<p class="text-gray-600">Clean, accessible inputs with clear states</p>
				</div>

				<div class="mb-12">
					<h3 class="text-xl mb-6">Text Inputs</h3>
					<div class="space-y-6 max-w-md">
						<div>
							<label class="text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700">Default State</label>
							<input
								type="text"
								placeholder="Enter text..."
								class="w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors"
							/>
						</div>
						<div>
							<label class="text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700">Focus State</label>
							<input
								type="text"
								placeholder="Enter text..."
								class="w-full border-2 border-gray-900 px-4 py-3 text-sm outline-none"
							/>
						</div>
						<div>
							<label class="text-xs tracking-[0.2em] uppercase block mb-2 text-red-600">Error State</label>
							<input
								type="text"
								placeholder="Enter text..."
								class="w-full border-2 border-red-500 px-4 py-3 text-sm outline-none"
							/>
							<p class="text-xs text-red-600 mt-2 flex items-center gap-1">
								<CircleAlert class="w-3 h-3" />
								This field is required
							</p>
						</div>
						<div>
							<label class="text-xs tracking-[0.2em] uppercase block mb-2 text-green-700">Success State</label>
							<input
								type="text"
								value="john@example.com"
								readonly
								class="w-full border-2 border-green-500 px-4 py-3 text-sm outline-none"
							/>
							<p class="text-xs text-green-700 mt-2 flex items-center gap-1">
								<Check class="w-3 h-3" />
								Looks good!
							</p>
						</div>
					</div>
				</div>

				<div class="mb-11">
					<h3 class="text-xl mb-6">Select Dropdowns</h3>
					<div class="space-y-4 max-w-md">
						<div>
							<label class="text-xs tracking-[0.2em] uppercase block mb-2 text-gray-700">Select Size</label>
							<select class="w-full border-2 border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors">
								<option>Select an option</option>
								<option>XS</option>
								<option>S</option>
								<option>M</option>
								<option>L</option>
							</select>
						</div>
					</div>
				</div>

				<div class="mb-12">
					<h3 class="text-xl mb-6">Checkboxes & Radio Buttons</h3>
					<div class="space-y-4 max-w-md">
						<label class="flex items-center gap-3 cursor-pointer">
							<input type="checkbox" class="w-4 h-4 accent-gray-900" />
							<span class="text-sm">Subscribe to newsletter</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer">
							<input type="checkbox" class="w-4 h-4 accent-gray-900" checked />
							<span class="text-sm">I agree to the terms and conditions</span>
						</label>
						<div class="pt-4 border-t border-gray-200">
							<p class="text-xs tracking-[0.2em] uppercase text-gray-700 mb-3">Shipping Method</p>
							<label class="flex items-center gap-3 cursor-pointer mb-3">
								<input type="radio" name="shipping-demo" class="w-4 h-4 accent-gray-900" checked />
								<span class="text-sm">Express (2-3 days)</span>
							</label>
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="radio" name="shipping-demo" class="w-4 h-4 accent-gray-900" />
								<span class="text-sm">Standard (5-7 days)</span>
							</label>
						</div>
					</div>
				</div>

				<div>
					<h3 class="text-xl mb-6">Search Input</h3>
					<div class="max-w-md">
						<div class="relative">
							<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="search"
								placeholder="Search products..."
								class="w-full border-2 border-gray-300 pl-12 pr-4 py-3 text-sm outline-none focus:border-gray-900 transition-colors"
							/>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'badges'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Badges & Labels</h2>
					<p class="text-gray-600">Product status indicators and UI labels</p>
				</div>

				<div class="space-y-12">
					<div>
						<h3 class="text-xl mb-6">Product Status</h3>
						<div class="flex flex-wrap gap-4">
							<span class="bg-white px-3 py-1 text-xs tracking-wider border-2 border-gray-900">NEW</span>
							<span class="bg-red-600 text-white px-3 py-1 text-xs tracking-wider">SALE</span>
							<span class="bg-gray-900 text-white px-3 py-1 text-xs tracking-wider">BESTSELLER</span>
							<span class="bg-gray-100 text-gray-700 px-3 py-1 text-xs tracking-wider">LOW STOCK</span>
							<span class="bg-green-100 text-green-800 px-3 py-1 text-xs tracking-wider">IN STOCK</span>
							<span class="bg-red-100 text-red-800 px-3 py-1 text-xs tracking-wider">OUT OF STOCK</span>
						</div>
					</div>

					<div>
						<h3 class="text-xl mb-6">Active Filter Chips</h3>
						<div class="flex flex-wrap gap-3">
							<button class="flex items-center gap-2 border-2 border-gray-900 bg-gray-900 text-white px-4 py-2 text-xs tracking-wide hover:bg-gray-800 transition-all">
								<span>Color: White</span>
								<X class="w-3 h-3" />
							</button>
							<button class="flex items-center gap-2 border-2 border-gray-900 bg-gray-900 text-white px-4 py-2 text-xs tracking-wide hover:bg-gray-800 transition-all">
								<span>Size: M</span>
								<X class="w-3 h-3" />
							</button>
							<button class="flex items-center gap-2 border-2 border-gray-900 bg-gray-900 text-white px-4 py-2 text-xs tracking-wide hover:bg-gray-800 transition-all">
								<span>$100 - $200</span>
								<X class="w-3 h-3" />
							</button>
						</div>
					</div>

					<div>
						<h3 class="text-xl mb-6">Count Badges</h3>
						<div class="flex items-center gap-6">
							<div class="relative">
								<ShoppingBag class="w-6 h-6" />
								<span class="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
									3
								</span>
							</div>
							<div class="relative">
								<Heart class="w-6 h-6" />
								<span class="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
									12
								</span>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-xl mb-6">Rating Stars (Missing Component)</h3>
						<div class="flex items-center gap-1">
							{#each [1, 2, 3, 4, 5] as i (i)}
								<Star class="w-4 h-4 fill-gray-900 text-gray-900" />
							{/each}
							<span class="text-sm text-gray-600 ml-2">(42 reviews)</span>
						</div>
						<div class="flex items-center gap-1 mt-3">
							{#each [1, 2, 3] as i (i)}
								<Star class="w-4 h-4 fill-gray-900 text-gray-900" />
							{/each}
							{#each [4, 5] as i (i)}
								<Star class="w-4 h-4 text-gray-300" />
							{/each}
							<span class="text-sm text-gray-600 ml-2">(8 reviews)</span>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'cards'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Card Components</h2>
					<p class="text-gray-600">Product cards and content containers</p>
				</div>

				<div class="space-y-12">
					<div>
						<h3 class="text-xl mb-6">Product Card</h3>
						<div class="max-w-sm">
							<div class="group">
								<div class="relative aspect-[3/4] bg-gray-100 border border-gray-200 mb-3 overflow-hidden">
									<div class="absolute inset-0 flex items-center justify-center">
										<span class="text-xs text-gray-400">[Product Image]</span>
									</div>
									<div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
									<div class="absolute top-4 left-4 bg-white px-3 py-1 text-xs tracking-wider">NEW</div>
									<button class="absolute top-4 right-4 bg-white border-2 border-gray-900 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<Heart class="w-4 h-4" />
									</button>
								</div>
								<div class="space-y-1">
									<h3 class="text-sm tracking-wide">The Monaco Bikini Top</h3>
									<p class="text-sm">$145</p>
									<div class="flex gap-1 mt-2">
										<div class="w-6 h-6 rounded-full bg-white border-2 border-gray-900"></div>
										<div class="w-6 h-6 rounded-full bg-black border border-gray-300"></div>
										<div class="w-6 h-6 rounded-full bg-red-400 border border-gray-300"></div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-xl mb-6">Info Card</h3>
						<div class="max-w-md border-2 border-gray-200 p-6">
							<h4 class="text-lg font-serif mb-3">Free Shipping</h4>
							<p class="text-sm text-gray-600">
								Complimentary express shipping on all orders. Delivered in 2-3 business days.
							</p>
						</div>
					</div>

					<div>
						<h3 class="text-xl mb-6">Quote Card</h3>
						<div class="max-w-2xl text-center p-12 bg-gray-50">
							<p class="text-2xl font-serif italic text-gray-900 mb-6 leading-relaxed">
								"We believe swimwear should be an extension of your identity—not a costume."
							</p>
							<div class="border border-gray-300 inline-block px-6 py-2">
								<span class="text-xs tracking-[0.3em]">LUXE SWIM</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'icons'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">Icon System</h2>
					<p class="text-gray-600">Lucide icons - Consistent stroke width and sizing</p>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><ShoppingBag /></div>
						<span class="text-xs text-gray-600 text-center">Shopping Bag</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><Heart /></div>
						<span class="text-xs text-gray-600 text-center">Wishlist</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><Share2 /></div>
						<span class="text-xs text-gray-600 text-center">Share</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><Search /></div>
						<span class="text-xs text-gray-600 text-center">Search</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><X /></div>
						<span class="text-xs text-gray-600 text-center">Close</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><ChevronDown /></div>
						<span class="text-xs text-gray-600 text-center">Chevron</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><Star /></div>
						<span class="text-xs text-gray-600 text-center">Star</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><Check /></div>
						<span class="text-xs text-gray-600 text-center">Check</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<div class="w-12 h-12 border-2 border-gray-200 flex items-center justify-center"><CircleAlert /></div>
						<span class="text-xs text-gray-600 text-center">Alert</span>
					</div>
				</div>

				<div class="mt-12">
					<h3 class="text-xl mb-6">Icon Sizes</h3>
					<div class="flex items-end gap-6">
						<div class="text-center">
							<ShoppingBag class="w-4 h-4 mx-auto mb-2" />
							<p class="text-xs text-gray-600">16px (sm)</p>
						</div>
						<div class="text-center">
							<ShoppingBag class="w-5 h-5 mx-auto mb-2" />
							<p class="text-xs text-gray-600">20px (base)</p>
						</div>
						<div class="text-center">
							<ShoppingBag class="w-6 h-6 mx-auto mb-2" />
							<p class="text-xs text-gray-600">24px (lg)</p>
						</div>
						<div class="text-center">
							<ShoppingBag class="w-8 h-8 mx-auto mb-2" />
							<p class="text-xs text-gray-600">32px (xl)</p>
						</div>
					</div>
				</div>
			</section>
		{:else if selectedTab === 'ecommerce'}
			<section>
				<div class="mb-12">
					<h2 class="text-4xl font-serif mb-3">E-Commerce Components</h2>
					<p class="text-gray-600">Specialized components for e-commerce functionality</p>
				</div>

				<div class="space-y-12">
					<div>
						<h3 class="text-2xl font-serif mb-6">Wishlist Button</h3>
						<p class="text-sm text-gray-600 mb-6">
							Interactive heart icon that toggles between saved/unsaved states
						</p>
						<div class="space-y-6">
							<div>
								<p class="text-xs tracking-[0.2em] uppercase text-gray-700 mb-4">Icon Variant</p>
								<div class="flex items-center gap-4">
									<WishlistButton productId="1" variant="icon" size="sm" />
									<WishlistButton productId="2" variant="icon" size="md" />
									<WishlistButton productId="3" variant="icon" size="lg" />
								</div>
							</div>
							<div>
								<p class="text-xs tracking-[0.2em] uppercase text-gray-700 mb-4">Text Variant</p>
								<div class="space-y-3">
									<WishlistButton productId="4" variant="text" size="md" />
									<WishlistButton productId="5" variant="text" size="md" />
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-2xl font-serif mb-6">Stock Status Badges</h3>
						<p class="text-sm text-gray-600 mb-6">Product availability indicators for product pages</p>
						<div class="space-y-6">
							<div>
								<p class="text-xs tracking-[0.2em] uppercase text-gray-700 mb-4">Default Variant</p>
								<div class="flex flex-wrap gap-3">
									<StockBadge status="in-stock" />
									<StockBadge status="low-stock" quantity={8} />
									<StockBadge status="out-of-stock" />
									<StockBadge status="pre-order" />
								</div>
							</div>
							<div>
								<p class="text-xs tracking-[0.2em] uppercase text-gray-700 mb-4">Compact Variant</p>
								<div class="flex flex-wrap gap-4">
									<StockBadge status="in-stock" variant="compact" />
									<StockBadge status="low-stock" quantity={3} variant="compact" />
									<StockBadge status="out-of-stock" variant="compact" />
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 class="text-2xl font-serif mb-6">Coupon Code Input</h3>
						<p class="text-sm text-gray-600 mb-6">Discount code entry with success/error validation</p>
						<div class="max-w-lg">
							<CouponInput onApply={(code) => console.log(`Applied: ${code}`)} />
							<p class="text-xs text-gray-500 mt-4">Try codes: SUMMER20, FIRST10, VIP15</p>
						</div>
					</div>

					<div class="border-t-2 border-gray-200 pt-12">
						<h3 class="text-2xl font-serif mb-6">Implementation Notes</h3>
						<div class="space-y-4 text-sm text-gray-700">
							<p>
								<strong>Wishlist Button:</strong> Used on product cards and product detail pages. Icon
								variant for cards, text variant for detail pages below Add to Cart button.
							</p>
							<p>
								<strong>Stock Badge:</strong> Displayed on product detail pages near price. Default variant
								for desktop, compact for mobile or cart items.
							</p>
							<p>
								<strong>Coupon Input:</strong> Integrated into cart and checkout order summary sections.
								Shows success state with applied discount or error state with validation message.
							</p>
							<p>
								<strong>Cookie Consent:</strong> Global component rendered in Layout. Appears on first
								visit with GDPR-compliant options for essential, analytics, and marketing cookies.
							</p>
						</div>
					</div>
				</div>
			</section>
		{/if}
	</div>

	<footer class="border-t border-gray-200 py-12 bg-gray-50">
		<div class="max-w-7xl mx-auto px-8 text-center">
			<div class="mb-4 flex justify-center">
				<Logo variant="normal" width={120} />
			</div>
			<p class="text-sm text-gray-600">Wild Coral Design System v1.0</p>
			<p class="text-xs text-gray-500 mt-2">Ready for WordPress FSE theme.json implementation</p>
		</div>
	</footer>
</div>
