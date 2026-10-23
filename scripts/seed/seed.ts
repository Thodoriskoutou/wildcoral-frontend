/**
 * Seeds your Medusa store with the catalog in ./catalog.ts:
 * categories, tags, photos (uploaded from static/photos), products, variants, prices and,
 * optionally, stock.
 *
 *   npm run seed:dry     # checks the catalog and shows the plan — needs no login, sends nothing
 *   npm run seed         # does it for real (see README.md for how to provide your login)
 *
 * Safe to re-run: a product whose handle already exists is not created again (existing categories /
 * tags are reused), but its color photos are still attached to its variants if they aren't yet, so
 * this also fixes products created earlier. Skip that with --no-variant-images. Your login is read
 * from environment variables in your own terminal — it is never written to any file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type Medusa from '@medusajs/js-sdk';
import type { HttpTypes } from '@medusajs/types';
import { settings, products, type ProductSpec } from './catalog.ts';
import { ROOT, say, fail, explain, connect, uploadFile } from './common.ts';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const only = argv.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const ONLY = only
	? only
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	: null;

// Handy shortcuts: --price=120 and --stock=5 override the values in catalog.ts for this run.
const numberArg = (name: string) => {
	const raw = argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
	return raw === undefined || raw === '' ? undefined : Number(raw);
};
const priceArg = numberArg('price');
if (priceArg !== undefined) settings.defaultPrice = priceArg;
const stockArg = numberArg('stock');
if (stockArg !== undefined) settings.stock = stockArg;

const NO_VARIANT_IMAGES = argv.includes('--no-variant-images');

const isUrl = (s: string) => /^https?:\/\//i.test(s);

// ---------------------------------------------------------------------------------------------
// Plan + validation (no network)
// ---------------------------------------------------------------------------------------------

interface VariantPlan {
	title: string;
	sku: string;
	color: string;
	size: string;
}
interface Plan {
	spec: ProductSpec;
	sizes: string[];
	price: number | null;
	stock: number | null;
	variants: VariantPlan[];
	/** Color name → the photo files shown for that color (and attached to its variants). */
	colorPhotos: Record<string, string[]>;
}

/** Which photo files belong to which color: the explicit mapping, or everything for a one-color product. */
function resolveColorPhotos(spec: ProductSpec): Record<string, string[]> {
	if (spec.colorPhotos) return spec.colorPhotos;
	if (spec.colors.length === 1) return { [spec.colors[0].name]: spec.photos };
	return {};
}

function buildPlan(spec: ProductSpec): Plan {
	const sizes = spec.sizes ?? settings.sizes;
	const variants: VariantPlan[] = [];
	for (const color of spec.colors) {
		for (const size of sizes) {
			variants.push({
				title: `${color.name} / ${size}`,
				sku: `WC-${spec.code}-${color.code}-${size}`.toUpperCase().replace(/\s+/g, ''),
				color: color.name,
				size
			});
		}
	}
	return {
		spec,
		sizes,
		price: spec.price ?? settings.defaultPrice,
		stock: spec.stock !== undefined ? spec.stock : settings.stock,
		variants,
		colorPhotos: resolveColorPhotos(spec)
	};
}

const photoPath = (file: string) => path.join(ROOT, settings.photosDir, file);
const videoPath = (file: string) => path.join(ROOT, settings.videosDir, file);

