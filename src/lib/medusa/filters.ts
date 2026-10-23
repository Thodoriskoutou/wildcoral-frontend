import { msg } from '#lib/i18n/index.js'
/**
 * The shop's filters and sorting, as plain functions over the catalog (no SvelteKit imports).
 *
 * The state lives in the page URL, so a filtered view can be bookmarked, shared, and survives the
 * back button:   /shop?category=bikinis&size=S,M&color=Gold&style=sequin&max=150&instock=1&sort=price-asc
 *
 * Rules: choices inside one group are alternatives (size S *or* M); different groups all have to hold
 * (size M *and* Gold *and* in stock). Colour, size, price and stock are checked on the same variant, so
 * "Gold, size M, in stock" only matches a product that really has a Gold M that can be bought.
 */
import type { CatalogProduct } from './catalog';

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export const SORTS: { key: SortKey; label: string }[] = [
	{ key: 'featured', label: msg('Featured') },
	{ key: 'newest', label: msg('Newest') },
	{ key: 'price-asc', label: msg('Price: Low to High') },
	{ key: 'price-desc', label: msg('Price: High to Low') },
	{ key: 'name', label: msg('Name: A–Z') }
];

export interface Filters {
	/** A category name, or 'all'. */
	category: string;
	sizes: string[];
	colors: string[];
	styles: string[];
	/** Highest price wanted, or null for no limit. */
	maxPrice: number | null;
	inStock: boolean;
	sort: SortKey;
}

export const NO_FILTERS: Filters = { category: 'all', sizes: [], colors: [], styles: [], maxPrice: null, inStock: false, sort: 'featured' };

/** Sizes in the order shoppers expect; anything else follows alphabetically. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const list = (value: string | null) =>
	(value ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

/** Reads everything except the category (that one is a handle in the URL, resolved by the page). */
export function parseFilters(params: { get(name: string): string | null }): Omit<Filters, 'category'> {
	const max = Number(params.get('max'));
	const sort = params.get('sort') as SortKey | null;
	return {
		sizes: list(params.get('size')),
		colors: list(params.get('color')),
		styles: list(params.get('style')),
		maxPrice: params.get('max') && Number.isFinite(max) && max > 0 ? max : null,
		inStock: params.get('instock') === '1',
		sort: SORTS.some((s) => s.key === sort) ? (sort as SortKey) : 'featured'
	};
}

/** The URL (path + query) after changing some filters; defaults and empty choices are left out. */
export function filtersHref(url: { pathname: string; search: string }, patch: Partial<Omit<Filters, 'category'>> & { categoryHandle?: string | null }): string {
	const params = new URLSearchParams(url.search);
	const set = (key: string, value: string | null) => (value ? params.set(key, value) : params.delete(key));
	if ('categoryHandle' in patch) set('category', patch.categoryHandle ?? null);
	if ('sizes' in patch) set('size', patch.sizes?.join(',') ?? null);
	if ('colors' in patch) set('color', patch.colors?.join(',') ?? null);
	if ('styles' in patch) set('style', patch.styles?.join(',') ?? null);
	if ('maxPrice' in patch) set('max', patch.maxPrice ? String(patch.maxPrice) : null);
	if ('inStock' in patch) set('instock', patch.inStock ? '1' : null);
	if ('sort' in patch) set('sort', patch.sort && patch.sort !== 'featured' ? patch.sort : null);
	const query = params.toString();
	return url.pathname + (query ? `?${query}` : '');
}

export function matches(product: CatalogProduct, f: Filters): boolean {
	if (f.category !== 'all' && product.category !== f.category) return false;
	if (f.styles.length && !f.styles.some((style) => product.tags.includes(style))) return false;

	const needsVariant = f.sizes.length > 0 || f.colors.length > 0 || f.inStock || f.maxPrice !== null;
	if (!needsVariant) return true;
	return product.variants.some(
		(v) =>
			(f.sizes.length === 0 || (v.size !== null && f.sizes.includes(v.size))) &&
			(f.colors.length === 0 || (v.color !== null && f.colors.includes(v.color))) &&
			(!f.inStock || v.inStock) &&
			(f.maxPrice === null || (v.price !== null && v.price <= f.maxPrice))
	);
}

export function sortProducts(products: CatalogProduct[], sort: SortKey): CatalogProduct[] {
	if (sort === 'featured') return products;
	const price = (p: CatalogProduct, missing: number) => p.price ?? missing;
	const by: Record<Exclude<SortKey, 'featured'>, (a: CatalogProduct, b: CatalogProduct) => number> = {
		newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
		'price-asc': (a, b) => price(a, Infinity) - price(b, Infinity),
		'price-desc': (a, b) => price(b, -Infinity) - price(a, -Infinity),
		name: (a, b) => a.name.localeCompare(b.name)
	};
	return products.slice().sort(by[sort]);
}

export function applyFilters(products: CatalogProduct[], f: Filters): CatalogProduct[] {
	return sortProducts(products.filter((p) => matches(p, f)), f.sort);
}

export interface FilterOptions {
	sizes: string[];
	colors: { name: string; hex: string }[];
	styles: string[];
	/** Whole-euro bounds of the prices in the catalog; null unless prices differ (a slider would be pointless). */
	price: { min: number; max: number } | null;
}

/** What the filter panel can offer, taken from the catalog itself rather than a fixed list. */
export function filterOptions(products: CatalogProduct[]): FilterOptions {
	const sizes = new Set<string>();
	const colors = new Map<string, string>();
	const styleCounts = new Map<string, number>();
	const prices: number[] = [];
	for (const p of products) {
		for (const size of p.sizes) sizes.add(size);
		for (const c of p.colors) if (!colors.has(c.name)) colors.set(c.name, c.hex);
		for (const tag of new Set(p.tags)) styleCounts.set(tag, (styleCounts.get(tag) ?? 0) + 1);
		for (const v of p.variants) if (v.price !== null) prices.push(v.price);
	}
	const rank = (s: string) => {
		const i = SIZE_ORDER.indexOf(s.toUpperCase());
		return i === -1 ? SIZE_ORDER.length : i;
	};
	const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
	const max = prices.length ? Math.ceil(Math.max(...prices)) : 0;
	return {
		sizes: [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
		colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name)),
		styles: [...styleCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag),
		price: max > min ? { min, max } : null
	};
}

/**
 * How many products you would get if you picked just this one more choice, with everything else as it
 * is now. Shown next to each option so no choice leads to an empty page by surprise.
 */
export function countWith(products: CatalogProduct[], current: Filters, patch: Partial<Filters>): number {
	return products.filter((p) => matches(p, { ...current, ...patch })).length;
}

export function activeFilterCount(f: Filters): number {
	return (
		(f.category !== 'all' ? 1 : 0) + f.sizes.length + f.colors.length + f.styles.length + (f.maxPrice !== null ? 1 : 0) + (f.inStock ? 1 : 0)
	);
}

/** The color a card should show first: the first chosen color the product comes in (else its first color). */
export function cardColorIndex(product: CatalogProduct, f: Pick<Filters, 'colors'>): number {
	const i = product.colors.findIndex((c) => f.colors.includes(c.name));
	return i === -1 ? 0 : i;
}
