/**
 * The catalog the seed script creates in Medusa. Edit anything here before you run it.
 *
 * Built from the photos in `static/photos`. Names, colors and tags are my reading of the pictures,
 * so check them. I did NOT invent prices or stock: set `defaultPrice` (or a `price` per product)
 * below, otherwise the script refuses to run.
 */

export interface ProductSpec {
	/** Short code used to build SKUs, e.g. "SRB" → WC-SRB-GLD-M. */
	code: string;
	title: string;
	/** Becomes the URL: /product/<handle>. */
	handle: string;
	/** Created automatically if it doesn't exist yet. */
	category: string;
	tags: string[];
	description: string;
	/** Each color becomes a swatch; `code` is used in SKUs. */
	colors: { name: string; code: string }[];
	/** Overrides `settings.sizes` for this product. */
	sizes?: string[];
	/** EUR price for every variant of this product. Overrides `settings.defaultPrice`. */
	price?: number;
	/** Units per variant. Overrides `settings.stock`. `null` = don't track stock (always in stock). */
	stock?: number | null;
	/** Photo files inside `settings.photosDir`, in gallery order (the first is the hero/thumbnail). */
	photos: string[];
	/**
	 * Which photos show which color, by color name. Each listed photo is attached to that color's variants
	 * in Medusa (Products → the product → a variant → Media), and the site shows those photos when the
	 * color is chosen. A photo not listed here is shown for no color (it is only a fallback for a color that has no photos of its own).
	 * A product with a single color needs no entry: all its photos go to that color.
	 * (Needs Medusa 2.11.2 or newer.)
	 */
	colorPhotos?: Record<string, string[]>;
	/**
	 * Optional videos (file names inside `settings.videosDir`, or full https URLs). They're stored in
	 * the product's metadata as `video`, `video_2`, … which the site plays. Uploading video files
	 * through Medusa is untested, so if it fails the script tells you and carries on.
	 */
	videos?: string[];
}

export const settings = {
	/** Prices are entered in this currency. It must be enabled on your Medusa store (EUR is). */
	currency: 'eur',

	/** Price used for every product that doesn't set its own. SET THIS (or each product's `price`). */
	defaultPrice: null as number | null,

	/** Sizes for every product that doesn't list its own. */
	sizes: ['XS', 'S', 'M', 'L', 'XL'],

	/**
	 * Units in stock per variant. `null` = Medusa doesn't track stock, so everything is always
	 * "in stock" (fine for a first look, but set real numbers before selling). With a number, the
	 * script tracks inventory and sets that quantity at your first stock location.
	 */
	stock: null as number | null,

	/** Name of the sales channel your publishable key uses. */
	salesChannel: 'Default Sales Channel',

	status: 'published' as 'published' | 'draft',

	photosDir: 'static/photos',
	videosDir: 'static/videos'
};

