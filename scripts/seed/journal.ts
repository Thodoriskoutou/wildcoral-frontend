/**
 * Sets up the Journal in Medusa's content plugin (medusa-plugin-content): the "journal" collection,
 * its custom fields, an author, and the starter posts from ./journal-catalog.ts.
 *
 *   npm run seed:journal:dry      # checks the catalog, shows the plan — no login, sends nothing
 *   npm run seed:journal          # creates everything as DRAFTS you can review in Medusa
 *   npm run seed:journal -- --publish   # creates them already published
 *
 * Safe to re-run: an existing collection, field, author or post (matched by slug/name) is left
 * alone. Your login comes from environment variables in your own terminal, never from a file.
 */
import fs from 'node:fs';
import path from 'node:path';
import type Medusa from '@medusajs/js-sdk';
import { journal, type PostSpec } from './journal-catalog.ts';
import { ROOT, say, fail, explain, connect } from './common.ts';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const PUBLISH = argv.includes('--publish');

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------------------------
// Plan + validation (no network)
// ---------------------------------------------------------------------------------------------

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(posts: PostSpec[]): string[] {
	const problems: string[] = [];
	if (!SLUG.test(journal.collection.slug)) problems.push(`Collection slug "${journal.collection.slug}" must be lowercase letters, numbers and hyphens.`);
	const seen = new Set<string>();
	for (const p of posts) {
		if (!SLUG.test(p.slug)) problems.push(`${p.title}: slug "${p.slug}" must be lowercase letters, numbers and hyphens.`);
		if (seen.has(p.slug)) problems.push(`${p.title}: duplicate slug "${p.slug}".`);
		seen.add(p.slug);
		if (!p.body.trim()) problems.push(`${p.title}: empty body.`);
		if (p.cover.startsWith('/')) {
			const file = path.join(ROOT, journal.photosDir, p.cover);
			if (!fs.existsSync(file)) problems.push(`${p.title}: cover image not found: ${journal.photosDir}${p.cover}`);
		}
	}
	for (const [code, translation] of Object.entries(journal.translations)) {
		if (!SLUG.test(translation.collection.slug)) problems.push(`${code}: collection slug "${translation.collection.slug}" must be lowercase letters, numbers and hyphens.`);
		for (const slug of Object.keys(translation.posts)) {
			if (!seen.has(slug)) problems.push(`${code}: translated post "${slug}" has no original post with that slug.`);
		}
		for (const p of posts) {
			if (!translation.posts[p.slug]) problems.push(`${code}: post "${p.slug}" has no translation (it will be shown in the original language).`);
		}
	}
	return problems;
}

/**
 * The post as it is created in another language: its texts replaced, everything else kept, and the slug
 * given the language's suffix (the content plugin finds a post by its slug alone, see src/lib/site.ts).
 */
function translated(post: PostSpec, translation: (typeof journal.translations)[string]): PostSpec {
	const texts = translation.posts[post.slug];
	return texts ? { ...post, ...texts, slug: post.slug + translation.slugSuffix } : post;
}

function printPlan(posts: PostSpec[]) {
	say(`Collection: "${journal.collection.label}" (/${journal.collection.slug}, format ${journal.collection.format})`);
	say(`Fields: ${journal.fields.map((f) => f.name).join(', ')}`);
	say(`Author: ${journal.creator.name}`);
	say(`Posts: ${posts.length}, created as ${PUBLISH ? 'PUBLISHED' : 'drafts'}\n`);
	for (const p of posts) {
		say(`• ${p.title}  (/journal/${p.slug})${p.featured ? '  [featured]' : ''}`);
		say(`    ${p.category} · tags: ${p.tags.join(', ')} · products: ${p.products.join(', ') || '(newest)'} · ${p.body.split(/\s+/).length} words`);
	}
	for (const [code, translation] of Object.entries(journal.translations)) {
		say(`Translation ${code}: collection "${translation.collection.label}" (/${translation.collection.slug}), ${Object.keys(translation.posts).length} posts`);
	}
	say();
}

// ---------------------------------------------------------------------------------------------
// Talking to the plugin. Its admin responses aren't documented in detail, so everything here
// reads them defensively: find the list in whatever key it arrives under, and re-list to find an
// id when a create call doesn't hand one back.
// ---------------------------------------------------------------------------------------------

const call = <T = unknown>(sdk: Medusa, method: 'GET' | 'POST', route: string, opts: { query?: Row; body?: Row } = {}) =>
	sdk.client.fetch<T>(route, { method, ...(opts.query ? { query: opts.query } : {}), ...(opts.body ? { body: opts.body } : {}) });

/** The array of rows in a list response, whatever key it is under. */
function rowsOf(res: unknown, preferredKey: string): Row[] {
	const r = (res ?? {}) as Row;
	if (Array.isArray(r[preferredKey])) return r[preferredKey] as Row[];
	const firstArray = Object.values(r).find((v) => Array.isArray(v) && (v.length === 0 || typeof v[0] === 'object'));
	return (firstArray as Row[] | undefined) ?? [];
}

/** An id from a create response: either `{ <key>: { id } }` or `{ id }`; undefined if absent. */
function idOf(res: unknown, key: string): string | undefined {
	const r = (res ?? {}) as Row;
	const nested = r[key] as Row | undefined;
	return (typeof nested?.id === 'string' ? nested.id : undefined) ?? (typeof r.id === 'string' ? r.id : undefined);
}

