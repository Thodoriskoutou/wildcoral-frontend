/**
 * A deliberately small, process-local cache for public storefront data. It is not
 * a replacement for Redis: a purge only reaches this process, which is why the
 * production deployment must stay single-replica until the store is swapped out.
 */
export type CacheNamespace = 'journal' | 'product'

type Entry = { value: unknown; expiresAt: number }

const MAX_ENTRIES_PER_NAMESPACE = 500
const entries: Record<CacheNamespace, Map<string, Entry>> = {
	journal: new Map(),
	product: new Map()
}
const inFlight = new Map<string, Promise<unknown>>()

export function stableKey(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined'
	if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`
	const record = value as Record<string, unknown>
	return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableKey(record[key])}`).join(',')}}`
}

function cacheId(namespace: CacheNamespace, key: string) {
	return `${namespace}:${key}`
}

export async function cached<T>(namespace: CacheNamespace, ttlSeconds: number, key: string, load: () => Promise<T>): Promise<T> {
	if (ttlSeconds <= 0) return load()

	const now = Date.now()
	const store = entries[namespace]
	const found = store.get(key)
	if (found && found.expiresAt > now) {
		// Refresh insertion order for the LRU eviction below.
		store.delete(key)
		store.set(key, found)
		return found.value as T
	}
	if (found) store.delete(key)

	const id = cacheId(namespace, key)
	const existing = inFlight.get(id)
	if (existing) return existing as Promise<T>

	const request = load().then((value) => {
		store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
		while (store.size > MAX_ENTRIES_PER_NAMESPACE) store.delete(store.keys().next().value!)
		return value
	})
	inFlight.set(id, request)
	try {
		return await request
	} finally {
		inFlight.delete(id)
	}
}

export function clearCache(namespace: CacheNamespace) {
	entries[namespace].clear()
	for (const key of inFlight.keys()) {
		if (key.startsWith(`${namespace}:`)) inFlight.delete(key)
	}
}
