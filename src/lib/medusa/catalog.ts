import { formatLocale } from '$lib/i18n'
import type { StoreProduct, StoreProductVariant } from '@medusajs/types';

/**
 * Turns Medusa store products into the shape the Wild Coral pages render.
 *
 * Medusa models "Color" and "Size" as product *options*; each purchasable combination is a
 * *variant*. We flatten that into `colors` / `sizes` for the swatches and buttons, and keep a
 * `variants` list so the product page can resolve the chosen color + size back to a variant id
 * (which is what the cart needs).
 */

/** Fields the storefront requests on top of the SDK's default price field. */
export const PRODUCT_FIELDS = '*categories,+variants.inventory_quantity,*variants.images';

export interface CatalogVariant {
	id: string;
	color: string | null;
	size: string | null;
	/** Price in the currency's main unit (Medusa v2 stores 98 for €98, not cents). */
	price: number | null;
	inStock: boolean;
	/** Stock cap for the quantity picker; null when unlimited (unmanaged or backorderable). */
	maxQuantity: number | null;
	/** Photos attached to this variant in Medusa (Products → the product → a variant → Media). Stills only. */
	images: string[];
	/** The variant's own thumbnail (the picture its row shows in the Medusa admin). */
	thumbnail: string | null;
}

export interface CatalogProduct {
	id: string;
	/** URL slug — routes use `/product/{handle}`. */
	handle: string;
	name: string;
	/** Lowest variant price; null when the SDK could not resolve a pricing region. */
	price: number | null;
	currency: string;
	category: string;
	/** Product tags from Medusa (e.g. "sequin", "one-piece"), used by the shop's Style filter. */
	tags: string[];
	createdAt: string;
	/** Each color, with the photos attached to its variants (empty when none are). */
	colors: { name: string; hex: string; images: string[]; thumbnail: string | null }[];
	sizes: string[];
	description: string;
	/** Still images only (thumbnail first) — for previews, structured data and video posters. */
	images: string[];
	/** Everything to show in galleries and cards: videos first, then the images. */
	media: string[];
	/** Just the videos (they belong to the product, not to a color). */
	videos: string[];
	variants: CatalogVariant[];
}

// ---------------------------------------------------------------------------------------------
// Video support
//
// Medusa's admin only uploads images, so a product's videos come from two places:
//   1. any media URL that ends in a video extension (in case your Medusa accepts video uploads), and
//   2. product *metadata* (Products → the product → Metadata): a `video` key holding a video URL,
//      plus `video_2`, `video_3`, … for more, or a `videos` key with several URLs separated by
//      commas or spaces. URLs can be absolute (https://cdn.example.com/a.mp4) or site-relative
//      (/videos/a.mp4, served from the `static/videos` folder).
// Keep a still image as the product's Thumbnail: the cart, checkout and search previews need one.
// ---------------------------------------------------------------------------------------------