function validate(plans: Plan[]): string[] {
	const problems: string[] = [];
	const handles = new Set<string>();
	const skus = new Set<string>();

	for (const p of plans) {
		const name = p.spec.title;
		if (typeof p.price !== 'number' || !(p.price > 0)) {
			problems.push(`${name}: no price. Set settings.defaultPrice (or this product's price) in scripts/seed/catalog.ts.`);
		}
		if (handles.has(p.spec.handle)) problems.push(`${name}: duplicate handle "${p.spec.handle}".`);
		handles.add(p.spec.handle);
		if (p.spec.colors.length === 0) problems.push(`${name}: needs at least one color.`);
		if (p.sizes.length === 0) problems.push(`${name}: needs at least one size.`);
		for (const v of p.variants) {
			if (skus.has(v.sku)) problems.push(`${name}: duplicate SKU ${v.sku} (check the product/color codes).`);
			skus.add(v.sku);
		}
		for (const photo of p.spec.photos) {
			if (!fs.existsSync(photoPath(photo))) problems.push(`${name}: photo not found: ${settings.photosDir}/${photo}`);
		}
		const colorNames = new Set(p.spec.colors.map((c) => c.name.toLowerCase()));
		for (const [color, files] of Object.entries(p.spec.colorPhotos ?? {})) {
			if (!colorNames.has(color.toLowerCase())) problems.push(`${name}: colorPhotos lists "${color}", which isn't one of its colors.`);
			for (const file of files) {
				if (!p.spec.photos.includes(file)) problems.push(`${name}: colorPhotos[${color}] uses "${file}", which isn't in its photos list.`);
			}
		}
		for (const video of p.spec.videos ?? []) {
			if (!isUrl(video) && !fs.existsSync(videoPath(video))) {
				problems.push(`${name}: video not found: ${settings.videosDir}/${video}`);
			}
		}
	}
	return problems;
}

function printPlan(plans: Plan[]) {
	say(`Catalog: ${plans.length} product(s), ${plans.reduce((n, p) => n + p.variants.length, 0)} variants\n`);
	for (const p of plans) {
		const price = typeof p.price === 'number' ? `${p.price} ${settings.currency.toUpperCase()}` : 'NO PRICE';
		const stock = p.stock === null ? 'stock not tracked' : `${p.stock} per variant`;
		say(`• ${p.spec.title}  (/product/${p.spec.handle})`);
		say(`    category: ${p.spec.category}   tags: ${p.spec.tags.join(', ')}`);
		say(
			`    colors: ${p.spec.colors.map((c) => c.name).join(', ')}   sizes: ${p.sizes.join(', ')}   → ${p.variants.length} variants`
		);
		say(`    price: ${price}   ${stock}   photos: ${p.spec.photos.length}   videos: ${p.spec.videos?.length ?? 0}`);
		const perColor = p.spec.colors.map((c) => {
			const files = Object.entries(p.colorPhotos).find(([name]) => name.toLowerCase() === c.name.toLowerCase())?.[1] ?? [];
			return `${c.name}: ${files.length}`;
		});
		say(`    photos per color: ${perColor.join(', ')}${p.spec.colors.length > 1 && !p.spec.colorPhotos ? '   (! add colorPhotos so each color shows its own photos)' : ''}`);
	}
	say();
}

// ---------------------------------------------------------------------------------------------
// Photos on variants (needs Medusa 2.11.2 or newer)
// ---------------------------------------------------------------------------------------------

type ImageRow = { id: string; url: string };
type OptionRow = { id: string; title?: string; values?: { value: string }[] };
type VariantRow = {
	id: string;
	sku?: string | null;
	thumbnail?: string | null;
	images?: { id: string }[];
	options?: { option_id?: string; value?: string }[];
};
type ProductRow = { images?: ImageRow[]; variants?: VariantRow[]; options?: OptionRow[] };

class VariantImagesUnsupported extends Error {}

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const safeDecode = (s: string) => {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
};
const isColorTitle = (title: string | undefined) => /^(colou?rs?|χρώματα?|χρώμα)$/i.test((title ?? '').trim());

/** The hash of what a Medusa image URL serves (cached for the run); '' when it can't be fetched. */
const remoteHashes = new Map<string, string>();
async function remoteHash(url: string): Promise<string> {
	const cached = remoteHashes.get(url);
	if (cached !== undefined) return cached;
	let hash = '';
	try {
		const res = await fetch(url);
		if (res.ok) hash = sha256(Buffer.from(await res.arrayBuffer()));
	} catch {
		/* unreachable image: stays unmatched */
	}
	remoteHashes.set(url, hash);
	return hash;
}

/**
 * Finds the Medusa image for each photo file, never guessing:
 *   1. a product this run just created: the uploaded URL is known exactly;
 *   2. otherwise the file's name (without extension) is looked for inside each image's address, because
 *      Medusa's file storage normally keeps the original name in it;
 *   3. if that finds nothing (some storage setups rename uploads), the picture itself is compared: the
 *      file on disk is identical to what was uploaded, so the two hash the same.
 * A photo that still can't be found is reported, so it is never attached to the wrong color.
 */
