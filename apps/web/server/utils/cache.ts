import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { apiCache } from '../database/schema'

/**
 * D1-backed response cache using the api_cache table.
 *
 * getCachedResponse — returns cached string if still valid, null otherwise
 * setCachedResponse — upserts a cache entry with the given TTL (ms)
 */

export async function getCachedResponse(event: H3Event, key: string): Promise<string | null> {
  const db = useDatabase(event)
  const now = Date.now()

  const row = await db.select().from(apiCache).where(eq(apiCache.key, key)).get()

  if (!row) return null
  if (row.expiresAt < now) return null

  return row.data
}

export async function setCachedResponse(
  event: H3Event,
  key: string,
  value: string,
  ttlMs: number,
): Promise<void> {
  const db = useDatabase(event)
  const now = Date.now()
  const expiresAt = now + ttlMs

  await db
    .insert(apiCache)
    .values({ key, data: value, expiresAt, createdAt: now })
    .onConflictDoUpdate({
      target: apiCache.key,
      set: { data: value, expiresAt },
    })
    .run()
}
