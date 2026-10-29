import { t, formatDate, getLocale, defaultLocale, msg } from '#lib/i18n/index.js'
import { getContentItemsQuery, getContentItemQuery } from './journal.remote.js'
import { site } from '#lib/site.js'
import type { ContentItem } from 'medusa-js-sdk';

/**
 * Turns posts from the Medusa content plugin (`medusa-plugin-content`) into what the Journal pages
 * render. The plugin stores each post's custom fields in `metadata`, so the collection is expected
 * to define these optional fields (the seed tool in scripts/seed/journal.ts creates them):
 *
 *   excerpt      short summary for cards      (falls back to the first paragraph of the post)
 *   cover_image  image URL for cards / hero    (falls back to the first image inside the post)
 *   category     label shown above the title   (falls back to the first tag, then "Journal")
 *   featured     true → shown as the big hero  (falls back to the newest post)
 *   products     product handles, comma-separated, for the "Shop the Story" strip
 *                                              (falls back to the newest products)
 */

export interface Post {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	category: string;
	cover: string | null;
	/** Formatted publish date, e.g. "5 March 2026". */
	date: string;
	/** Publish time as a number, for sorting newest-first. */
	time: number;
	tags: string[];
	author: { name: string; bio: string | null; avatar: string | null } | null;
	readMinutes: number;
	featured: boolean;
	/** Product handles chosen for this post (may be empty). */
	productHandles: string[];
	/** Markdown source. */
	body: string;
	/** Sanitized HTML, only present when the post was fetched with `render: 'html'`. */
	bodyHtml: string | null;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const truthy = (v: unknown): boolean => v === true || (typeof v === 'string' && /^(true|yes|1)$/i.test(v.trim()));

/** Markdown → plain text (good enough for an excerpt). */
function plainText(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^>\s?/gm, '')
		.replace(/[*_`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function firstParagraph(markdown: string): string {
	const blocks = markdown.split(/\n\s*\n/).map(plainText).filter(Boolean);
	// skip a leading heading-only block: it was stripped to text, so prefer the first longer block
	const paragraph = blocks.find((b) => b.length > 60) ?? blocks[0] ?? '';
	return paragraph.length > 180 ? `${paragraph.slice(0, 177).trimEnd()}…` : paragraph;
}

function firstImage(markdown: string): string | null {
	return /!\[[^\]]*\]\(([^)\s]+)/.exec(markdown)?.[1] ?? null;
}

export function toPost(item: ContentItem): Post {
	const meta = (item.metadata ?? {}) as Record<string, unknown>;
	const body = item.body ?? '';
	const tags = (item.tags ?? []).map((t) => t.value);

	return {
		id: item.id,
		slug: item.slug,
		title: item.title,
		excerpt: str(meta.excerpt) || firstParagraph(body),
		category: str(meta.category) || tags[0] || t('Journal'),
		cover: str(meta.cover_image) || str(meta.cover) || firstImage(body),
		date: formatDate(item.published_at ?? item.created_at),
		time: Date.parse(item.published_at ?? item.created_at) || 0,
		tags,
		author: item.creator
			? { name: item.creator.name, bio: item.creator.bio ?? null, avatar: item.creator.avatar_url ?? null }
			: null,
		readMinutes: Math.max(1, Math.round(plainText(body).split(' ').filter(Boolean).length / 220)),
		featured: truthy(meta.featured),
		productHandles: str(meta.products)
			.split(/[\s,]+/)
			.filter(Boolean)
			.slice(0, 3),
		body,
		bodyHtml: item.body_html ?? null
	};
}

// Author bios are CMS text shown through t(...) (see the journal page); this marks the default one for translation.
export const DEFAULT_AUTHOR_BIO = msg('Style notes, guides and summer inspiration from the Wild Coral team.');

/** The post to feature in the hero: one marked `featured`, otherwise the newest. */
export function pickFeatured(posts: Post[]): Post | undefined {
	return posts.find((p) => p.featured) ?? posts[0];
}

/** The collection with the posts in the visitor's language, when the site has one (see site.journalCollections). */
function translatedCollection(): { collection: string; slugSuffix: string } | undefined {
	const locale = getLocale();
	return locale === defaultLocale ? undefined : site.journalCollections[locale];
}

/** The post as the site addresses it: the translation keeps the original's slug in the address. */
function withOriginalSlug(item: ContentItem, suffix: string): ContentItem {
	return item.slug.endsWith(suffix) ? { ...item, slug: item.slug.slice(0, -suffix.length) } : item;
}

/**
 * Published posts in the visitor's language: the translated collection's, plus those of the default
 * language that have no translation yet (matched by slug), so nothing disappears from a page. A
 * translated collection that does not exist (yet) or can't be read simply adds nothing.
 */
export async function listJournalItems(limit: number): Promise<ContentItem[]> {
	const original = await getContentItemsQuery({ slug: site.journalCollection, limit });
	const translated = translatedCollection();
	if (!translated) return original.content_items;

	const own = await getContentItemsQuery({ slug: translated.collection, limit }).then(
		(res) => res.content_items.map((item) => withOriginalSlug(item, translated.slugSuffix)),
		() => [] as ContentItem[]
	);
	const translatedSlugs = new Set(own.map((item) => item.slug));
	return [...own, ...original.content_items.filter((item) => !translatedSlugs.has(item.slug))];
}

/** One post in the visitor's language, falling back to the default language. */
export async function readJournalItem(itemSlug: string, render?: 'html') {
	const extra = render ? { render } : {};
	const translated = translatedCollection();
	if (translated) {
		const found = await getContentItemQuery({ slug: translated.collection, itemSlug: itemSlug + translated.slugSuffix, ...extra }).catch(() => null);
		if (found) return { ...found, content_item: withOriginalSlug(found.content_item, translated.slugSuffix) };
	}
	return getContentItemQuery({ slug: site.journalCollection, itemSlug, ...extra });
}