const VIDEO_URL = /\.(?:mp4|webm|mov|m4v)(?:[?#].*)?$/i;

export const isVideoUrl = (url: string): boolean => VIDEO_URL.test(url);

function metadataVideos(metadata: Record<string, unknown> | null | undefined): string[] {
	if (!metadata) return [];
	const urls: string[] = [];
	const add = (value: unknown) => {
		if (typeof value !== 'string') return;
		for (const part of value.split(/[\s,]+/)) {
			if (part && /^(https?:\/\/|\/)/.test(part) && isVideoUrl(part)) urls.push(part);
		}
	};
	// `video`, `video_2`, `video_3`, … in numeric order (`video` counts as 1).
	Object.keys(metadata)
		.map((key) => ({ key, match: /^video(?:_(\d+))?$/i.exec(key) }))
		.filter((k) => k.match)
		.sort((a, b) => Number(a.match?.[1] ?? 1) - Number(b.match?.[1] ?? 1))
		.forEach((k) => add(metadata[k.key]));
	add(metadata.videos);
	return urls;
}

// Medusa has no colour-swatch field, so swatch colours are looked up by name. Add your own
// colour names here (lower-case); anything not listed shows as neutral grey. (There is deliberately
// no CSS-name fallback: it can't run on the server, so the swatch would differ between the server
// render and the browser.) An option value can also carry `metadata.hex` to override this.
const COLOR_HEX: Record<string, string> = {
	white: '#FFFFFF',
	black: '#000000',
	sand: '#D4B896',
	navy: '#1E3A5F',
	coral: '#FF6B6B',
	mint: '#95E1D3',
	lavender: '#C7A8E4',
	wine: '#722F37',
	emerald: '#2D5F4F',
	'leopard print': '#C9A574',
	'zebra print': '#E8E8E8',
	terracotta: '#C65D3B',
	'rose gold': '#B76E79',
	champagne: '#F7E7CE',
	// Wild Coral range (from the product photos)
	gold: '#C9A84C',
	olive: '#5A6234',
	pistachio: '#A8C686',
	pink: '#F4A6C4',
	copper: '#B8703A',
	silver: '#C4C1C6',
	'cream leopard': '#E9DCC7',
	// The same colors by their Greek names (what the Greek translations of the option values say)
	λευκό: '#FFFFFF',
	μαύρο: '#000000',
	χρυσό: '#C9A84C',
	λαδί: '#5A6234',
	φυστικί: '#A8C686',
	ροζ: '#F4A6C4',
	χάλκινο: '#B8703A',
	ασημί: '#C4C1C6',
	'κρεμ λεοπάρ': '#E9DCC7',
	κοραλί: '#FF6B6B',
	μέντα: '#95E1D3',
	λεβάντα: '#C7A8E4',
	μπορντό: '#722F37',
	σμαραγδί: '#2D5F4F',
	τερακότα: '#C65D3B',
	σαμπανί: '#F7E7CE'
};
const FALLBACK_HEX = '#D1D5DB';

export function colorHex(name: string, metadataHex?: unknown): string {
	if (typeof metadataHex === 'string' && /^#[0-9a-f]{3,8}$/i.test(metadataHex)) return metadataHex;
	return COLOR_HEX[name.trim().toLowerCase()] ?? FALLBACK_HEX;
}

const isColorOption = (title: string) => /^(colou?rs?|χρώματα?|χρώμα)$/i.test(title.trim());
const isSizeOption = (title: string) => /^(sizes?|μέγεθος|μεγέθη)$/i.test(title.trim());

function variantInStock(v: StoreProductVariant): boolean {
	if (v.manage_inventory === false || v.allow_backorder) return true;
	return (v.inventory_quantity ?? 0) > 0;
}

function variantMaxQuantity(v: StoreProductVariant): number | null {
	if (v.manage_inventory === false || v.allow_backorder) return null;
	return Math.max(0, v.inventory_quantity ?? 0);
}

export function toCatalogProduct(p: StoreProduct): CatalogProduct {
	const options = p.options ?? [];
	const colorOption = options.find((o) => isColorOption(o.title ?? ''));
	const sizeOption = options.find((o) => isSizeOption(o.title ?? ''));

	const valueOf = (v: StoreProductVariant, optionId?: string): string | null => {
		if (!optionId) return null;
		return v.options?.find((o) => o.option_id === optionId)?.value ?? null;
	};

	const variants: CatalogVariant[] = (p.variants ?? []).map((v) => {
		const amount = v.calculated_price?.calculated_amount;
		return {
			id: v.id,
			color: valueOf(v, colorOption?.id),
			size: valueOf(v, sizeOption?.id),
			price: typeof amount === 'number' ? amount : null,
			inStock: variantInStock(v),
			maxQuantity: variantMaxQuantity(v),
			thumbnail: (v as { thumbnail?: string | null }).thumbnail || null,
			images: ((v as { images?: { url?: string }[] }).images ?? [])
				.map((i) => i.url ?? '')
				.filter((url) => url && !isVideoUrl(url))
		};
	});

	const prices = variants.map((v) => v.price).filter((n): n is number => n !== null);
	const currency =
		(p.variants?.find((v) => v.calculated_price?.currency_code)?.calculated_price?.currency_code as
			| string
			| undefined) ?? 'eur';

	const uploaded = (p.images ?? []).map((i) => i.url).filter(Boolean);
	if (p.thumbnail && !uploaded.includes(p.thumbnail)) uploaded.unshift(p.thumbnail);
	const images = uploaded.filter((url) => !isVideoUrl(url));
	const videos = [...new Set([...uploaded.filter(isVideoUrl), ...metadataVideos(p.metadata)])];

	return {
		id: p.id,
		handle: p.handle,
		name: p.title,
		price: prices.length ? Math.min(...prices) : null,
		currency: currency.toUpperCase(),
		category: p.categories?.[0]?.name ?? '',
		tags: (p.tags ?? []).map((t) => t.value).filter(Boolean),
		createdAt: p.created_at ? String(p.created_at) : '',
		colors: (colorOption?.values ?? [])
			.slice()
			.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
			.map((v) => ({
				name: v.value,
				hex: colorHex(v.value, v.metadata?.hex),
				images: images.filter((url) => variants.some((variant) => variant.color === v.value && variant.images.includes(url))),
				thumbnail: variants.find((variant) => variant.color === v.value && variant.thumbnail)?.thumbnail ?? null
			})),
		sizes: (sizeOption?.values ?? [])
			.slice()
			.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
			.map((v) => v.value),
		description: p.description ?? '',
		images,
		media: [...videos, ...images],
		videos,
		variants
	};
}

/**
 * What to show for a chosen color: the product's videos, then ONLY that color's own pictures.
 *   1. the photos attached to that color's variants in Medusa;
 *   2. else the color's thumbnail (a single picture);
 *   3. else (nothing is known about this color) the photos that belong to no color at all, or, when every
 *      photo belongs to some color, all of them rather than an empty gallery.
 * A product whose variants have no photos or thumbnails yet therefore still shows all its photos.
 */
export function mediaForColor(product: CatalogProduct, colorName: string | null | undefined): string[] {
	const color = product.colors.find((c) => c.name === colorName);
	if (color?.images.length) return [...product.videos, ...color.images];
	if (color?.thumbnail) return [...product.videos, color.thumbnail];
	const belongsToAColor = new Set(product.colors.flatMap((c) => c.images));
	const general = product.images.filter((url) => !belongsToAColor.has(url));
	return [...product.videos, ...(general.length ? general : product.images)];
}

/**
 * The gallery for the exact choice on the product page: a variant that has pictures of its own (color + size
 * both picked) shows those; otherwise the chosen color's pictures (see mediaForColor).
 */
export function mediaForSelection(product: CatalogProduct, colorName: string | null | undefined, variant?: CatalogVariant): string[] {
	if (variant?.images.length) return [...product.videos, ...variant.images];
	return mediaForColor(product, colorName);
}

/** The picture for a product card showing the given color (the first photo of that color, else the product's first media). */
export function previewMedia(product: CatalogProduct, colorIndex = 0): string | undefined {
	const color = product.colors[colorIndex];
	return color?.images[0] ?? color?.thumbnail ?? product.media[0];
}

/** The variant for a color + size choice (either may be null when the product has no such option). */
export function findVariant(
	product: CatalogProduct,
	color: string | null,
	size: string | null
): CatalogVariant | undefined {
	return product.variants.find(
		(v) =>
			(product.colors.length === 0 || v.color === color) &&
			(product.sizes.length === 0 || v.size === size)
	);
}

/** Whether any variant of the given color/size is buyable — for greying out sold-out choices. */
export function isAvailable(
	product: CatalogProduct,
	color: string | null,
	size: string | null
): boolean {
	return product.variants.some(
		(v) =>
			(color === null || v.color === color) && (size === null || v.size === size) && v.inStock
	);
}

export function formatPrice(amount: number | null | undefined, currency: string): string {
	if (amount === null || amount === undefined) return '—';
	return new Intl.NumberFormat(formatLocale(), {
		style: 'currency',
		currency,
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
		maximumFractionDigits: 2
	}).format(amount);
}