export const products: ProductSpec[] = [
	{
		code: 'SRB',
		title: 'Sequin Ring Bikini',
		handle: 'sequin-ring-bikini',
		category: 'Bikinis',
		tags: ['bikini', 'sequin', 'ring detail', 'side-tie', 'triangle top', 'sparkle'],
		description:
			'Sparkling sequin triangle bikini with ring hardware at the bust and hips, halter ties and tie-side bottoms.',
		colors: [
			{ name: 'Gold', code: 'GLD' },
			{ name: 'Olive', code: 'OLV' },
			{ name: 'Pistachio', code: 'PST' }
		],
		photos: [
			'IMG_1637.jpeg',
			'IMG_1643.jpeg',
			'IMG_1645.jpeg',
			'4b3228c7-59d0-49b4-a919-0091bff3b4f3.jpeg',
			'IMG_0424.jpeg',
			'IMG_0421.jpeg',
			'BEF574F2-AC3D-4FDE-9653-4465F3B49C46.jpeg'
		],
		// My reading of the pictures: check that each photo shows the color it is listed under.
		colorPhotos: {
			Gold: ['IMG_1637.jpeg', 'IMG_1643.jpeg'],
			Olive: ['IMG_0424.jpeg', 'IMG_0421.jpeg', 'BEF574F2-AC3D-4FDE-9653-4465F3B49C46.jpeg'],
			Pistachio: ['IMG_1645.jpeg', '4b3228c7-59d0-49b4-a919-0091bff3b4f3.jpeg']
		}
	},
	{
		code: 'RSB',
		title: 'Rose Bikini',
		handle: 'rose-bikini',
		category: 'Bikinis',
		tags: ['bikini', 'floral', 'rose appliqué', 'triangle top', 'side-tie', 'statement'],
		description: 'Triangle bikini with oversized rose appliqués at the bust and tie-side bottoms.',
		colors: [
			{ name: 'Pink', code: 'PNK' },
			{ name: 'Copper', code: 'CPR' }
		],
		photos: [
			'ps_B224D650-82F7-4D5B-A344-9F284EA63908.jpeg',
			'IMG_1595.jpeg',
			'IMG_9749.jpeg',
			'IMG_9607.jpeg'
		],
		colorPhotos: {
			Pink: ['ps_B224D650-82F7-4D5B-A344-9F284EA63908.jpeg', 'IMG_1595.jpeg'],
			Copper: ['IMG_9749.jpeg', 'IMG_9607.jpeg']
		}
	},
	{
		code: 'HWB',
		title: 'Holographic Wrap Bikini',
		handle: 'holographic-wrap-bikini',
		category: 'Bikinis',
		tags: ['bikini', 'holographic', 'metallic', 'wrap ties', 'strappy', 'statement'],
		description: 'Holographic silver triangle top with pink wrap ties and a strappy side-tie bottom.',
		colors: [{ name: 'Silver', code: 'SLV' }],
		photos: ['IMG_0317.jpeg']
	},
	{
		code: 'HOP',
		title: 'Holographic One-Piece',
		handle: 'holographic-one-piece',
		category: 'One Pieces',
		tags: ['one-piece', 'holographic', 'metallic', 'plunge', 'ring detail', 'cut-out'],
		description:
			'Plunging halter one-piece in holographic silver with a gold ring at the neckline and side cut-outs.',
		colors: [{ name: 'Silver', code: 'SLV' }],
		photos: ['9A44AF1F-4F83-4919-A384-2431D13ACBE4.jpeg']
	},
	{
		code: 'BRO',
		title: 'Black Ring One-Piece',
		handle: 'black-ring-one-piece',
		category: 'One Pieces',
		tags: ['one-piece', 'halter', 'ring detail', 'mesh', 'cut-out', 'classic'],
		description: 'Halter one-piece with a gold ring at the neckline and a sheer mesh waist.',
		colors: [{ name: 'Black', code: 'BLK' }],
		photos: ['IMG_1763.jpeg', 'E1C762E3-2DCF-4A86-B62E-4A0FCCFE776A.png']
	},
	{
		code: 'LWO',
		title: 'Leopard Wrap One-Piece',
		handle: 'leopard-wrap-one-piece',
		category: 'One Pieces',
		tags: ['one-piece', 'leopard', 'animal print', 'wrap', 'plunge', 'cut-out', 'tassel'],
		description:
			'Wrap-front plunge one-piece in a cream and tan leopard print, with a side cut-out and suede tassel.',
		colors: [{ name: 'Cream Leopard', code: 'CLP' }],
		photos: ['F8294FFE-4DCF-4BCC-BE06-8E620BE4E821.jpeg']
	},
	{
		code: 'CCB',
		title: 'Copper Chain Bikini',
		handle: 'copper-chain-bikini',
		category: 'Bikinis',
		tags: ['bikini', 'metallic', 'copper', 'ring detail', 'chain', 'string'],
		description: 'Metallic copper triangle bikini with ring links at the bust and hips.',
		colors: [{ name: 'Copper', code: 'CPR' }],
		photos: ['0E27F770-367A-45C5-BB32-D87D17D74476.png']
	}
];
