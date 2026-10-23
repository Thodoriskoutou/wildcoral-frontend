/**
 * Turns on the site's two languages in Medusa and fills in the Greek texts of the catalog (products,
 * categories, colors, tags, delivery options) with Medusa's Translation module. The English texts are
 * the ones already in Medusa; the Greek ones come from translations-catalog.ts. The module is switched
 * on in apps/backend/medusa-config.ts (feature flag "translation"), which needs Medusa 2.12 or newer.
 *
 *   pnpm run seed:translations:dry    # shows what it would translate: no login, sends nothing
 *   pnpm run seed:translations        # does it
 *
 * Safe to run again: translations that already match are left alone and changed ones are updated.
 * Your login comes from environment variables in your own terminal, never from a file (see README.md).
 * Edit or add translations later in the Medusa admin: Settings → Translations.
 */
import type Medusa from '@medusajs/js-sdk';
import { greek, english, languages } from './translations-catalog.ts';
import { say, fail, explain, connect } from './common.ts';

const DRY_RUN = process.argv.slice(2).includes('--dry-run');

type Row = Record<string, unknown>;

type Wanted = { reference: string; reference_id: string; locale_code: string; translations: Record<string, string>; label: string };

/** One Admin API request. A failure names the request, because Medusa's own message can be empty (a 404 has none). */
async function call<T = unknown>(sdk: Medusa, method: 'GET' | 'POST', route: string, opts: { query?: Row; body?: Row } = {}): Promise<T> {
	try {
		return await sdk.client.fetch<T>(route, { method, ...(opts.query ? { query: opts.query } : {}), ...(opts.body ? { body: opts.body } : {}) });
	} catch (e) {
		const { status, message } = e as { status?: number; message?: string };
		throw Object.assign(new Error(`${method} ${route}${message ? ` (${message})` : ''}`), { status });
	}
}

/** The routes below only exist when the backend has the translation feature on, so look before changing anything. */
async function checkTranslationFeature(sdk: Medusa) {
	try {
		await call(sdk, 'GET', '/admin/translations', { query: { limit: 1 } });
	} catch (e) {
		if ((e as { status?: number }).status === 404) {
			fail(
				'This backend has no translation feature (GET /admin/translations was not found), so nothing was changed. ' +
					'Deploy the backend with the "translation" feature flag and module first (apps/backend/medusa-config.ts, see apps/backend/docs/languages.md), then run this again.'
			);
		}
		throw e;
	}
}

/** Every row of a paginated admin list. */
async function listAll(sdk: Medusa, route: string, key: string, query: Row = {}): Promise<Row[]> {
	const rows: Row[] = [];
	for (let offset = 0; ; offset += 200) {
		const res = (await call<Row>(sdk, 'GET', route, { query: { ...query, limit: 200, offset } })) as Row;
		const page = (res[key] as Row[] | undefined) ?? [];
		rows.push(...page);
		if (page.length < 200) return rows;
	}
}

function printPlan() {
	say(`Languages offered by the store: ${languages.locales.join(', ')}`);
	say(`Greek (${greek.locale}):`);
	say(`  ${Object.keys(greek.categories).length} categories, ${Object.keys(greek.products).length} products, ${Object.keys(greek.options).length} options,`);
	say(`  ${Object.keys(greek.optionValues).length} colors, ${Object.keys(greek.tags).length} tags, ${Object.keys(greek.shippingOptions).length} delivery options`);
	say(`English (${english.locale}): ${Object.keys(english.returnReasons).length} return reasons (they are written in Greek)\n`);
}

async function ensureLocales(sdk: Medusa) {
	const { stores } = await call<{ stores: { id: string; supported_locales?: { locale_code: string }[] }[] }>(sdk, 'GET', '/admin/stores', {
		query: { fields: 'id,*supported_locales' }
	});
	const store = stores[0];
	if (!store) throw new Error('Medusa has no store.');
	const have = (store.supported_locales ?? []).map((l) => l.locale_code);
	const missing = languages.locales.filter((code) => !have.includes(code));
	if (!missing.length) {
		say(`Store languages: already ${have.join(', ')}`);
		return;
	}
	await call(sdk, 'POST', `/admin/stores/${store.id}`, { body: { supported_locales: [...have, ...missing].map((locale_code) => ({ locale_code })) } });
	say(`Store languages: added ${missing.join(', ')}`);
}

