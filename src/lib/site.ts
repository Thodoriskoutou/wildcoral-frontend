import type { Locale } from '$lib/i18n/config';
import type { Localized } from '$lib/i18n/localized';

/**
 * Store-owner settings that aren't in Medusa. Fill these in and the matching parts of the site
 * appear; anything left empty stays hidden, so the site never shows a dead link or a made-up claim.
 *
 * A setting typed `Localized` is either one text for every language ('Mon–Fri 10:00–18:00') or one
 * text per language ({ en: '…', el: '…' }); a missing language falls back to English.
 */
export const site = {
	name: 'Wild Coral',

	/** Slug of the Medusa content-plugin collection that holds the Journal posts (in the default language). */
	journalCollection: 'journal',
	/**
	 * The content plugin has no languages, so every other language gets a collection of its own (create
	 * it in the Admin under Content, with the same custom fields). A translated post has the slug of the
	 * original plus `slugSuffix` (`finding-your-fit` → `finding-your-fit-el`): the plugin looks a post up
	 * by its slug alone, so two collections cannot share one. The site's addresses stay the same in every
	 * language (`/el/journal/finding-your-fit`) and the language switch lands on the translation. Posts
	 * that are not translated yet still show, in the default language.
	 */
	journalCollections: { el: { collection: 'journal-el', slugSuffix: '-el' } } as Partial<
		Record<Locale, { collection: string; slugSuffix: string }>
	>,

	/**
	 * Social profiles shown as icons in the footer ("Follow Us"). For each network:
	 *   - a full URL      → a working link (e.g. 'https://www.instagram.com/yourhandle')
	 *   - '' (empty)      → the icon shows dimmed and not clickable, until you add the URL
	 *   - key removed     → that network isn't shown at all
	 * Also supported: tiktok, youtube (add the key to show them).
	 */
	social: {
		instagram: '',
		facebook: '',
		pinterest: ''
	} as Partial<Record<'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'youtube', string>>,
	/** Shown under the footer icons, e.g. '@yourhandle'. */
	instagramHandle: '',
	/** Shown on the order-confirmation page, e.g. '#WildCoral'. */
	hashtag: '#WildCoral',

	/**
	 * Short intro under the heading on /shop. A category's own description in Medusa
	 * (Products → Categories → the category → Description) replaces it on that category's page.
	 */
	shopIntro: {
		en: 'Swimwear for long summer days. Explore the collection below.',
		el: 'Μαγιό για μεγάλες καλοκαιρινές μέρες. Εξερευνήστε τη συλλογή παρακάτω.'
	} as Localized,

	/**
	 * One line about delivery for the "Delivery" block on /shop, e.g. 'Delivery across Greece from €4.50.'
	 * Keep it in step with the shipping options in Medusa (Settings → Locations & Shipping).
	 */
	deliveryNote: {
		en: 'Delivery options and prices are shown at checkout.',
		el: 'Οι επιλογές και οι τιμές αποστολής εμφανίζονται στο ταμείο.'
	} as Localized,

	/**
	 * Your size chart, one row per size, shown in the size guide and on product pages. Measurements are
	 * body measurements in the unit below. Left empty, the size guide shows no table (and asks customers
	 * to write to you) rather than showing numbers you haven't confirmed.
	 *   e.g. { size: 'S', bust: '84–88', waist: '64–68', hips: '90–94' }
	 */
	sizeChart: [] as { size: string; bust: string; waist: string; hips: string }[],
	sizeChartUnit: 'cm',

	/** Public contact email, shown on the /contact page (and used as the form's destination unless CONTACT_TO_EMAIL is set). */
	contactEmail: '',
	/** Shown on the /contact page, e.g. '+30 210 000 0000'. Empty hides the line. */
	phone: '',
	/** Shown on the /contact page, e.g. 'Ermou 12, 105 63 Athens'. Empty hides the line. */
	address: '' as Localized,

	/** Support hours shown on the /contact and customer-care pages, e.g. 'Monday–Friday, 10:00–18:00 (Athens time)'. Empty hides the line. */
	supportHours: '' as Localized,

	/** Links used by the cookie banner. Add the URL of each page once it exists (e.g. '/privacy'). */
	legal: {
		privacy: '',
		cookies: '',
		terms: ''
	},

	/**
	 * "As featured in" strip on the home page. Add real outlets only (e.g. ['Vogue Greece']);
	 * while empty the whole section is hidden.
	 */
	press: [] as string[],

	/**
	 * Where the home page "Join the Muse List" form posts to (the form action URL from your email
	 * provider). While empty the whole section is hidden, because a subscribe button that goes
	 * nowhere would just lose people's emails.
	 */
	newsletterAction: '',

	/**
	 * "Shop the Look" markers on the home page photo. `x` / `y` are percentages across / down the
	 * photo; `handle` is the Medusa product handle the marker opens. A marker whose product doesn't
	 * exist (yet) is simply not shown.
	 */
	shopTheLook: [
		{ x: 54, y: 56, handle: 'sequin-ring-bikini' },
		{ x: 42, y: 72, handle: 'sequin-ring-bikini' }
	]
};

/**
 * Photos used for the site's styling (files live in `static/photos`). Change a path here to swap
 * the picture everywhere it is used.
 */
export const photos = {
	hero: '/photos/IMG_0421.jpeg',
	shopTheLook: '/photos/IMG_0424.jpeg',
	onePiece: '/photos/9A44AF1F-4F83-4919-A384-2431D13ACBE4.jpeg',
	bikini: '/photos/IMG_1645.jpeg',
	orderConfirmed: '/photos/IMG_1643.jpeg',
	account: '/photos/IMG_1637.jpeg',
	editorial: '/photos/IMG_1595.jpeg',
	detail: '/photos/IMG_9607.jpeg',
	notFound: '/photos/4b3228c7-59d0-49b4-a919-0091bff3b4f3.jpeg'
};
