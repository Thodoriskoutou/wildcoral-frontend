import { query } from '$app/server'
import * as v from 'valibot'
import { getLocale } from '#lib/i18n/index.js'
import { getMedusaContext } from 'sveltekit-medusa-sdk/server'
import { JOURNAL_CACHE_TTL_SECONDS } from '$app/env/private'
import { cached, stableKey } from '#lib/server/ttl-cache.js'

const listArgs = v.object({ slug: v.pipe(v.string(), v.nonEmpty()), tag: v.optional(v.string()), q: v.optional(v.string()), limit: v.optional(v.number()), offset: v.optional(v.number()) })
const itemArgs = v.object({ slug: v.pipe(v.string(), v.nonEmpty()), itemSlug: v.pipe(v.string(), v.nonEmpty()), render: v.optional(v.picklist(['html'])) })
const defined = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
const key = (kind: string, args: unknown) => stableKey({ kind, locale: getLocale(), args })

export const getContentItemsQuery = query(listArgs, async (args) => {
	const context = getMedusaContext()
	const { slug, ...params } = args
	return cached('journal', JOURNAL_CACHE_TTL_SECONDS, key('items', args), () => context.client.store.content.listItems(slug, defined(params), context.headers()))
})

export const getContentItemQuery = query(itemArgs, async (args) => {
	const context = getMedusaContext()
	return cached('journal', JOURNAL_CACHE_TTL_SECONDS, key('item', args), () => context.client.store.content.retrieveItem(args.slug, args.itemSlug, defined({ render: args.render }), context.headers()))
})
