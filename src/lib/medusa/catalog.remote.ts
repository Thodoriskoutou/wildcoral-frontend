import { query } from '$app/server'
import * as v from 'valibot'
import { getLocale } from '#lib/i18n/index.js'
import { getMedusaContext } from 'sveltekit-medusa-sdk/server'
import { cached, stableKey } from '#lib/server/ttl-cache.js'
import { PRODUCT_CACHE_TTL_SECONDS } from '$app/env/private'

const identifier = v.object({ id: v.optional(v.string()), slug: v.optional(v.string()) })
const list = v.optional(v.object({
	limit: v.optional(v.number()), offset: v.optional(v.number()), order: v.optional(v.string()), q: v.optional(v.string()), fields: v.optional(v.string()),
	region_id: v.optional(v.string()), country_code: v.optional(v.string()), category_id: v.optional(v.union([v.string(), v.array(v.string())])),
	collection_id: v.optional(v.union([v.string(), v.array(v.string())])), type_id: v.optional(v.union([v.string(), v.array(v.string())])),
	parent_category_id: v.optional(v.string())
}), {})
const product = v.object({ id: v.optional(v.string()), slug: v.optional(v.string()), region_id: v.optional(v.string()), country_code: v.optional(v.string()), fields: v.optional(v.string()) })

const defined = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
const key = (kind: string, args: unknown, region = '') => stableKey({ kind, locale: getLocale(), region, args })

async function regionFor(args: { region_id?: string; country_code?: string }) {
	const context = getMedusaContext()
	return { context, region_id: args.region_id ?? context.region_id, country_code: args.country_code ?? context.country_code }
}

export const getProductsQuery = query(list, async (args) => {
	const { context, region_id, country_code } = await regionFor(args)
	const cacheKey = key('products', args, `${region_id}:${country_code}`)
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, cacheKey, async () => {
		const result = await context.client.store.product.list(defined({ ...args, region_id: region_id || undefined, country_code: country_code || undefined }), context.headers())
		return { products: result.products, count: result.count, limit: result.limit, offset: result.offset }
	})
})

export const getProductQuery = query(product, async (args) => {
	if (!args.id && !args.slug) return null
	const { context, region_id, country_code } = await regionFor(args)
	const cacheKey = key('product', args, `${region_id}:${country_code}`)
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, cacheKey, async () => {
		const params = defined({ region_id: region_id || undefined, country_code: country_code || undefined, fields: args.fields })
		if (args.id) return (await context.client.store.product.retrieve(args.id, params, context.headers())).product
		const result = await context.client.store.product.list(defined({ handle: args.slug, ...params }), context.headers())
		return result.products[0] ?? null
	})
})

export const getProductCategoriesQuery = query(list, async (args) => {
	const context = getMedusaContext()
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, key('categories', args), async () => {
		const result = await context.client.store.category.list(defined(args), context.headers())
		return { product_categories: result.product_categories, count: result.count, limit: result.limit, offset: result.offset }
	})
})

export const getProductCategoryQuery = query(identifier, async (args) => {
	if (!args.id && !args.slug) return null
	const context = getMedusaContext()
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, key('category', args), async () => {
		if (args.id) return (await context.client.store.category.retrieve(args.id, {}, context.headers())).product_category
		const result = await context.client.store.category.list({ handle: args.slug }, context.headers())
		return result.product_categories[0] ?? null
	})
})

export const getCollectionsQuery = query(list, async (args) => {
	const context = getMedusaContext()
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, key('collections', args), async () => {
		const result = await context.client.store.collection.list(defined(args), context.headers())
		return { collections: result.collections, count: result.count, limit: result.limit, offset: result.offset }
	})
})

export const getCollectionQuery = query(identifier, async (args) => {
	if (!args.id && !args.slug) return null
	const context = getMedusaContext()
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, key('collection', args), async () => {
		if (args.id) return (await context.client.store.collection.retrieve(args.id, {}, context.headers())).collection
		const result = await context.client.store.collection.list({ handle: args.slug }, context.headers())
		return result.collections[0] ?? null
	})
})

export const getRegionsQuery = query(async () => {
	const context = getMedusaContext()
	return cached('product', PRODUCT_CACHE_TTL_SECONDS, key('regions', {}), async () => {
		const result = await context.client.store.region.list({}, context.headers())
		return result.regions
	})
})