async function matchImages(files: string[], images: ImageRow[], uploaded?: Map<string, string>): Promise<Map<string, string>> {
	const found = new Map<string, string>();
	const keyed = images.map((i) => ({ ...i, key: safeDecode(i.url).toLowerCase() }));
	const unmatched: string[] = [];
	for (const file of files) {
		const exactUrl = uploaded?.get(file);
		const hit =
			(exactUrl ? keyed.find((i) => i.url === exactUrl) : undefined) ?? keyed.find((i) => i.key.includes(path.parse(file).name.toLowerCase()));
		if (hit) found.set(file, hit.id);
		else unmatched.push(file);
	}
	for (const file of unmatched) {
		const wanted = sha256(fs.readFileSync(photoPath(file)));
		for (const image of images) {
			if ([...found.values()].includes(image.id)) continue;
			if ((await remoteHash(image.url)) === wanted) {
				found.set(file, image.id);
				break;
			}
		}
	}
	return found;
}

interface LinkResult {
	linked: number;
	already: number;
	thumbnails: number;
	/** One line per color: what was found. */
	lines: string[];
	/** Things that need a look; the run reports them at the end and exits with an error. */
	problems: string[];
}

/** Medusa answers an unknown route with a bare 404/405; a missing image or variant says what it is. */
function routeIsMissing(e: unknown): boolean {
	const { status, message } = e as { status?: number; message?: string };
	return (status === 404 || status === 405) && !/(image|variant|product)/i.test(message ?? '');
}

/**
 * For each color: attaches its photos to its variants (every size of the color) and sets those variants'
 * thumbnail to the color's first photo (the thumbnail is a separate field, and the one the admin's
 * variant list shows). Links that are already there are skipped, so it can be run again and again,
 * including on products created before this existed.
 *
 * Variants are found by SKU, and also by their color value, in case the SKUs were changed in the admin.
 */
async function linkVariantImages(sdk: Medusa, productId: string, plan: Plan, uploaded?: Map<string, string>): Promise<LinkResult> {
	const result: LinkResult = { linked: 0, already: 0, thumbnails: 0, lines: [], problems: [] };
	const entries = Object.entries(plan.colorPhotos).filter(([, files]) => files.length > 0);
	if (entries.length === 0) return result;

	const fetchProduct = async (fields: string) => (await sdk.admin.product.retrieve(productId, { fields })).product as unknown as ProductRow;
	let product: ProductRow;
	try {
		product = await fetchProduct('*images,*options,*options.values,*variants,*variants.options,*variants.images');
	} catch {
		// A Medusa that doesn't know variant images rejects that field; without it existing links can't be seen.
		product = await fetchProduct('*images,*options,*options.values,*variants,*variants.options');
	}
	const images = product.images ?? [];
	const colorOption = (product.options ?? []).find((o) => isColorTitle(o.title));
	const colorOf = (v: VariantRow) => (colorOption ? v.options?.find((o) => o.option_id === colorOption.id)?.value : undefined) ?? '';
	const thumbnailUpdates: { id: string; thumbnail: string }[] = [];

	for (const [colorName, files] of entries) {
		const color = plan.spec.colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
		const skus = new Set(plan.variants.filter((v) => v.color === color?.name).map((v) => v.sku.toUpperCase()));
		const variants = (product.variants ?? []).filter(
			(v) => skus.has(String(v.sku ?? '').toUpperCase()) || colorOf(v).toLowerCase() === colorName.toLowerCase()
		);
		if (variants.length === 0) {
			const have = (colorOption?.values ?? []).map((v) => v.value).join(', ') || 'unknown';
			result.problems.push(`${colorName}: no variants found for it in Medusa (looked for SKUs like ${[...skus][0]} and for the color name). Medusa has these colors: ${have}`);
			continue;
		}

		const matched = await matchImages(files, images, uploaded);
		for (const file of files.filter((f) => !matched.has(f))) {
			result.problems.push(`${file}: not found among this product's ${images.length} images, so it wasn't attached to ${colorName}`);
		}

		let linkedHere = 0;
		for (const file of files) {
			const imageId = matched.get(file);
			if (!imageId) continue;
			const missing = variants.filter((v) => !(v.images ?? []).some((i) => i.id === imageId));
			result.already += variants.length - missing.length;
			if (missing.length === 0) continue;
			try {
				await sdk.admin.product.batchImageVariants(productId, imageId, { add: missing.map((v) => v.id) });
				linkedHere += missing.length;
			} catch (e) {
				if (routeIsMissing(e)) throw new VariantImagesUnsupported();
				result.problems.push(`${file} → ${colorName}: ${explain(e)}`);
			}
		}
		result.linked += linkedHere;

		const firstPhoto = files.find((f) => matched.has(f));
		const thumbnail = firstPhoto ? images.find((i) => i.id === matched.get(firstPhoto))?.url : undefined;
		if (thumbnail) {
			for (const v of variants) if (v.thumbnail !== thumbnail) thumbnailUpdates.push({ id: v.id, thumbnail });
		}
		result.lines.push(`${colorName}: ${matched.size} of ${files.length} photos found, ${variants.length} variants${linkedHere ? `, ${linkedHere} link(s) added` : ''}`);
	}

	// Colors Medusa has that the catalog doesn't know: they'd silently stay without photos.
	for (const value of (colorOption?.values ?? []).map((v) => v.value)) {
		if (!plan.spec.colors.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
			result.problems.push(
				`Medusa has the color "${value}", which catalog.ts doesn't list for this product, so it gets no photos. Add it to its colors (with its SKU code) and colorPhotos in catalog.ts, then run again.`
			);
		}
	}

	if (thumbnailUpdates.length > 0) {
		try {
			await sdk.admin.product.batchVariants(productId, { update: thumbnailUpdates });
			result.thumbnails = thumbnailUpdates.length;
		} catch (e) {
			result.problems.push(`couldn't set the variant thumbnails: ${explain(e)}`);
		}
	}
	return result;
}