async function plan(sdk: Medusa): Promise<Wanted[]> {
	const wanted: Wanted[] = [];
	const add = (reference: string, row: Row | undefined, locale_code: string, translations: Record<string, string>, label: string) => {
		if (row && typeof row.id === 'string') wanted.push({ reference, reference_id: row.id, locale_code, translations, label });
	};

	const categories = await listAll(sdk, '/admin/product-categories', 'product_categories', { fields: 'id,name' });
	for (const [name, texts] of Object.entries(greek.categories)) {
		const text: Record<string, string> = { name: texts.name };
		if (texts.description) text.description = texts.description;
		add('product_category', categories.find((c) => c.name === name), greek.locale, text, `category ${name}`);
	}

	const products = await listAll(sdk, '/admin/products', 'products', { fields: 'id,handle,*options,*options.values' });
	for (const [handle, texts] of Object.entries(greek.products)) {
		const product = products.find((p) => p.handle === handle);
		const text: Record<string, string> = { title: texts.title };
		if (texts.description) text.description = texts.description;
		add('product', product, greek.locale, text, `product ${handle}`);
	}
	// options and colors, once per distinct id across all products
	const seenOptions = new Set<string>();
	for (const product of products) {
		if (!greek.products[String(product.handle)]) continue;
		for (const option of (product.options as Row[] | undefined) ?? []) {
			const title = greek.options[String(option.title)];
			if (title && !seenOptions.has(String(option.id))) {
				seenOptions.add(String(option.id));
				add('product_option', option, greek.locale, { title }, `option ${option.title} (${product.handle})`);
			}
			for (const value of (option.values as Row[] | undefined) ?? []) {
				const text = greek.optionValues[String(value.value)];
				if (text && !seenOptions.has(String(value.id))) {
					seenOptions.add(String(value.id));
					add('product_option_value', value, greek.locale, { value: text }, `color ${value.value} (${product.handle})`);
				}
			}
		}
	}

	for (const tag of await listAll(sdk, '/admin/product-tags', 'product_tags')) {
		const text = greek.tags[String(tag.value)];
		if (text) add('product_tag', tag, greek.locale, { value: text }, `tag ${tag.value}`);
	}
	for (const option of await listAll(sdk, '/admin/shipping-options', 'shipping_options', { fields: 'id,name' })) {
		const text = greek.shippingOptions[String(option.name)];
		if (text) add('shipping_option', option, greek.locale, { name: text }, `delivery option ${option.name}`);
	}
	for (const reason of await listAll(sdk, '/admin/return-reasons', 'return_reasons')) {
		const text = english.returnReasons[String(reason.value)];
		if (text) add('return_reason', reason, english.locale, text, `return reason ${reason.value}`);
	}
	return wanted;
}

async function apply(sdk: Medusa, wanted: Wanted[]) {
	const existing = new Map<string, Row>();
	for (const code of new Set(wanted.map((w) => w.locale_code))) {
		for (const t of await listAll(sdk, '/admin/translations', 'translations', { locale_code: code })) {
			existing.set(`${t.reference}:${t.reference_id}:${t.locale_code}`, t);
		}
	}

	const create: Row[] = [];
	const update: Row[] = [];
	let same = 0;
	for (const w of wanted) {
		const found = existing.get(`${w.reference}:${w.reference_id}:${w.locale_code}`);
		const body = { reference: w.reference, reference_id: w.reference_id, locale_code: w.locale_code, translations: w.translations };
		if (!found) create.push(body);
		else {
			const current = (found.translations ?? {}) as Record<string, string>;
			if (Object.entries(w.translations).every(([k, v]) => current[k] === v)) same++;
			else update.push({ id: found.id, translations: { ...current, ...w.translations } });
		}
	}

	for (let i = 0; i < Math.max(create.length, update.length); i += 50) {
		await call(sdk, 'POST', '/admin/translations/batch', { body: { create: create.slice(i, i + 50), update: update.slice(i, i + 50) } });
	}
	say(`Translations: ${create.length} created, ${update.length} updated, ${same} already up to date`);
}

printPlan();

if (DRY_RUN) {
	say('Dry run: nothing was sent to Medusa.');
} else {
	const sdk = await connect();
	try {
		await checkTranslationFeature(sdk);
		await ensureLocales(sdk);
		const wanted = await plan(sdk);
		const wantedProducts = Object.keys(greek.products).length;
		const found = wanted.filter((w) => w.reference === 'product').length;
		if (found < wantedProducts) say(`Note: ${wantedProducts - found} of the ${wantedProducts} products are not in Medusa yet. Run the catalog seed first (seed.ts), then this again.`);
		await apply(sdk, wanted);
		say('\nDone. Reload the site in Greek (/el): products, categories, colors and tags are translated.');
	} catch (e) {
		fail(`Could not finish: ${explain(e)}`);
	}
}
