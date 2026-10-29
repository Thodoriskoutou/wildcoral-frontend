import { timingSafeEqual } from 'node:crypto'
import { json } from '@sveltejs/kit'
import { CACHE_PURGE_TOKEN } from '$app/env/private'
import { clearCache, type CacheNamespace } from './ttl-cache.js'

function matchesToken(value: string | null) {
	if (!CACHE_PURGE_TOKEN || !value?.startsWith('Bearer ')) return false
	const received = Buffer.from(value.slice('Bearer '.length))
	const expected = Buffer.from(CACHE_PURGE_TOKEN)
	return received.length === expected.length && timingSafeEqual(received, expected)
}

export function purgeCache(namespace: CacheNamespace, authorization: string | null) {
	if (!CACHE_PURGE_TOKEN) return json({ error: 'Cache purge is not configured' }, { status: 503 })
	if (!matchesToken(authorization)) return json({ error: 'Unauthorized' }, { status: 401 })
	clearCache(namespace)
	return json({ purged: namespace })
}