const describeLinks = (r: LinkResult) =>
	r.linked > 0 || r.thumbnails > 0
		? `attached photos to variants (${r.linked} new link(s), ${r.already} already there, ${r.thumbnails} thumbnail(s) set)`
		: r.already > 0
			? 'variant photos and thumbnails already in place'
			: 'no color photos to attach';

const UNSUPPORTED_NOTE =
	'    Your Medusa doesn\'t offer photos on variants (it needs Medusa 2.11.2 or newer). Update Medusa to use this; the products themselves are fine.';


// ---------------------------------------------------------------------------------------------
// The real work
// ---------------------------------------------------------------------------------------------

async function seed(sdk: Medusa, plans: Plan[]) {
	// --- lookups -----------------------------------------------------------------------------
	const { sales_channels } = await sdk.admin.salesChannel.list({ limit: 100 });
	const channel =
		sales_channels.find((c) => c.name.toLowerCase() === settings.salesChannel.toLowerCase()) ??
		(sales_channels.length === 1 ? sales_channels[0] : undefined);
	if (!channel) {
		fail(
			`No sales channel named "${settings.salesChannel}". Found: ${sales_channels.map((c) => c.name).join(', ') || '(none)'}. ` +
				'Set settings.salesChannel in scripts/seed/catalog.ts.'
		);
	}
	say(`Sales channel: ${channel.name}`);

	const { shipping_profiles } = await sdk.admin.shippingProfile.list({ limit: 100 });
	const profile = shipping_profiles.find((p) => p.type === 'default') ?? shipping_profiles[0];
	say(`Shipping profile: ${profile ? profile.name : '(none found — products are created without one)'}`);

	const needsStock = plans.some((p) => p.stock !== null);
	let locationId: string | undefined;
	if (needsStock) {
		const { stock_locations } = await sdk.admin.stockLocation.list({ limit: 50, fields: 'id,name,*sales_channels' });
		const location = stock_locations[0];
		if (!location) fail('Stock is set in the catalog but your store has no stock location. Create one in Settings → Locations & Shipping.');
		locationId = location.id;
		say(`Stock location: ${location.name}`);
		const linked = (location.sales_channels ?? []).some((c) => c.id === channel.id);
		if (!linked) {
			say(`  ! "${location.name}" is not linked to the "${channel.name}" sales channel yet, so stock won't show on the site.`);
			say('    Link it in Settings → Locations & Shipping → the location → Sales channels.');
		}
	}
	say();

	// --- categories --------------------------------------------------------------------------
	const { product_categories } = await sdk.admin.productCategory.list({ limit: 500, fields: 'id,name,handle' });
	const categoryIds = new Map(product_categories.map((c) => [c.name.toLowerCase(), c.id]));
	for (const name of new Set(plans.map((p) => p.spec.category))) {
		if (categoryIds.has(name.toLowerCase())) {
			say(`Category "${name}": exists`);
			continue;
		}
		const { product_category } = await sdk.admin.productCategory.create({ name, is_active: true });
		categoryIds.set(name.toLowerCase(), product_category.id);
		say(`Category "${name}": created`);
	}

	// --- tags --------------------------------------------------------------------------------
	const { product_tags } = await sdk.admin.productTag.list({ limit: 1000 });
	const tagIds = new Map(product_tags.map((t) => [t.value.toLowerCase(), t.id]));
	let createdTags = 0;
	for (const value of new Set(plans.flatMap((p) => p.spec.tags))) {
		if (tagIds.has(value.toLowerCase())) continue;
		const { product_tag } = await sdk.admin.productTag.create({ value });
		tagIds.set(value.toLowerCase(), product_tag.id);
		createdTags++;
	}
	say(`Tags: ${tagIds.size} available (${createdTags} created)\n`);

	// --- products ----------------------------------------------------------------------------
	const uploads = new Map<string, string>();
	const created: string[] = [];
	const skipped: string[] = [];
	const photoLinked: string[] = [];
	const photoProblems: string[] = [];
	const failed: { title: string; error: string }[] = [];
	let variantImagesUnsupported = false;

	for (const plan of plans) {
		const { spec } = plan;
		try {
			const existing = await sdk.admin.product.list({ handle: spec.handle, limit: 1, fields: 'id,handle' });
			if (existing.products.length > 0) {
				if (NO_VARIANT_IMAGES || variantImagesUnsupported || Object.keys(plan.colorPhotos).length === 0) {
					say(`- ${spec.title}: already exists, skipped`);
					skipped.push(spec.title);
					continue;
				}
				try {
					const result = await linkVariantImages(sdk, existing.products[0].id, plan);
					say(`- ${spec.title}: already exists; ${describeLinks(result)}`);
					for (const line of result.lines) say(`    ${line}`);
					for (const problem of result.problems) {
						say(`    ! ${problem}`);
						photoProblems.push(`${spec.title}: ${problem}`);
					}
					(result.linked > 0 || result.thumbnails > 0 ? photoLinked : skipped).push(spec.title);
				} catch (e) {
					if (!(e instanceof VariantImagesUnsupported)) throw e;
					variantImagesUnsupported = true;
					say(`- ${spec.title}: already exists, skipped`);
					say(UNSUPPORTED_NOTE);
					skipped.push(spec.title);
				}
				continue;
			}

			say(`- ${spec.title}: uploading ${spec.photos.length} photo(s)…`);
			const imageUrls: string[] = [];
			for (const photo of spec.photos) imageUrls.push(await uploadFile(sdk, uploads, photoPath(photo)));

			const metadata: Record<string, string> = {};
			let videoIndex = 0;
			for (const video of spec.videos ?? []) {
				try {
					const url = isUrl(video) ? video : await uploadFile(sdk, uploads, videoPath(video));
					videoIndex++;
					metadata[videoIndex === 1 ? 'video' : `video_${videoIndex}`] = url;
				} catch (e) {
					say(`    (video "${video}" skipped: ${explain(e)})`);
				}
			}

			const body: HttpTypes.AdminCreateProduct = {
				title: spec.title,
				handle: spec.handle,
				description: spec.description,
				status: settings.status,
				thumbnail: imageUrls[0],
				images: imageUrls.map((url) => ({ url })),
				categories: [{ id: categoryIds.get(spec.category.toLowerCase())! }],
				tags: spec.tags.map((t) => ({ id: tagIds.get(t.toLowerCase())! })),
				sales_channels: [{ id: channel.id }],
				options: [
					{ title: 'Color', values: spec.colors.map((c) => c.name) },
					{ title: 'Size', values: plan.sizes }
				],
				variants: plan.variants.map((v) => ({
					title: v.title,
					sku: v.sku,
					manage_inventory: plan.stock !== null,
					allow_backorder: false,
					options: { Color: v.color, Size: v.size },
					prices: [{ currency_code: settings.currency, amount: plan.price! }]
				})),
				...(profile ? { shipping_profile_id: profile.id } : {}),
				...(Object.keys(metadata).length ? { metadata } : {})
			};

			const { product: createdProduct } = await sdk.admin.product.create(body);
			say(`    created with ${plan.variants.length} variants`);

			if (!NO_VARIANT_IMAGES && !variantImagesUnsupported && Object.keys(plan.colorPhotos).length > 0) {
				try {
					const uploadedByFile = new Map(spec.photos.map((file, i) => [file, imageUrls[i]]));
					const result = await linkVariantImages(sdk, createdProduct.id, plan, uploadedByFile);
					say(`    ${describeLinks(result)}`);
					for (const line of result.lines) say(`    ${line}`);
					for (const problem of result.problems) {
						say(`    ! ${problem}`);
						photoProblems.push(`${spec.title}: ${problem}`);
					}
				} catch (e) {
					if (!(e instanceof VariantImagesUnsupported)) throw e;
					variantImagesUnsupported = true;
					say(UNSUPPORTED_NOTE);
				}
			}

			if (plan.stock !== null && locationId) {
				const { inventory_items } = await sdk.admin.inventoryItem.list({ sku: plan.variants.map((v) => v.sku), limit: 500 });
				for (const item of inventory_items) {
					const level = { location_id: locationId, stocked_quantity: plan.stock };
					try {
						await sdk.admin.inventoryItem.batchInventoryItemLocationLevels(item.id, { create: [level] });
					} catch {
						await sdk.admin.inventoryItem.batchInventoryItemLocationLevels(item.id, { update: [level] });
					}
				}
				say(`    stock set to ${plan.stock} on ${inventory_items.length} variant(s)`);
			}
			created.push(spec.title);
		} catch (e) {
			say(`    ✗ failed: ${explain(e)}`);
			failed.push({ title: spec.title, error: explain(e) });
		}
	}

	// --- report ------------------------------------------------------------------------------
	say('\n──────── Done ────────');
	say(`Created: ${created.length}${created.length ? ' — ' + created.join(', ') : ''}`);
	if (photoLinked.length) say(`Photos linked to variants on existing products: ${photoLinked.join(', ')}`);
	if (skipped.length) say(`Skipped (already there, nothing to add): ${skipped.join(', ')}`);
	if (failed.length) {
		say(`Failed: ${failed.length}`);
		for (const f of failed) say(`  • ${f.title}: ${f.error}`);
	}
	say('\nReload your site: the products appear on /shop and the home page straight away.');
	if (photoProblems.length) {
		say(`
Photos that need attention (${photoProblems.length}):`);
		for (const p of photoProblems) say(`  • ${p}`);
		say('Fix these in catalog.ts (or by hand in the admin) and run again: what is already attached is left alone.');
	}
	if (failed.length) process.exit(1);
	if (photoProblems.length) process.exitCode = 1;
}

// ---------------------------------------------------------------------------------------------

const selected = ONLY ? products.filter((p) => ONLY.includes(p.handle)) : products;
if (ONLY && selected.length === 0) fail(`--only matched nothing. Handles: ${products.map((p) => p.handle).join(', ')}`);

const plans = selected.map(buildPlan);
printPlan(plans);

const problems = validate(plans);
if (problems.length) {
	console.error('Fix these first:');
	for (const p of problems) console.error(`  ✗ ${p}`);
	process.exit(1);
}

if (DRY_RUN) {
	say('Dry run: the catalog looks good and nothing was sent to Medusa.');
} else {
	const sdk = await connect();
	await seed(sdk, plans);
}
