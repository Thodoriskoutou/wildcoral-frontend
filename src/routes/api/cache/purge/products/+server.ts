import type { RequestHandler } from './$types'
import { purgeCache } from '#lib/server/cache-purge.js'

export const POST: RequestHandler = ({ request }) => purgeCache('product', request.headers.get('authorization'))
