/**
 * What the journal seed tool creates in Medusa's content plugin: the "journal" collection, the
 * custom fields the site reads, one author, and five starter posts. Edit anything before running.
 *
 * The starter posts are neutral editorial pieces (style notes and how-tos): they make no claims
 * about where or how your pieces are made. They are created as DRAFTS so you can read and edit
 * them first, then publish in Medusa (or run with `--publish`).
 */

import { greekJournal } from './journal-catalog-el.ts';

/** The texts of a post in another language (the rest of the post is shared with the original). */
export interface PostTranslation {
	title: string;
	category: string;
	excerpt: string;
	tags: string[];
	/** Markdown. */
	body: string;
}

export interface PostSpec {
	title: string;
	/** Lowercase letters, numbers and hyphens only. Becomes /journal/<slug>. */
	slug: string;
	category: string;
	/** Short summary shown on the journal cards. */
	excerpt: string;
	/** Site-relative image (from static/) or a full https URL. */
	cover: string;
	tags: string[];
	/** Product handles for "Shop the Story" (leave empty to show the newest products). */
	products: string[];
	/** Mark one post as the big hero on the Journal page (otherwise the newest post is used). */
	featured?: boolean;
	/** Markdown. */
	body: string;
}

export const journal = {
	collection: { label: 'Journal', slug: 'journal', format: 'md' as const },

	/**
	 * Custom fields shown when editing a post in Medusa. Their values are what the site reads
	 * (excerpt, cover image, category, featured flag, product handles).
	 */
	fields: [
		{ name: 'excerpt', label: 'Excerpt (short summary for cards)', field_type: 'text', default_value: '' },
		{ name: 'cover_image', label: 'Cover image URL', field_type: 'image', default_value: '' },
		{ name: 'category', label: 'Category (label above the title)', field_type: 'text', default_value: '' },
		{ name: 'featured', label: 'Featured (big hero on the Journal page)', field_type: 'boolean', default_value: false },
		{
			name: 'products',
			label: 'Products for "Shop the Story" (product handles, comma-separated)',
			field_type: 'text',
			default_value: ''
		}
	] as { name: string; label: string; field_type: string; default_value: string | boolean }[],

	creator: {
		name: 'Wild Coral',
		bio: 'Style notes, guides and summer inspiration from the Wild Coral team.'
	},

	/** Photo files in static/ used as covers are checked for existence before anything is sent. */
	photosDir: 'static',

	posts: [
		{
			title: 'Summer Reverie: Chasing the Golden Hour',
			slug: 'summer-reverie-golden-hour',
			category: 'Lifestyle',
			excerpt: 'The best light of the day arrives just as the beach empties. A love letter to slow summer evenings.',
			cover: '/photos/IMG_0421.jpeg',
			tags: ['summer', 'lifestyle', 'golden hour'],
			products: ['sequin-ring-bikini', 'rose-bikini'],
			featured: true,
			body: `There is a moment, somewhere between the last swim and the first cold drink, when the whole coast turns to honey. The heat softens, the sea goes quiet, and everything you are wearing seems to catch the light.

This is the golden hour, and it is the reason summer exists.

## Slow down on purpose

Summer rewards the unhurried. Stay for one more swim. Let lunch run long. Pick the table with the view, and the seat facing the water. The plan for the evening is simply to be there for it.

## Dress for the light

Some things only make sense at sunset. Metallics glow, sequins scatter tiny flashes across the skin, and warm tones — copper, gold, olive — seem to belong to the sky. Keep everything else simple: bare shoulders, a loose shirt tied at the waist, gold jewellery, and nothing that competes with the horizon.

> The best summer plans have no schedule, only a direction: towards the water, towards the light.

## Make a ritual of it

- Walk down to the shore just before sunset, not after.
- Bring something cold to drink and a towel large enough to share.
- Leave your phone in the bag for the first ten minutes.
- Stay until the colour has gone from the sky.

That is all it takes. The golden hour is free, it happens every day, and it is always worth showing up for.`
		},
		{
			title: 'How to Pack the Perfect Swim Bag',
			slug: 'how-to-pack-the-perfect-swim-bag',
			category: 'Guide',
			excerpt: 'A simple checklist for beach days, boat days and pool days, so you never leave without the essentials.',
			cover: '/photos/4b3228c7-59d0-49b4-a919-0091bff3b4f3.jpeg',
			tags: ['guide', 'travel', 'essentials'],
			products: ['holographic-one-piece', 'copper-chain-bikini'],
			body: `A good swim bag is a small piece of planning that makes the whole day easier. Here is what we would put in it.

## The essentials

- **Your swimwear, plus a spare.** A dry second set is the small luxury you will be glad of after the first swim.
- **Sun protection.** Sunscreen, a hat and sunglasses. Reapply after swimming.
- **A large, quick-drying towel** — big enough to lie on, light enough to carry.
- **A reusable water bottle.** Salt and sun are thirsty work.

## For the walk home

- A light cover-up or loose shirt.
- Flat sandals that are easy to slip on and off.
- A small tote or wet bag for damp swimwear, so nothing else in your bag gets wet.

## The finishing touches

A tube of lip balm with SPF, a hair tie, a paperback you have been meaning to finish, and a little cash for the beach bar. If you are heading straight from the water to dinner, add a change of clothes and a small bottle of perfume.

Pack it once, keep it by the door, and every summer day starts with the bag already ready.`
		},
		{
			title: 'Caring for Your Swimwear',
			slug: 'caring-for-your-swimwear',
			category: 'Care',
			excerpt: 'A few gentle habits keep your favourite pieces looking their best, season after season.',
			cover: '/photos/IMG_0317.jpeg',
			tags: ['care', 'guide'],
			products: ['holographic-wrap-bikini', 'copper-chain-bikini'],
			body: `Swimwear works hard: sun, salt, chlorine and sunscreen all take their toll. A little care after each wear makes a real difference.

> Always follow the care label sewn into your piece. What follows is general guidance for swimwear.

## After every swim

- **Rinse in cool, fresh water** as soon as you can, to wash away salt, chlorine and sunscreen.
- **Do not leave it damp** in your bag or on a hot deck for hours.

## Washing

- Wash by hand in cool water with a mild detergent.
- Press the water out gently. **Do not wring or twist** the fabric.
- Skip the tumble dryer and the washing machine unless the label says otherwise.

## Drying

Lay your piece flat, in the shade, away from direct sun and heat. Direct sun fades colour and strains stretch fabric.

## Extra gentle for embellished pieces

Sequins, rings and other hardware deserve extra gentleness. Keep them away from rough surfaces, sunbeds and Velcro, and avoid folding them tightly when damp. Store them flat or loosely rolled.

Treat your swimwear kindly and it will keep its shape, its colour and its sparkle for many summers.`
		},
		{
			title: 'Finding Your Fit: A Simple Guide to Sizing',
			slug: 'finding-your-fit',
			category: 'Guide',
			excerpt: 'Three measurements and a few minutes are all you need to choose the right size with confidence.',
			cover: '/photos/IMG_1645.jpeg',
			tags: ['guide', 'sizing'],
			products: ['sequin-ring-bikini'],
			body: `The right fit is what makes swimwear feel effortless. Here is how to find yours.

## Take three measurements

Use a soft tape measure over light clothing or underwear, keeping the tape snug but not tight.

- **Bust** — around the fullest part of your chest.
- **Waist** — around the narrowest part of your waist.
- **Hips** — around the fullest part of your hips.

Write them down, then compare them with the [size guide](/customer-care).

## If you are between sizes

- For ties and adjustable straps, you can often choose the smaller size and adjust.
- For a fuller, more secure fit, choose the larger size.
- Different measurements for top and bottom? It is very common. Choose the size that suits each measurement best.

## A few tips

- Measure in the morning, when your body is at its most relaxed.
- Fabric with stretch needs a snug fit to hold its shape when wet.
- If you are unsure, ask us. We are happy to help you choose.

A few minutes now means a piece you will reach for all summer.`
		},
		{
			title: 'Island Style: From Beach to Dinner',
			slug: 'island-style-beach-to-dinner',
			category: 'Style',
			excerpt: 'One swimsuit, three looks: how to go from the water to the table without missing a beat.',
			cover: '/photos/IMG_1763.jpeg',
			tags: ['style', 'resort'],
			products: ['black-ring-one-piece', 'leopard-wrap-one-piece'],
			body: `The best island days flow from the water to the table without a change of plan. The secret is a swimsuit that already looks like an outfit.

## The look: beach

Keep it minimal. A great one-piece, sunglasses, a wide-brimmed hat and flat sandals. Let the swimsuit do the talking.

## The look: lunch

Add a light wrap or a loose linen shirt worn open over your swimsuit. Swap the hat for a scarf tied in your hair, and add a little gold — hoops or a slim bracelet.

## The look: dinner

This is where a black one-piece earns its place. Pull on a long skirt or wide-leg trousers, add heels or elegant flat sandals, and let the neckline detail stand out. A wrap skirt tied at the hip turns a swimsuit into evening wear in under a minute.

## A few rules

- Choose one statement: a bold print, a metallic, or a striking neckline. Keep everything else quiet.
- Warm metals and neutral tones sit beautifully against sun-kissed skin.
- Pack light. A great swimsuit and two versatile layers go a long way.

Style on the islands is less about what you wear and more about how easily you wear it.`
		}
	] as PostSpec[],

	/**
	 * The same posts in other languages. The content plugin has no languages, so each language is a
	 * collection of its own with the same post slugs (see journalCollections in src/lib/site.ts).
	 */
	translations: { el: greekJournal } as Record<
		string,
		{ collection: { label: string; slug: string; format: 'md' }; slugSuffix: string; posts: Record<string, PostTranslation> }
	>
};