async function seed(sdk: Medusa, posts: PostSpec[], collectionSpec: { label: string; slug: string; format: 'md' } = journal.collection) {
	// --- collection --------------------------------------------------------------------------
	const findCollection = async () =>
		rowsOf(await call(sdk, 'GET', '/admin/content', { query: { q: collectionSpec.slug, limit: 100 } }), 'content_collections').find(
			(c) => c.slug === collectionSpec.slug
		);

	let collection = await findCollection();
	if (collection) {
		say(`Collection "${collectionSpec.slug}": exists`);
	} else {
		const created = await call(sdk, 'POST', '/admin/content', { body: { ...collectionSpec } });
		const createdId = idOf(created, 'content_collection');
		collection = (await findCollection()) ?? (createdId ? { id: createdId } : undefined);
		if (!collection) throw new Error('The collection was created but could not be found again.');
		say(`Collection "${collectionSpec.slug}": created`);
	}
	const collectionId = String(collection.id);

	// --- fields ------------------------------------------------------------------------------
	const existingFields = new Set(
		rowsOf(await call(sdk, 'GET', `/admin/content/${collectionId}/fields`, { query: { limit: 100 } }), 'content_fields').map((f) => String(f.name))
	);
	let order = 0;
	for (const field of journal.fields) {
		order++;
		if (existingFields.has(field.name)) continue;
		await call(sdk, 'POST', `/admin/content/${collectionId}/fields`, {
			body: { name: field.name, label: field.label, field_type: field.field_type, default_value: field.default_value, required: false, sort_order: order }
		});
		say(`Field "${field.name}": created`);
	}

	// --- author ------------------------------------------------------------------------------
	const findCreator = async () =>
		rowsOf(await call(sdk, 'GET', '/admin/content-creators', { query: { q: journal.creator.name, limit: 100 } }), 'content_creators').find(
			(c) => String(c.name).toLowerCase() === journal.creator.name.toLowerCase()
		);
	let creator = await findCreator();
	if (!creator) {
		const created = await call(sdk, 'POST', '/admin/content-creators', { body: { ...journal.creator } });
		const createdId = idOf(created, 'content_creator');
		creator = (await findCreator()) ?? (createdId ? { id: createdId } : undefined);
		say(`Author "${journal.creator.name}": created`);
	} else {
		say(`Author "${journal.creator.name}": exists`);
	}
	const creatorId = creator ? String(creator.id) : null;
	say();

	// --- posts -------------------------------------------------------------------------------
	const listItems = async () => rowsOf(await call(sdk, 'GET', `/admin/content/${collectionId}/items`, { query: { limit: 200 } }), 'content_items');
	const existing = new Map((await listItems()).map((i) => [String(i.slug), i]));

	const created: string[] = [];
	const skipped: string[] = [];
	const failed: { title: string; error: string }[] = [];
	const now = Date.now();

	for (const [index, post] of posts.entries()) {
		try {
			if (existing.has(post.slug)) {
				say(`- ${post.title}: already exists, skipped`);
				skipped.push(post.title);
				continue;
			}

			const res = await call(sdk, 'POST', `/admin/content/${collectionId}/items`, {
				body: {
					title: post.title,
					slug: post.slug,
					creator_id: creatorId,
					body: post.body,
					status: PUBLISH ? 'published' : 'draft',
					// Stagger publish dates a day apart (newest first in the list order) when publishing.
					...(PUBLISH ? { published_at: new Date(now - index * 86_400_000).toISOString() } : {}),
					metadata: {
						excerpt: post.excerpt,
						cover_image: post.cover,
						category: post.category,
						featured: post.featured === true,
						products: post.products.join(', ')
					}
				}
			});
			const itemId = idOf(res, 'content_item') ?? String((await listItems()).find((i) => i.slug === post.slug)?.id ?? '');
			if (!itemId) throw new Error('The post was created but its id could not be found, so its tags were not added.');

			for (const tag of post.tags) {
				try {
					await call(sdk, 'POST', `/admin/content/${collectionId}/items/${itemId}/tags`, { body: { value: tag } });
				} catch (e) {
					say(`    (tag "${tag}" not added: ${explain(e)})`);
				}
			}
			say(`- ${post.title}: created (${PUBLISH ? 'published' : 'draft'}, ${post.tags.length} tags)`);
			created.push(post.title);
		} catch (e) {
			say(`- ${post.title}: ✗ failed: ${explain(e)}`);
			failed.push({ title: post.title, error: explain(e) });
		}
	}

	// --- report ------------------------------------------------------------------------------
	say('\n──────── Done ────────');
	say(`Created: ${created.length}${created.length ? ' — ' + created.join(', ') : ''}`);
	if (skipped.length) say(`Skipped (already there): ${skipped.join(', ')}`);
	if (failed.length) {
		say(`Failed: ${failed.length}`);
		for (const f of failed) say(`  • ${f.title}: ${f.error}`);
	}
	if (created.length && !PUBLISH) {
		say('\nThe posts are drafts. Open Content → Journal in the Medusa admin, read them over, and set each one to');
		say('Published (or run again with --publish for new posts). Published posts appear on /journal straight away.');
	} else if (created.length) {
		say('\nReload the site: the posts are on /journal now.');
	}
	if (failed.length) process.exit(1);
}

// ---------------------------------------------------------------------------------------------

const posts = journal.posts;
printPlan(posts);

const problems = validate(posts);
if (problems.length) {
	console.error('Fix these first:');
	for (const p of problems) console.error(`  ✗ ${p}`);
	process.exit(1);
}

if (DRY_RUN) {
	say('Dry run: the journal catalog looks good and nothing was sent to Medusa.');
} else {
	const sdk = await connect();
	try {
		await seed(sdk, posts);
		for (const [code, translation] of Object.entries(journal.translations)) {
			say(`\n=== ${code}: ${translation.collection.label} ===`);
			await seed(sdk, posts.map((post) => translated(post, translation)), translation.collection);
		}
	} catch (e) {
		fail(`Could not finish: ${explain(e)}`);
	}
}
